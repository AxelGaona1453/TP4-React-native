import { FlatList, StyleSheet, Text, View } from 'react-native';

import { ESPACIADO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useEstilos } from '../hooks/useTema';
import type { Libro } from '../types';
import { TarjetaReciente } from './TarjetaReciente';

type Props = {
  libros: Libro[];
  onAbrir: (libro: Libro) => void;
};

export function SeccionRecientes({ libros, onAbrir }: Props) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.seccion}>
      <Text style={estilos.titulo} accessibilityRole="header">
        Vistos recientemente
      </Text>
      <FlatList
        horizontal
        data={libros}
        keyExtractor={(libro) => libro.isbn}
        renderItem={({ item }) => <TarjetaReciente libro={item} onPress={onAbrir} />}
        contentContainerStyle={estilos.lista}
        showsHorizontalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={estilos.vacio}>Todavía no abriste ningún libro.</Text>
        }
      />
    </View>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    seccion: { gap: ESPACIADO.sm, paddingVertical: ESPACIADO.md },
    titulo: {
      fontSize: TAMANIO_TEXTO.normal,
      fontWeight: '700',
      color: c.texto,
      paddingHorizontal: ESPACIADO.lg,
    },
    lista: { paddingHorizontal: ESPACIADO.lg, gap: ESPACIADO.sm },
    vacio: { fontSize: TAMANIO_TEXTO.chico, color: c.textoSuave },
  });
}
