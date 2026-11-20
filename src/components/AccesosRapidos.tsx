import { StyleSheet, View } from 'react-native';

import { ESPACIADO } from '../constants/tema';
import { Boton } from './Boton';

type Props = {
  onBuscar: () => void;
  onEscanear: () => void;
};

export function AccesosRapidos({ onBuscar, onEscanear }: Props) {
  return (
    <View style={estilos.fila}>
      <View style={estilos.celda}>
        <Boton texto="Buscar" variante="secundario" onPress={onBuscar} />
      </View>
      <View style={estilos.celda}>
        <Boton texto="Escanear" variante="secundario" onPress={onEscanear} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: ESPACIADO.sm,
    paddingHorizontal: ESPACIADO.lg,
    paddingBottom: ESPACIADO.md,
  },
  celda: { flex: 1 },
});
