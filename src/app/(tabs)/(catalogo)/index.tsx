import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { AccesosRapidos } from '../../../components/AccesosRapidos';
import { Boton } from '../../../components/Boton';
import { CargandoPantalla } from '../../../components/CargandoPantalla';
import { FilaLibro } from '../../../components/FilaLibro';
import { MensajeEstado } from '../../../components/MensajeEstado';
import { SeccionRecientes } from '../../../components/SeccionRecientes';
import { CANTIDAD_RECIENTES } from '../../../constants/biblioteca';
import { type Colores } from '../../../constants/tema';
import { useBiblioteca } from '../../../hooks/useBiblioteca';
import { useLibros } from '../../../hooks/useLibros';
import { useEstilos } from '../../../hooks/useTema';
import { recientesDesdeElTope } from '../../../lib/biblioteca';
import type { Libro } from '../../../types';

function abrirLibro(libro: Libro) {
  router.push({ pathname: '/libro/[isbn]', params: { isbn: libro.isbn } });
}

export default function Catalogo() {
  const estilos = useEstilos(crearEstilos);
  const { libros, cargando, error, reintentar } = useLibros();
  const { recientes } = useBiblioteca();
  const ultimosVistos = recientesDesdeElTope(recientes, CANTIDAD_RECIENTES);

  let estadoVacio;
  if (cargando) {
    estadoVacio = <CargandoPantalla mensaje="Cargando el catálogo…" />;
  } else if (error) {
    estadoVacio = (
      <MensajeEstado icono="cloud-offline" tono="error" titulo="Algo salió mal" mensaje={error}>
        <Boton texto="Reintentar" onPress={reintentar} />
      </MensajeEstado>
    );
  } else {
    estadoVacio = (
      <MensajeEstado
        icono="library-outline"
        titulo="El catálogo está vacío"
        mensaje="Por ahora no hay libros cargados en la biblioteca."
      />
    );
  }

  return (
    <View style={estilos.pantalla}>
      <FlatList
        data={cargando || error ? [] : libros}
        keyExtractor={(libro) => libro.isbn}
        renderItem={({ item }) => <FilaLibro libro={item} onPress={abrirLibro} />}
        ListHeaderComponent={
          <View>
            <SeccionRecientes libros={ultimosVistos} onAbrir={abrirLibro} />
            <AccesosRapidos
              onBuscar={() => router.push('/buscar')}
              onEscanear={() => router.push('/escanear')}
            />
          </View>
        }
        ListEmptyComponent={estadoVacio}
        contentContainerStyle={estilos.contenido}
      />
    </View>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo },
    contenido: { flexGrow: 1 },
  });
}
