import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ESPACIADO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useColores, useEstilos } from '../hooks/useTema';

type Props = { mensaje: string };

export function CargandoPantalla({ mensaje }: Props) {
  const estilos = useEstilos(crearEstilos);
  const colores = useColores();
  return (
    <View style={estilos.contenedor} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colores.primario} />
      <Text style={estilos.texto}>{mensaje}</Text>
    </View>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: ESPACIADO.xl,
      gap: ESPACIADO.md,
      backgroundColor: c.fondo,
    },
    texto: { fontSize: TAMANIO_TEXTO.normal, color: c.textoSuave, textAlign: 'center' },
  });
}
