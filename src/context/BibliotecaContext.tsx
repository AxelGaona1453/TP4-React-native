import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  CLAVE_PERSONAL,
  DIAS_PRESTAMO,
  NOMBRE_USUARIO_ACTUAL,
  USUARIO_PERSONAL,
} from '../constants/biblioteca';
import { ESPERA_INICIAL } from '../data/esperaInicial';
import { Cola } from '../estructuras/Cola';
import { Pila } from '../estructuras/Pila';
import { guardarEstado, leerEstado } from '../lib/almacenamiento';
import {
  calcularDisponibles,
  copiarCola,
  copiarPila,
  limpiarRecordatoriosVencidos,
  posicionEnCola,
} from '../lib/biblioteca';
import { sumarDias } from '../lib/fechas';
import {
  cancelarNotificacion,
  escucharNotificacionRecibida,
  idsNotificacionesProgramadas,
  notificarLibroEntregado,
  programarRecordatorioDevolucion,
  tienePermisoNotificaciones,
} from '../lib/notificaciones';
import type { Libro } from '../types';
import type {
  Aviso,
  Prestamo,
  ResultadoEntrega,
  ResultadoRecordatorio,
  ResultadoReserva,
} from '../types/biblioteca';

const DEMORA_GUARDADO_MS = 200;

type Esperas = Record<string, Cola<string>>;

export type ValorBiblioteca = {
  listo: boolean;
  prestamos: Prestamo[];
  esperas: Esperas;
  recientes: Pila<Libro>;
  avisos: Aviso[];
  sesionIniciada: boolean;
  disponiblesDe: (libro: Libro) => number;
  posicionDe: (isbn: string) => number | null;
  registrarVisto: (libro: Libro) => void;
  reservar: (libro: Libro) => ResultadoReserva;
  devolver: (isbn: string) => void;
  activarRecordatorio: (isbn: string) => Promise<ResultadoRecordatorio>;
  desactivarRecordatorio: (isbn: string) => void;
  entregarAlSiguiente: (isbn: string, titulo: string) => Promise<ResultadoEntrega>;
  iniciarSesion: (usuario: string, clave: string) => boolean;
  cerrarSesion: () => void;
  descartarAviso: (id: string) => void;
};

export const BibliotecaContext = createContext<ValorBiblioteca | null>(null);

function crearEsperasIniciales(origen: Record<string, string[]>): Esperas {
  const esperas: Esperas = {};
  for (const [isbn, personas] of Object.entries(origen)) {
    esperas[isbn] = new Cola(personas);
  }
  return esperas;
}

function serializarEsperas(esperas: Esperas): Record<string, string[]> {
  const resultado: Record<string, string[]> = {};
  for (const [isbn, cola] of Object.entries(esperas)) {
    resultado[isbn] = cola.aArray();
  }
  return resultado;
}

function crearAviso(texto: string): Aviso {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, texto };
}

export function BibliotecaProvider({ children }: { children: ReactNode }) {
  const [listo, setListo] = useState(false);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [esperas, setEsperas] = useState<Esperas>(() => crearEsperasIniciales(ESPERA_INICIAL));
  const [recientes, setRecientes] = useState<Pila<Libro>>(() => new Pila<Libro>());
  const [devueltosAlEstante, setDevueltosAlEstante] = useState<Record<string, number>>({});
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [sesionIniciada, setSesionIniciada] = useState(false);

  useEffect(() => {
    let cancelado = false;
    Promise.all([leerEstado(), idsNotificacionesProgramadas()]).then(([guardado, programadas]) => {
      if (cancelado) {
        return;
      }
      if (guardado) {
        setPrestamos(limpiarRecordatoriosVencidos(guardado.prestamos, programadas));
        setEsperas(crearEsperasIniciales(guardado.esperas));
        setRecientes(new Pila(guardado.recientes));
        setDevueltosAlEstante(guardado.devueltosAlEstante);
        setAvisos(guardado.avisos);
      }
      setListo(true);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  // Cuando el recordatorio llega con la app abierta, el interruptor vuelve a apagarse.
  useEffect(
    () =>
      escucharNotificacionRecibida((id) => {
        setPrestamos((anteriores) =>
          anteriores.map((p) => (p.notificacionId === id ? { ...p, notificacionId: null } : p)),
        );
      }),
    [],
  );

  useEffect(() => {
    if (!listo) {
      return;
    }
    const temporizador = setTimeout(() => {
      guardarEstado({
        prestamos,
        esperas: serializarEsperas(esperas),
        recientes: recientes.aArray(),
        devueltosAlEstante,
        avisos,
      });
    }, DEMORA_GUARDADO_MS);
    return () => clearTimeout(temporizador);
  }, [listo, prestamos, esperas, recientes, devueltosAlEstante, avisos]);

  const disponiblesDe = useCallback(
    (libro: Libro) => calcularDisponibles(libro, prestamos, devueltosAlEstante),
    [prestamos, devueltosAlEstante],
  );

  const posicionDe = useCallback((isbn: string) => posicionEnCola(esperas[isbn]), [esperas]);

  const registrarVisto = useCallback((libro: Libro) => {
    setRecientes((anterior) => {
      if (anterior.verTope()?.isbn === libro.isbn) {
        return anterior;
      }
      const nueva = copiarPila(anterior);
      nueva.apilar(libro);
      return nueva;
    });
  }, []);

  const reservar = useCallback(
    (libro: Libro): ResultadoReserva => {
      const yaTienePrestamo = prestamos.some((p) => p.isbn === libro.isbn);
      if (yaTienePrestamo || posicionEnCola(esperas[libro.isbn]) !== null) {
        return { tipo: 'ya-reservado' };
      }
      if (calcularDisponibles(libro, prestamos, devueltosAlEstante) > 0) {
        const venceEl = sumarDias(Date.now(), DIAS_PRESTAMO);
        setPrestamos((anteriores) => [
          ...anteriores,
          { isbn: libro.isbn, titulo: libro.titulo, venceEl, origen: 'estante', notificacionId: null },
        ]);
        return { tipo: 'prestamo', venceEl };
      }
      const nueva = copiarCola(esperas[libro.isbn]);
      nueva.encolar(NOMBRE_USUARIO_ACTUAL);
      setEsperas((anteriores) => ({ ...anteriores, [libro.isbn]: nueva }));
      return { tipo: 'espera', posicion: nueva.tamanio };
    },
    [prestamos, esperas, devueltosAlEstante],
  );

  const devolver = useCallback(
    (isbn: string) => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (!prestamo) {
        return;
      }
      if (prestamo.notificacionId) {
        cancelarNotificacion(prestamo.notificacionId);
      }
      setPrestamos((anteriores) => anteriores.filter((p) => p.isbn !== isbn));
      if (prestamo.origen === 'lista-de-espera') {
        setDevueltosAlEstante((anteriores) => ({
          ...anteriores,
          [isbn]: (anteriores[isbn] ?? 0) + 1,
        }));
      }
    },
    [prestamos],
  );

  const activarRecordatorio = useCallback(
    async (isbn: string): Promise<ResultadoRecordatorio> => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (!prestamo) {
        return 'no-disponible';
      }
      if (!(await tienePermisoNotificaciones())) {
        return 'sin-permiso';
      }
      const id = await programarRecordatorioDevolucion(prestamo.titulo);
      if (id === null) {
        return 'no-disponible';
      }
      setPrestamos((anteriores) =>
        anteriores.map((p) => (p.isbn === isbn ? { ...p, notificacionId: id } : p)),
      );
      return 'activado';
    },
    [prestamos],
  );

  const desactivarRecordatorio = useCallback(
    (isbn: string) => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (prestamo?.notificacionId) {
        cancelarNotificacion(prestamo.notificacionId);
      }
      setPrestamos((anteriores) =>
        anteriores.map((p) => (p.isbn === isbn ? { ...p, notificacionId: null } : p)),
      );
    },
    [prestamos],
  );

  const entregarAlSiguiente = useCallback(
    async (isbn: string, titulo: string): Promise<ResultadoEntrega> => {
      const cola = esperas[isbn];
      if (!cola || cola.estaVacia()) {
        return { tipo: 'lista-vacia' };
      }
      const nueva = copiarCola(cola);
      const persona = nueva.desencolar();
      if (persona === undefined) {
        return { tipo: 'lista-vacia' };
      }
      setEsperas((anteriores) => ({ ...anteriores, [isbn]: nueva }));

      const esUsuarioActual = persona === NOMBRE_USUARIO_ACTUAL;
      if (esUsuarioActual) {
        setPrestamos((anteriores) => [
          ...anteriores,
          {
            isbn,
            titulo,
            venceEl: sumarDias(Date.now(), DIAS_PRESTAMO),
            origen: 'lista-de-espera',
            notificacionId: null,
          },
        ]);
        const notificado =
          (await tienePermisoNotificaciones()) && (await notificarLibroEntregado(titulo));
        if (!notificado) {
          setAvisos((anteriores) => [
            ...anteriores,
            crearAviso(`¡Te entregaron "${titulo}"! Ya figura en tus préstamos.`),
          ]);
        }
      }
      return { tipo: 'entregado', persona, esUsuarioActual };
    },
    [esperas],
  );

  const iniciarSesion = useCallback((usuario: string, clave: string) => {
    const valido = usuario.trim() === USUARIO_PERSONAL && clave === CLAVE_PERSONAL;
    if (valido) {
      setSesionIniciada(true);
    }
    return valido;
  }, []);

  const cerrarSesion = useCallback(() => setSesionIniciada(false), []);

  const descartarAviso = useCallback((id: string) => {
    setAvisos((anteriores) => anteriores.filter((a) => a.id !== id));
  }, []);

  const valor = useMemo<ValorBiblioteca>(
    () => ({
      listo,
      prestamos,
      esperas,
      recientes,
      avisos,
      sesionIniciada,
      disponiblesDe,
      posicionDe,
      registrarVisto,
      reservar,
      devolver,
      activarRecordatorio,
      desactivarRecordatorio,
      entregarAlSiguiente,
      iniciarSesion,
      cerrarSesion,
      descartarAviso,
    }),
    [
      listo,
      prestamos,
      esperas,
      recientes,
      avisos,
      sesionIniciada,
      disponiblesDe,
      posicionDe,
      registrarVisto,
      reservar,
      devolver,
      activarRecordatorio,
      desactivarRecordatorio,
      entregarAlSiguiente,
      iniciarSesion,
      cerrarSesion,
      descartarAviso,
    ],
  );

  return <BibliotecaContext.Provider value={valor}>{children}</BibliotecaContext.Provider>;
}
