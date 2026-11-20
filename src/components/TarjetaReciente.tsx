import { Pressable, StyleSheet, Text } from 'react-native';

import { ANCHO_TARJETA_RECIENTE, AREA_TACTIL_MINIMA, ESPACIADO, RADIO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useEstilos } from '../hooks/useTema';
import type { Libro } from '../types';

type Props = {
  libro: Libro;
  onPress: (libro: Libro) => void;
};

export function TarjetaReciente({ libro, onPress }: Props) {
  const estilos = useEstilos(crearEstilos);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Visto recientemente: ${libro.titulo}`}
      onPress={() => onPress(libro)}
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.presionada]}>
      <Text style={estilos.titulo} numberOfLines={2}>
        {libro.titulo}
      </Text>
      <Text style={estilos.autor} numberOfLines={1}>
        {libro.autor}
      </Text>
    </Pressable>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    tarjeta: {
      width: ANCHO_TARJETA_RECIENTE,
      minHeight: AREA_TACTIL_MINIMA,
      padding: ESPACIADO.md,
      gap: ESPACIADO.xs,
      borderRadius: RADIO.md,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
    },
    presionada: { opacity: 0.7 },
    titulo: { fontSize: TAMANIO_TEXTO.chico, fontWeight: '700', color: c.texto },
    autor: { fontSize: TAMANIO_TEXTO.chico, color: c.textoSuave },
  });
}
