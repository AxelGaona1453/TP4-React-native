import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { COLORES, type Colores } from '../constants/tema';

export function useColores(): Colores {
  const esquema = useColorScheme();
  return esquema === 'dark' ? COLORES.oscuro : COLORES.claro;
}

// Cada archivo define `crearEstilos(colores)` con StyleSheet.create;
// este hook lo recalcula solo cuando cambia el modo claro/oscuro.
export function useEstilos<T>(crearEstilos: (colores: Colores) => T): T {
  const colores = useColores();
  return useMemo(() => crearEstilos(colores), [crearEstilos, colores]);
}
