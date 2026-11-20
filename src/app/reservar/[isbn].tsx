import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Boton } from '../../components/Boton';
import { CargandoPantalla } from '../../components/CargandoPantalla';
import { MensajeEstado } from '../../components/MensajeEstado';
import { DIAS_PRESTAMO } from '../../constants/biblioteca';
import { ESPACIADO, TAMANIO_TEXTO, type Colores } from '../../constants/tema';
import { useBiblioteca } from '../../hooks/useBiblioteca';
import { useLibros } from '../../hooks/useLibros';
import { useEstilos } from '../../hooks/useTema';
import { formatearFecha, sumarDias } from '../../lib/fechas';
import { esIsbnValido } from '../../lib/isbn';

// Cierra el modal y deja /reservas como pantalla actual, sin la confirmación en el historial.
function irAMisReservas() {
  router.dismissTo('/reservas');
}

function cerrar() {
  router.back();
}

export default function ConfirmarReserva() {
  const estilos = useEstilos(crearEstilos);
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const { libros, cargando, error, reintentar } = useLibros();
  const { disponiblesDe, esperas, prestamos, posicionDe, reservar } = useBiblioteca();
  // Momento en que se abrió la confirmación, para mostrar la fecha de devolución.
  const [abiertoEl] = useState(() => Date.now());

  const isbnValido = esIsbnValido(isbn);
  const libro = isbnValido ? libros.find((l) => l.isbn === isbn) : undefined;

  if (isbnValido && cargando) {
    return <CargandoPantalla mensaje="Preparando la reserva…" />;
  }

  if (isbnValido && error) {
    return (
      <View style={estilos.pantalla}>
        <MensajeEstado icono="cloud-offline" tono="error" titulo="Algo salió mal" mensaje={error}>
          <Boton texto="Reintentar" onPress={reintentar} />
          <Boton texto="Cerrar" variante="secundario" onPress={cerrar} />
        </MensajeEstado>
      </View>
    );
  }

  if (!libro) {
    return (
      <View style={estilos.pantalla}>
        <MensajeEstado
          icono="search-outline"
          titulo="No encontramos ese libro"
          mensaje="No se puede reservar un libro que no está en el catálogo.">
          <Boton texto="Cerrar" onPress={cerrar} />
        </MensajeEstado>
      </View>
    );
  }

  const yaReservado = prestamos.some((p) => p.isbn === libro.isbn) || posicionDe(libro.isbn) !== null;
  if (yaReservado) {
    return (
      <View style={estilos.pantalla}>
        <MensajeEstado
          icono="checkmark-circle-outline"
          titulo="Ya reservaste este libro"
          mensaje={`"${libro.titulo}" ya está en tus préstamos o en tu lista de espera.`}>
          <Boton texto="Ver mis reservas" onPress={irAMisReservas} />
          <Boton texto="Cerrar" variante="secundario" onPress={cerrar} />
        </MensajeEstado>
      </View>
    );
  }

  const hayEjemplares = disponiblesDe(libro) > 0;
  const posicionFutura = (esperas[libro.isbn]?.tamanio ?? 0) + 1;
  const explicacion = hayEjemplares
    ? `Te lo prestamos por ${DIAS_PRESTAMO} días. Lo tenés que devolver el ${formatearFecha(
        sumarDias(abiertoEl, DIAS_PRESTAMO),
      )}.`
    : `No quedan ejemplares en el estante. Vas a entrar a la lista de espera en la posición ${posicionFutura}.`;

  function confirmar() {
    if (!libro) {
      return;
    }
    reservar(libro);
    irAMisReservas();
  }

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.contenido}>
        <Text style={estilos.titulo} accessibilityRole="header">
          {libro.titulo}
        </Text>
        <Text style={estilos.tipo}>{hayEjemplares ? 'Préstamo' : 'Lista de espera'}</Text>
        <Text style={estilos.explicacion}>{explicacion}</Text>
        <Boton texto="Confirmar" onPress={confirmar} />
        <Boton texto="Cancelar" variante="secundario" onPress={cerrar} />
      </View>
    </View>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo, justifyContent: 'center' },
    contenido: { padding: ESPACIADO.xl, gap: ESPACIADO.md },
    titulo: { fontSize: TAMANIO_TEXTO.titulo, fontWeight: '700', color: c.texto },
    tipo: { fontSize: TAMANIO_TEXTO.normal, fontWeight: '700', color: c.primario },
    explicacion: { fontSize: TAMANIO_TEXTO.normal, color: c.texto },
  });
}
