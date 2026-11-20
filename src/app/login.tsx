import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Boton } from '../components/Boton';
import { CampoTexto } from '../components/CampoTexto';
import { ESPACIADO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { useEstilos } from '../hooks/useTema';

export default function Login() {
  const estilos = useEstilos(crearEstilos);
  const { iniciarSesion } = useBiblioteca();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Si los datos son correctos, Stack.Protected quita esta pantalla y el modal se cierra solo.
  function ingresar() {
    if (!iniciarSesion(usuario, clave)) {
      setError('El usuario o la clave no son correctos. Revisalos e intentá de nuevo.');
    }
  }

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled">
      <Text style={estilos.titulo} accessibilityRole="header">
        Ingreso del personal
      </Text>
      <Text style={estilos.texto}>Solo para el personal de la biblioteca.</Text>
      <CampoTexto
        etiqueta="Usuario"
        value={usuario}
        onChangeText={setUsuario}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <CampoTexto
        etiqueta="Clave"
        value={clave}
        onChangeText={setClave}
        secureTextEntry
        onSubmitEditing={ingresar}
      />
      {error ? (
        <Text style={estilos.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <Boton texto="Ingresar" onPress={ingresar} />
    </ScrollView>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo },
    contenido: { padding: ESPACIADO.xl, gap: ESPACIADO.md },
    titulo: { fontSize: TAMANIO_TEXTO.titulo, fontWeight: '700', color: c.texto },
    texto: { fontSize: TAMANIO_TEXTO.normal, color: c.textoSuave },
    error: { fontSize: TAMANIO_TEXTO.normal, color: c.error },
  });
}
