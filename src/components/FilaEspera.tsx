import { StyleSheet, Text, View } from 'react-native';

import { ESPACIADO, RADIO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useEstilos } from '../hooks/useTema';

type Props = {
  titulo: string;
  posicion: number;
};

export function FilaEspera({ titulo, posicion }: Props) {
  const estilos = useEstilos(crearEstilos);
  const texto =
    posicion === 1 ? 'Sos la próxima persona en la lista.' : `Tu posición en la lista: ${posicion}`;
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.detalle}>{texto}</Text>
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
