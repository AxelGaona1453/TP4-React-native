import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { AREA_TACTIL_MINIMA, ESPACIADO, RADIO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useColores, useEstilos } from '../hooks/useTema';

type Props = {
  texto: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'peligro';
  deshabilitado?: boolean;
  ocupado?: boolean;
  accessibilityHint?: string;
};

export function Boton({
  texto,
  onPress,
  variante = 'primario',
  deshabilitado = false,
  ocupado = false,
  accessibilityHint,
}: Props) {
  const estilos = useEstilos(crearEstilos);
  const colores = useColores();
  const inactivo = deshabilitado || ocupado;
  const estilosTexto = {
    primario: estilos.textoPrimario,
    secundario: estilos.textoSecundario,
    peligro: estilos.textoPeligro,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: ocupado }}
      accessibilityHint={accessibilityHint}
      disabled={inactivo}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        estilos[variante],
        inactivo && estilos.inactivo,
        pressed && estilos.presionado,
      ]}>
      {ocupado ? (
        <ActivityIndicator color={variante === 'primario' ? colores.textoSobrePrimario : colores.primario} />
      ) : (
        <Text style={[estilos.texto, estilosTexto[variante]]}>
          {texto}
        </Text>
      )}
    </Pressable>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    base: {
      minHeight: AREA_TACTIL_MINIMA,
      minWidth: AREA_TACTIL_MINIMA,
      paddingHorizontal: ESPACIADO.lg,
      paddingVertical: ESPACIADO.sm,
      borderRadius: RADIO.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    primario: { backgroundColor: c.primario, borderColor: c.primario },
    secundario: { backgroundColor: c.superficie, borderColor: c.primario },
    peligro: { backgroundColor: c.superficie, borderColor: c.error },
    inactivo: { opacity: 0.5 },
    presionado: { opacity: 0.8 },
    texto: { fontSize: TAMANIO_TEXTO.normal, fontWeight: '600' },
    textoPrimario: { color: c.textoSobrePrimario },
    textoSecundario: { color: c.primario },
    textoPeligro: { color: c.error },
  });
}
