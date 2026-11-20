import { NOMBRE_USUARIO_ACTUAL } from '../constants/biblioteca';
import { Cola } from '../estructuras/Cola';
import { Pila } from '../estructuras/Pila';
import type { Libro } from '../types';
import type { Prestamo } from '../types/biblioteca';

// Los ejemplares disponibles no se guardan: se calculan a partir del dato
// original del libro, los préstamos activos y lo devuelto al estante.
export function calcularDisponibles(
  libro: Libro,
  prestamos: readonly Prestamo[],
  devueltosAlEstante: Readonly<Record<string, number>>,
): number {
  const prestadosDelEstante = prestamos.filter(
    (p) => p.isbn === libro.isbn && p.origen === 'estante',
  ).length;
  const devueltos = devueltosAlEstante[libro.isbn] ?? 0;
  return Math.max(0, libro.ejemplares + devueltos - prestadosDelEstante);
}

// Posición (1 = al frente) del usuario actual en una cola, o null si no está.
export function posicionEnCola(cola: Cola<string> | undefined): number | null {
  if (!cola) {
    return null;
  }
  const indice = cola.aArray().indexOf(NOMBRE_USUARIO_ACTUAL);
  return indice === -1 ? null : indice + 1;
}

// Devuelve los primeros `cantidad` libros desde el tope, sin repetir ISBN.
export function recientesDesdeElTope(pila: Pila<Libro>, cantidad: number): Libro[] {
  const resultado: Libro[] = [];
  const delTopeALaBase = pila.aArray().reverse();
  for (const libro of delTopeALaBase) {
    if (resultado.length === cantidad) {
      break;
    }
    if (!resultado.some((l) => l.isbn === libro.isbn)) {
      resultado.push(libro);
    }
  }
  return resultado;
}

// Copia una cola para poder reemplazarla en el estado en vez de mutarla.
export function copiarCola<T>(cola: Cola<T> | undefined): Cola<T> {
  return new Cola<T>(cola ? cola.aArray() : []);
}

export function copiarPila<T>(pila: Pila<T>): Pila<T> {
  return new Pila<T>(pila.aArray());
}

// Quita los identificadores de recordatorios que el sistema ya no tiene programados
// (porque ya se mostraron mientras la app estaba cerrada, por ejemplo).
export function limpiarRecordatoriosVencidos(
  prestamos: Prestamo[],
  programadas: ReadonlySet<string> | null,
): Prestamo[] {
  if (programadas === null) {
    return prestamos;
  }
  return prestamos.map((p) =>
    p.notificacionId !== null && !programadas.has(p.notificacionId)
      ? { ...p, notificacionId: null }
      : p,
  );
}
