import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { AREA_TACTIL_MINIMA, ESPACIADO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { useEstilos } from '../hooks/useTema';

export function LinkPersonal() {
  const estilos = useEstilos(crearEstilos);
  const { sesionIniciada } = useBiblioteca();
  return (
    <Link
      href={sesionIniciada ? '/mostrador' : '/login'}
      accessibilityRole="button"
      accessibilityHint="Ingreso para el personal de la biblioteca"
      style={estilos.link}>
      <Text style={estilos.texto}>Personal</Text>
    </Link>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    link: {
      minHeight: AREA_TACTIL_MINIMA,
      paddingHorizontal: ESPACIADO.md,
      paddingVertical: ESPACIADO.md,
    },
    texto: { color: c.primario, fontSize: TAMANIO_TEXTO.normal, fontWeight: '600' },
  });
}
