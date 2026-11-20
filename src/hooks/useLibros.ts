import { useCallback, useEffect, useState } from 'react';

import { obtenerLibros } from '../lib/api';
import type { Libro } from '../types';

export type ResultadoUseLibros = {
  libros: Libro[];
  cargando: boolean;
  error: string | null;
  reintentar: () => void;
};

const MENSAJE_ERROR = 'No pudimos cargar el catálogo. Revisá tu conexión e intentá de nuevo.';

export function useLibros(): ResultadoUseLibros {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let ignorar = false;

    async function cargar() {
      try {
        const datos = await obtenerLibros();
        if (!ignorar) {
          setLibros(datos);
        }
      } catch {
        if (!ignorar) {
          setError(MENSAJE_ERROR);
        }
      } finally {
        if (!ignorar) {
          setCargando(false);
        }
      }
    }

    cargar();
    return () => {
      ignorar = true;
    };
  }, [intento]);

  const reintentar = useCallback(() => {
    setError(null);
    setCargando(true);
    setIntento((n) => n + 1);
  }, []);

  return { libros, cargando, error, reintentar };
}
