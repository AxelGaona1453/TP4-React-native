import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ESPACIADO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useEstilos } from '../hooks/useTema';
import { esIsbnValido, limpiarIsbn } from '../lib/isbn';
import { Boton } from './Boton';
import { CampoTexto } from './CampoTexto';

type Props = {
  onIsbn: (isbn: string) => void;
};

export function EntradaIsbnManual({ onIsbn }: Props) {
  const estilos = useEstilos(crearEstilos);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);

  function confirmar() {
    const isbn = limpiarIsbn(texto);
    if (!esIsbnValido(isbn)) {
      setError('El ISBN tiene que tener 13 números (podés escribirlo con o sin guiones).');
      return;
    }
    setError(null);
    onIsbn(isbn);
  }

  return (
    <View style={estilos.contenedor}>
      <CampoTexto
        etiqueta="Escribir el ISBN a mano"
        placeholder="Ej.: 978-84-9908-950-8"
        keyboardType="number-pad"
        value={texto}
        onChangeText={setTexto}
        onSubmitEditing={confirmar}
        returnKeyType="go"
      />
      {error ? (
        <Text style={estilos.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Boton texto="Abrir libro" onPress={confirmar} />
    </View>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    contenedor: { gap: ESPACIADO.sm },
    error: { color: c.error, fontSize: TAMANIO_TEXTO.chico },
  });
}
