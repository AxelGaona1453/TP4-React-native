import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { AREA_TACTIL_MINIMA, ESPACIADO, RADIO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useColores, useEstilos } from '../hooks/useTema';

type Props = Omit<TextInputProps, 'style'> & { etiqueta: string };

export function CampoTexto({ etiqueta, ...props }: Props) {
  const estilos = useEstilos(crearEstilos);
  const colores = useColores();
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        accessibilityLabel={etiqueta}
        placeholderTextColor={colores.textoSuave}
        style={estilos.campo}
        {...props}
      />
    </View>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    contenedor: { gap: ESPACIADO.xs },
    etiqueta: { fontSize: TAMANIO_TEXTO.chico, fontWeight: '600', color: c.textoSuave },
    campo: {
      minHeight: AREA_TACTIL_MINIMA,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: RADIO.md,
      paddingHorizontal: ESPACIADO.md,
      fontSize: TAMANIO_TEXTO.normal,
      color: c.texto,
      backgroundColor: c.superficie,
    },
  });
}
