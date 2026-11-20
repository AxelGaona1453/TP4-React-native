import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Boton } from '../../components/Boton';
import { ContenidoPermiso } from '../../components/ContenidoPermiso';
import { MensajeEstado } from '../../components/MensajeEstado';
import { type Colores } from '../../constants/tema';
import { useEstilos } from '../../hooks/useTema';
import type { Recurso } from '../../types/permisos';

function esRecurso(valor: string | undefined): valor is Recurso {
  return valor === 'camara' || valor === 'notificaciones';
}

function volver() {
  router.back();
}

export default function PantallaPermiso() {
  const estilos = useEstilos(crearEstilos);
  const { recurso, isbn } = useLocalSearchParams<{ recurso: string; isbn?: string }>();

  if (!esRecurso(recurso)) {
    return (
      <View style={estilos.pantalla}>
        <MensajeEstado
          icono="help-circle-outline"
          titulo="Permiso desconocido"
          mensaje="Esta app solo usa la cámara y las notificaciones.">
          <Boton texto="Volver" onPress={volver} />
        </MensajeEstado>
      </View>
    );
  }

  return <ContenidoPermiso recurso={recurso} isbn={isbn} onVolver={volver} />;
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo, justifyContent: 'center' },
  });
}
