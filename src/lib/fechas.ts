import { MS_POR_DIA } from '../constants/biblioteca';

export function sumarDias(desde: number, dias: number): number {
  return desde + dias * MS_POR_DIA;
}

export function formatearFecha(ms: number): string {
  return new Date(ms).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
