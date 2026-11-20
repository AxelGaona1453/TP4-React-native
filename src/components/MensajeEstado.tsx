import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ESPACIADO, TAMANIO_ICONO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useColores, useEstilos } from '../hooks/useTema';

type Props = {
  icono: ComponentProps<typeof Ionicons>['name'];
  titulo: string;
  mensaje?: string;
  tono?: 'neutro' | 'error';
  children?: ReactNode;
};

// Mensaje centrado para estados de error, vacío o "no encontrado", con acciones opcionales.
export function MensajeEstado({ icono, titulo, mensaje, tono = 'neutro', children }: Props) {
  const estilos = useEstilos(crearEstilos);
  const colores = useColores();
  return (
    <View style={estilos.contenedor}>
      <Ionicons
        name={icono}
        size={TAMANIO_ICONO.estado}
        color={tono === 'error' ? colores.error : colores.textoSuave}
      />
      <Text style={estilos.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      {mensaje ? <Text style={estilos.mensaje}>{mensaje}</Text> : null}
      {children ? <View style={estilos.acciones}>{children}</View> : null}
    </View>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    contenedor: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: ESPACIADO.xl,
      gap: ESPACIADO.md,
    },
    titulo: {
      fontSize: TAMANIO_TEXTO.grande,
      fontWeight: '700',
      color: c.texto,
      textAlign: 'center',
    },
    mensaje: { fontSize: TAMANIO_TEXTO.normal, color: c.textoSuave, textAlign: 'center' },
    acciones: { gap: ESPACIADO.sm, alignSelf: 'stretch' },
  });
}
