import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AREA_TACTIL_MINIMA, ESPACIADO, TAMANIO_ICONO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useColores, useEstilos } from '../hooks/useTema';
import type { Libro } from '../types';

type Props = {
  libro: Libro;
  onPress: (libro: Libro) => void;
};

export function FilaLibro({ libro, onPress }: Props) {
  const estilos = useEstilos(crearEstilos);
  const colores = useColores();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${libro.titulo}, de ${libro.autor}`}
      accessibilityHint="Abre el detalle del libro"
      onPress={() => onPress(libro)}
      style={({ pressed }) => [estilos.fila, pressed && estilos.presionada]}>
      <View style={estilos.textos}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.autor}>
          {libro.autor} · {libro.anio}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={TAMANIO_ICONO.normal} color={colores.textoSuave} />
    </Pressable>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    fila: {
      minHeight: AREA_TACTIL_MINIMA,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: ESPACIADO.lg,
      paddingVertical: ESPACIADO.md,
      backgroundColor: c.superficie,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borde,
    },
    presionada: { opacity: 0.7 },
    textos: { flex: 1, gap: ESPACIADO.xs },
    titulo: { fontSize: TAMANIO_TEXTO.normal, fontWeight: '600', color: c.texto },
    autor: { fontSize: TAMANIO_TEXTO.chico, color: c.textoSuave },
  });
}
