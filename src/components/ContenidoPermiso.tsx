import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BENEFICIO_PERMISO, TITULO_PERMISO } from '../constants/permisos';
import { type Colores } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { usePermiso } from '../hooks/usePermiso';
import { useEstilos } from '../hooks/useTema';
import type { Recurso } from '../types/permisos';
import { Boton } from './Boton';
import { CargandoPantalla } from './CargandoPantalla';
import { MensajeEstado } from './MensajeEstado';

// Pantalla previa al diálogo del sistema: beneficio en una frase y un único botón.
type Props = { recurso: Recurso; isbn: string | undefined; onVolver: () => void };

export function ContenidoPermiso({ recurso, isbn, onVolver }: Props) {
  const estilos = useEstilos(crearEstilos);
  const { estado, pedir, abrirAjustes } = usePermiso(recurso);
  const { activarRecordatorio } = useBiblioteca();
  const [pidiendo, setPidiendo] = useState(false);

  async function continuar() {
    setPidiendo(true);
    const nuevo = await pedir();
    if (nuevo === 'concedido' && recurso === 'notificaciones' && isbn) {
      await activarRecordatorio(isbn);
    }
    setPidiendo(false);
    if (nuevo !== 'bloqueado') {
      onVolver();
    }
  }

  let contenido;
  if (estado === 'cargando') {
    contenido = <CargandoPantalla mensaje="Revisando el permiso…" />;
  } else if (estado === 'concedido') {
    contenido = (
      <MensajeEstado icono="checkmark-circle-outline" titulo="Permiso concedido" mensaje={BENEFICIO_PERMISO[recurso]}>
        <Boton texto="Volver" onPress={onVolver} />
      </MensajeEstado>
    );
  } else if (estado === 'preguntable') {
    contenido = (
      <MensajeEstado icono={recurso === 'camara' ? 'camera' : 'notifications'} titulo={TITULO_PERMISO[recurso]} mensaje={BENEFICIO_PERMISO[recurso]}>
        <Boton texto="Continuar" onPress={continuar} ocupado={pidiendo} />
      </MensajeEstado>
    );
  } else {
    contenido = (
      <MensajeEstado
        icono="lock-closed-outline"
        titulo={TITULO_PERMISO[recurso]}
        mensaje={`${BENEFICIO_PERMISO[recurso]} Está bloqueado: podés habilitarlo en Ajustes.`}>
        <Boton texto="Abrir Ajustes" onPress={abrirAjustes} />
      </MensajeEstado>
    );
  }

  return (
    <View style={estilos.pantalla}>
      <Stack.Screen options={{ title: TITULO_PERMISO[recurso] }} />
      {contenido}
    </View>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo, justifyContent: 'center' },
  });
}
