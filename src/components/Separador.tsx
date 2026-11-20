import { StyleSheet, View } from 'react-native';

import { ESPACIADO } from '../constants/tema';

export function Separador() {
  return <View style={estilos.separador} />;
}

const estilos = StyleSheet.create({
  separador: { height: ESPACIADO.sm },
});
