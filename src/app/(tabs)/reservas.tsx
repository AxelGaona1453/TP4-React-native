import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { BannerAviso } from '../../components/BannerAviso';
import { CargandoPantalla } from '../../components/CargandoPantalla';
import { FilaEspera } from '../../components/FilaEspera';
import { FilaPrestamo } from '../../components/FilaPrestamo';
import { Separador } from '../../components/Separador';
import { ESPACIADO, TAMANIO_TEXTO, type Colores } from '../../constants/tema';
import { useBiblioteca } from '../../hooks/useBiblioteca';
import { useLibros } from '../../hooks/useLibros';
import { usePermiso } from '../../hooks/usePermiso';
import { useEstilos } from '../../hooks/useTema';
import { posicionEnCola } from '../../lib/biblioteca';
import type { Prestamo } from '../../types/biblioteca';

type ItemEspera = { isbn: string; titulo: string; posicion: number };

type Seccion =
  | { clave: 'prestamos'; titulo: string; vacio: string; data: Prestamo[] }
  | { clave: 'espera'; titulo: string; vacio: string; data: ItemEspera[] };

export default function MisReservas() {
  const estilos = useEstilos(crearEstilos);
  const {
    listo,
    prestamos,
    esperas,
    avisos,
    activarRecordatorio,
    desactivarRecordatorio,
    devolver,
    descartarAviso,
  } = useBiblioteca();
  const { libros } = useLibros();
  const permisoNotificaciones = usePermiso('notificaciones');
  const { actualizar } = permisoNotificaciones;
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Al volver a esta pestaña se reconsulta el permiso (AppState cubre la vuelta desde Ajustes).
  useFocusEffect(
    useCallback(() => {
      actualizar();
    }, [actualizar]),
  );

  async function cambiarRecordatorio(prestamo: Prestamo, activar: boolean) {
    setMensaje(null);
    if (!activar) {
      desactivarRecordatorio(prestamo.isbn);
      return;
    }
    const resultado = await activarRecordatorio(prestamo.isbn);
    if (resultado === 'sin-permiso') {
      router.push({
        pathname: '/permisos/[recurso]',
        params: { recurso: 'notificaciones', isbn: prestamo.isbn },
      });
    } else if (resultado === 'no-disponible') {
      setMensaje('No pudimos programar el recordatorio en este dispositivo. Anotá la fecha de devolución.');
    }
  }

  if (!listo) {
    return <CargandoPantalla mensaje="Cargando tus reservas…" />;
  }

  const enEspera: ItemEspera[] = [];
  for (const [isbn, cola] of Object.entries(esperas)) {
    const posicion = posicionEnCola(cola);
    if (posicion !== null) {
      const titulo = libros.find((l) => l.isbn === isbn)?.titulo ?? `Libro con ISBN ${isbn}`;
      enEspera.push({ isbn, titulo, posicion });
    }
  }

  const secciones: Seccion[] = [
    {
      clave: 'prestamos',
      titulo: 'Mis préstamos',
      vacio: 'No tenés libros prestados.',
      data: prestamos,
    },
    {
      clave: 'espera',
      titulo: 'En lista de espera',
      vacio: 'No estás en ninguna lista de espera.',
      data: enEspera,
    },
  ];

  const textoPermiso =
    permisoNotificaciones.estado === 'concedido'
      ? 'Notificaciones permitidas: te avisamos aunque la app esté cerrada.'
      : 'Notificaciones no permitidas: los avisos van a aparecer acá, dentro de la app.';

  return (
    <View style={estilos.pantalla}>
      <SectionList<Prestamo | ItemEspera, Seccion>
        sections={secciones}
        keyExtractor={(item) => item.isbn}
        renderItem={({ item, section }) =>
          section.clave === 'prestamos' && 'venceEl' in item ? (
            <FilaPrestamo
              prestamo={item}
              onCambiarRecordatorio={cambiarRecordatorio}
              onDevolver={(p) => devolver(p.isbn)}
            />
          ) : (
            <FilaEspera titulo={item.titulo} posicion={'posicion' in item ? item.posicion : 0} />
          )
        }
        renderSectionHeader={({ section }) => (
          <Text style={estilos.tituloSeccion} accessibilityRole="header">
            {section.titulo}
          </Text>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? <Text style={estilos.vacio}>{section.vacio}</Text> : null
        }
        ListHeaderComponent={
          <View style={estilos.encabezado}>
            {avisos.map((aviso) => (
              <BannerAviso key={aviso.id} aviso={aviso} onDescartar={descartarAviso} />
            ))}
            {mensaje ? <Text style={estilos.mensaje}>{mensaje}</Text> : null}
            {permisoNotificaciones.estado === 'cargando' ? null : (
              <Text style={estilos.permiso}>{textoPermiso}</Text>
            )}
          </View>
        }
        ItemSeparatorComponent={Separador}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={estilos.contenido}
      />
    </View>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo },
    contenido: { padding: ESPACIADO.lg },
    encabezado: { gap: ESPACIADO.sm },
    tituloSeccion: {
      fontSize: TAMANIO_TEXTO.grande,
      fontWeight: '700',
      color: c.texto,
      marginTop: ESPACIADO.lg,
      marginBottom: ESPACIADO.sm,
    },
    vacio: { fontSize: TAMANIO_TEXTO.normal, color: c.textoSuave },
    mensaje: { fontSize: TAMANIO_TEXTO.normal, color: c.error },
    permiso: { fontSize: TAMANIO_TEXTO.chico, color: c.textoSuave },
  });
}
