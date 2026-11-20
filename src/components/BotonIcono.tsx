import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AREA_TACTIL_MINIMA, TAMANIO_ICONO } from '../constants/tema';
import { useColores } from '../hooks/useTema';

type Props = {
  icono: ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel: string;
  onPress: () => void;
};

export function BotonIcono({ icono, accessibilityLabel, onPress }: Props) {
  const colores = useColores();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [estilos.boton, pressed && estilos.presionado]}>
      <Ionicons name={icono} size={TAMANIO_ICONO.normal} color={colores.textoSuave} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minWidth: AREA_TACTIL_MINIMA,
    minHeight: AREA_TACTIL_MINIMA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: { opacity: 0.6 },
});
