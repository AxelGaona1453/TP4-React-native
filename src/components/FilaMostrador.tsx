import { StyleSheet, Text, View } from 'react-native';

import { ESPACIADO, RADIO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useEstilos } from '../hooks/useTema';
import type { Libro } from '../types';
import { Boton } from './Boton';

type Props = {
  libro: Libro;
  alFrente: string | undefined;
  cantidad: number;
  entregando: boolean;
  onEntregar: (libro: Libro) => void;
};

export function FilaMostrador({ libro, alFrente, cantidad, entregando, onEntregar }: Props) {
  const estilos = useEstilos(crearEstilos);
  const textoCantidad = cantidad === 1 ? '1 persona espera' : `${cantidad} personas esperan`;
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{libro.titulo}</Text>
      <Text style={estilos.detalle}>Al frente: {alFrente ?? 'nadie'}</Text>
      <Text style={estilos.detalle}>{textoCantidad}</Text>
      <Boton
        texto="Entregar al siguiente"
        onPress={() => onEntregar(libro)}
        ocupado={entregando}
      />
    </View>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    tarjeta: {
      padding: ESPACIADO.lg,
      gap: ESPACIADO.xs,
      borderRadius: RADIO.md,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
    },
    titulo: { fontSize: TAMANIO_TEXTO.normal, fontWeight: '700', color: c.texto },
    detalle: { fontSize: TAMANIO_TEXTO.chico, color: c.textoSuave },
  });
}
