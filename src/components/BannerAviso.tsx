import { StyleSheet, Text, View } from 'react-native';

import { ESPACIADO, RADIO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useEstilos } from '../hooks/useTema';
import type { Aviso } from '../types/biblioteca';
import { BotonIcono } from './BotonIcono';

type Props = {
  aviso: Aviso;
  onDescartar: (id: string) => void;
};

export function BannerAviso({ aviso, onDescartar }: Props) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.banner} accessibilityRole="alert">
      <Text style={estilos.texto}>{aviso.texto}</Text>
      <BotonIcono
        icono="close"
        accessibilityLabel="Descartar aviso"
        onPress={() => onDescartar(aviso.id)}
      />
    </View>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.sm,
      paddingLeft: ESPACIADO.md,
      borderRadius: RADIO.md,
      backgroundColor: c.fondoAviso,
    },
    texto: { flex: 1, color: c.aviso, fontSize: TAMANIO_TEXTO.normal, fontWeight: '600' },
  });
}
