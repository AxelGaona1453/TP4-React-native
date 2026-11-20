import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Boton } from '../components/Boton';
import { CargandoPantalla } from '../components/CargandoPantalla';
import { FilaMostrador } from '../components/FilaMostrador';
import { MensajeEstado } from '../components/MensajeEstado';
import { Separador } from '../components/Separador';
import { ESPACIADO, RADIO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { useLibros } from '../hooks/useLibros';
import { useEstilos } from '../hooks/useTema';
import type { Libro } from '../types';

export default function Mostrador() {
  const estilos = useEstilos(crearEstilos);
  const { libros, cargando, error, reintentar } = useLibros();
  const { esperas, entregarAlSiguiente, cerrarSesion } = useBiblioteca();
  const [entregando, setEntregando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const conEspera = libros.filter((l) => (esperas[l.isbn]?.tamanio ?? 0) > 0);

  async function entregar(libro: Libro) {
    setEntregando(libro.isbn);
    const resultado = await entregarAlSiguiente(libro.isbn, libro.titulo);
    setEntregando(null);
    if (resultado.tipo === 'lista-vacia') {
      setMensaje(`Nadie está esperando "${libro.titulo}".`);
    } else if (resultado.esUsuarioActual) {
      setMensaje(`"${libro.titulo}" se entregó a vos: ya figura en Mis reservas.`);
    } else {
      setMensaje(`"${libro.titulo}" se entregó a ${resultado.persona}.`);
    }
  }

  let estadoVacio;
  if (cargando) {
    estadoVacio = <CargandoPantalla mensaje="Cargando listas de espera…" />;
  } else if (error) {
    estadoVacio = (
      <MensajeEstado icono="cloud-offline" tono="error" titulo="Algo salió mal" mensaje={error}>
        <Boton texto="Reintentar" onPress={reintentar} />
      </MensajeEstado>
    );
  } else {
    estadoVacio = (
      <MensajeEstado
        icono="people-outline"
        titulo="Sin listas de espera"
        mensaje="Ningún libro tiene personas esperando."
      />
    );
  }

  return (
    <View style={estilos.pantalla}>
      <FlatList
        data={cargando || error ? [] : conEspera}
        keyExtractor={(libro) => libro.isbn}
        renderItem={({ item }) => {
          const cola = esperas[item.isbn];
          return (
            <FilaMostrador
              libro={item}
              alFrente={cola?.verFrente()}
              cantidad={cola?.tamanio ?? 0}
              entregando={entregando === item.isbn}
              onEntregar={entregar}
            />
          );
        }}
        ListHeaderComponent={
          mensaje ? (
            <Text style={estilos.mensaje} accessibilityLiveRegion="polite">
              {mensaje}
            </Text>
          ) : undefined
        }
        ListEmptyComponent={estadoVacio}
        ItemSeparatorComponent={Separador}
        contentContainerStyle={estilos.contenido}
      />
      <View style={estilos.pie}>
        <Boton texto="Cerrar sesión" variante="peligro" onPress={cerrarSesion} />
      </View>
    </View>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo },
    contenido: { flexGrow: 1, padding: ESPACIADO.lg },
    mensaje: {
      marginBottom: ESPACIADO.md,
      padding: ESPACIADO.md,
      borderRadius: RADIO.md,
      backgroundColor: c.superficie,
      color: c.exito,
      fontSize: TAMANIO_TEXTO.normal,
      fontWeight: '600',
    },
    pie: {
      padding: ESPACIADO.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borde,
      backgroundColor: c.superficie,
    },
  });
}
