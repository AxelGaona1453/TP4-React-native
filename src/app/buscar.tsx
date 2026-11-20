import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Boton } from '../components/Boton';
import { CampoTexto } from '../components/CampoTexto';
import { CargandoPantalla } from '../components/CargandoPantalla';
import { FilaLibro } from '../components/FilaLibro';
import { MensajeEstado } from '../components/MensajeEstado';
import { DEMORA_BUSQUEDA_MS } from '../constants/biblioteca';
import { ESPACIADO, type Colores } from '../constants/tema';
import { useEstilos } from '../hooks/useTema';
import { buscarLibros } from '../lib/api';
import type { Libro } from '../types';

// Resultado asociado a la consulta que lo produjo: si no coincide con la
// consulta actual de la URL, se considera viejo y no se muestra.
type Respuesta = { consulta: string; libros: Libro[]; fallo: boolean };

function abrirLibro(libro: Libro) {
  router.push({ pathname: '/libro/[isbn]', params: { isbn: libro.isbn } });
}

export default function Buscar() {
  const estilos = useEstilos(crearEstilos);
  const { q } = useLocalSearchParams<{ q?: string }>();
  const texto = q ?? '';
  const consulta = texto.trim();
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (consulta === '') {
      return;
    }
    let ignorar = false;
    const temporizador = setTimeout(() => {
      buscarLibros(consulta)
        .then((libros) => {
          if (!ignorar) {
            setRespuesta({ consulta, libros, fallo: false });
          }
        })
        .catch(() => {
          if (!ignorar) {
            setRespuesta({ consulta, libros: [], fallo: true });
          }
        });
    }, DEMORA_BUSQUEDA_MS);

    return () => {
      ignorar = true;
      clearTimeout(temporizador);
    };
  }, [consulta, intento]);

  function reintentar() {
    setRespuesta(null);
    setIntento((n) => n + 1);
  }

  const vigente = respuesta !== null && respuesta.consulta === consulta ? respuesta : null;

  let contenidoVacio;
  if (consulta === '') {
    contenidoVacio = (
      <MensajeEstado
        icono="search"
        titulo="Buscá un libro"
        mensaje="Escribí parte del título o el nombre del autor."
      />
    );
  } else if (vigente === null) {
    contenidoVacio = <CargandoPantalla mensaje={`Buscando "${consulta}"…`} />;
  } else if (vigente.fallo) {
    contenidoVacio = (
      <MensajeEstado
        icono="cloud-offline"
        tono="error"
        titulo="No pudimos buscar"
        mensaje="Revisá tu conexión e intentá de nuevo.">
        <Boton texto="Reintentar" onPress={reintentar} />
      </MensajeEstado>
    );
  } else {
    contenidoVacio = (
      <MensajeEstado
        icono="book-outline"
        titulo="Sin resultados"
        mensaje={`No hay libros que coincidan con "${consulta}".`}
      />
    );
  }

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.buscador}>
        <CampoTexto
          etiqueta="Título o autor"
          placeholder="Ej.: Borges"
          value={texto}
          onChangeText={(nuevo) => router.setParams({ q: nuevo })}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>
      <FlatList
        data={vigente?.libros ?? []}
        keyExtractor={(libro) => libro.isbn}
        renderItem={({ item }) => <FilaLibro libro={item} onPress={abrirLibro} />}
        ListEmptyComponent={contenidoVacio}
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo },
    buscador: { padding: ESPACIADO.lg },
    contenido: { flexGrow: 1 },
  });
}
