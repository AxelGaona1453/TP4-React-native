import AsyncStorage from '@react-native-async-storage/async-storage';

import { CLAVE_ALMACENAMIENTO } from '../constants/biblioteca';
import type { Libro } from '../types';
import type { Aviso, Prestamo } from '../types/biblioteca';

// Forma serializable del estado: las clases Pila y Cola se guardan como arrays.
export type EstadoGuardado = {
  prestamos: Prestamo[];
  esperas: Record<string, string[]>;
  recientes: Libro[];
  devueltosAlEstante: Record<string, number>;
  avisos: Aviso[];
};

function esEstadoGuardado(valor: unknown): valor is EstadoGuardado {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }
  const v = valor as Record<string, unknown>;
  return (
    Array.isArray(v.prestamos) &&
    Array.isArray(v.recientes) &&
    Array.isArray(v.avisos) &&
    typeof v.esperas === 'object' &&
    typeof v.devueltosAlEstante === 'object'
  );
}

export async function leerEstado(): Promise<EstadoGuardado | null> {
  try {
    const texto = await AsyncStorage.getItem(CLAVE_ALMACENAMIENTO);
    if (texto === null) {
      return null;
    }
    const valor: unknown = JSON.parse(texto);
    return esEstadoGuardado(valor) ? valor : null;
  } catch {
    return null;
  }
}

export async function guardarEstado(estado: EstadoGuardado): Promise<void> {
  try {
    await AsyncStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(estado));
  } catch {
    // Si no se puede guardar, la app sigue funcionando con el estado en memoria.
  }
}
