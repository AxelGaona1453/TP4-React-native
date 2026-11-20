import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from '../../../../components/Boton';
import { CargandoPantalla } from '../../../../components/CargandoPantalla';
import { MensajeEstado } from '../../../../components/MensajeEstado';
import { ESPACIADO, RADIO, TAMANIO_TEXTO, type Colores } from '../../../../constants/tema';
import { useBiblioteca } from '../../../../hooks/useBiblioteca';
import { useLibros } from '../../../../hooks/useLibros';
import { useEstilos } from '../../../../hooks/useTema';
import { esIsbnValido } from '../../../../lib/isbn';

function irAlCatalogo() {
  router.dismissTo('/');
}

export default function DetalleLibro() {
  const estilos = useEstilos(crearEstilos);
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const { libros, cargando, error, reintentar } = useLibros();
  const { disponiblesDe, esperas, prestamos, posicionDe, registrarVisto } = useBiblioteca();

  const isbnValido = esIsbnValido(isbn);
  const libro = isbnValido ? libros.find((l) => l.isbn === isbn) : undefined;

  useEffect(() => {
    if (libro) {
      registrarVisto(libro);
    }
  }, [libro, registrarVisto]);

  if (!isbnValido) {
    return (
      <View style={estilos.pantalla}>
        <Stack.Screen options={{ title: 'ISBN inválido' }} />
        <MensajeEstado
          icono="alert-circle-outline"
          tono="error"
          titulo="Ese código no es un ISBN"
          mensaje={`"${isbn}" no tiene los 13 números de un ISBN. Revisá el código o buscá el libro en el catálogo.`}>
          <Boton texto="Ir al Catálogo" onPress={irAlCatalogo} />
        </MensajeEstado>
      </View>
    );
  }

  if (cargando) {
    return <CargandoPantalla mensaje="Buscando el libro…" />;
  }

  if (error) {
    return (
      <View style={estilos.pantalla}>
        <MensajeEstado icono="cloud-offline" tono="error" titulo="Algo salió mal" mensaje={error}>
          <Boton texto="Reintentar" onPress={reintentar} />
          <Boton texto="Ir al Catálogo" variante="secundario" onPress={irAlCatalogo} />
        </MensajeEstado>
      </View>
    );
  }

  if (!libro) {
    return (
      <View style={estilos.pantalla}>
        <Stack.Screen options={{ title: 'Libro no encontrado' }} />
        <MensajeEstado
          icono="search-outline"
          titulo="No encontramos ese libro"
          mensaje={`No hay ningún libro con ISBN ${isbn} en la biblioteca.`}>
          <Boton texto="Ir al Catálogo" onPress={irAlCatalogo} />
        </MensajeEstado>
      </View>
    );
  }

  const disponibles = disponiblesDe(libro);
  const enEspera = esperas[libro.isbn]?.tamanio ?? 0;
  const tengoPrestamo = prestamos.some((p) => p.isbn === libro.isbn);
  const miPosicion = posicionDe(libro.isbn);

  let miEstado: string | null = null;
  if (tengoPrestamo) {
    miEstado = 'Ya tenés este libro prestado.';
  } else if (miPosicion !== null) {
    miEstado = `Estás en la lista de espera (posición ${miPosicion}).`;
  }

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <Stack.Screen options={{ title: libro.titulo }} />
      <Text style={estilos.titulo} accessibilityRole="header">
        {libro.titulo}
      </Text>
      <Text style={estilos.autor}>{libro.autor}</Text>
      <View style={estilos.datos}>
        <Text style={estilos.dato}>Año: {libro.anio}</Text>
        <Text style={estilos.dato}>ISBN: {libro.isbn}</Text>
        <Text style={estilos.dato}>Ejemplares disponibles: {disponibles}</Text>
        <Text style={estilos.dato}>Personas en lista de espera: {enEspera}</Text>
      </View>
      {miEstado ? <Text style={estilos.miEstado}>{miEstado}</Text> : null}
      <Boton
        texto="Reservar"
        onPress={() => router.push({ pathname: '/reservar/[isbn]', params: { isbn: libro.isbn } })}
      />
    </ScrollView>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo },
    contenido: { padding: ESPACIADO.lg, gap: ESPACIADO.md },
    titulo: { fontSize: TAMANIO_TEXTO.titulo, fontWeight: '700', color: c.texto },
    autor: { fontSize: TAMANIO_TEXTO.grande, color: c.textoSuave },
    datos: {
      gap: ESPACIADO.sm,
      padding: ESPACIADO.lg,
      borderRadius: RADIO.md,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
    },
    dato: { fontSize: TAMANIO_TEXTO.normal, color: c.texto },
    miEstado: { fontSize: TAMANIO_TEXTO.normal, fontWeight: '600', color: c.exito },
  });
}
