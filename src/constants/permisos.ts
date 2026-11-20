import type { Recurso } from '../types/permisos';

export const TITULO_PERMISO: Record<Recurso, string> = {
  camara: 'Cámara',
  notificaciones: 'Notificaciones',
};

export const BENEFICIO_PERMISO: Record<Recurso, string> = {
  camara: 'Usamos tu cámara para leer el código de barras del libro y abrirlo al instante.',
  notificaciones: 'Usamos las notificaciones para recordarte cuándo devolver un libro y avisarte cuando te lo entregan.',
};
