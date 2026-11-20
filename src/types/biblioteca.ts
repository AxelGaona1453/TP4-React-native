export type OrigenPrestamo = 'estante' | 'lista-de-espera';

export type Prestamo = {
  isbn: string;
  titulo: string;
  venceEl: number;
  origen: OrigenPrestamo;
  notificacionId: string | null;
};

export type Aviso = {
  id: string;
  texto: string;
};

export type ResultadoReserva =
  | { tipo: 'prestamo'; venceEl: number }
  | { tipo: 'espera'; posicion: number }
  | { tipo: 'ya-reservado' };

export type ResultadoEntrega =
  | { tipo: 'lista-vacia' }
  | { tipo: 'entregado'; persona: string; esUsuarioActual: boolean };

export type ResultadoRecordatorio = 'activado' | 'sin-permiso' | 'no-disponible';
