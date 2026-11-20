export type Colores = {
  fondo: string;
  superficie: string;
  texto: string;
  textoSuave: string;
  primario: string;
  textoSobrePrimario: string;
  borde: string;
  error: string;
  exito: string;
  aviso: string;
  fondoAviso: string;
};

export const COLORES: { claro: Colores; oscuro: Colores } = {
  claro: {
    fondo: '#F5F7FB',
    superficie: '#FFFFFF',
    texto: '#1B1F2A',
    textoSuave: '#5B6475',
    primario: '#1E3A8A',
    textoSobrePrimario: '#FFFFFF',
    borde: '#D6DCE8',
    error: '#B42318',
    exito: '#067647',
    aviso: '#93370D',
    fondoAviso: '#FEF0C7',
  },
  oscuro: {
    fondo: '#0F1320',
    superficie: '#1A2033',
    texto: '#EEF1F8',
    textoSuave: '#A7B0C3',
    primario: '#8EA8F5',
    textoSobrePrimario: '#0F1320',
    borde: '#2E3650',
    error: '#F97066',
    exito: '#47CD89',
    aviso: '#FEC84B',
    fondoAviso: '#3A2A0B',
  },
};

export const ESPACIADO = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const TAMANIO_TEXTO = {
  chico: 13,
  normal: 16,
  grande: 20,
  titulo: 24,
} as const;

export const TAMANIO_ICONO = {
  normal: 22,
  grande: 28,
  estado: 44,
} as const;

export const RADIO = {
  sm: 6,
  md: 10,
} as const;

export const AREA_TACTIL_MINIMA = 44;

export const ANCHO_TARJETA_RECIENTE = 140;
