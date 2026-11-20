import { useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import {
  consultarPermisoNotificaciones,
  pedirPermisoNotificaciones,
} from '../lib/notificaciones';
import type { EstadoPermiso, Recurso } from '../types/permisos';

type RespuestaPermiso = { granted: boolean; canAskAgain: boolean };

export type ResultadoUsePermiso = {
  estado: EstadoPermiso;
  pedir: () => Promise<EstadoPermiso>;
  actualizar: () => void;
  abrirAjustes: () => void;
};

export function derivarEstado(respuesta: RespuestaPermiso | null): EstadoPermiso {
  if (respuesta === null) {
    return 'cargando';
  }
  if (respuesta.granted) {
    return 'concedido';
  }
  return respuesta.canAskAgain ? 'preguntable' : 'bloqueado';
}

export function usePermiso(recurso: Recurso): ResultadoUsePermiso {
  const esCamara = recurso === 'camara';
  const [permisoCamara, pedirCamara, consultarCamara] = useCameraPermissions({ get: esCamara });
  const [permisoNotificaciones, setPermisoNotificaciones] = useState<RespuestaPermiso | null>(null);

  const consultarNotificaciones = useCallback(async () => {
    const respuesta = await consultarPermisoNotificaciones();
    setPermisoNotificaciones(respuesta);
    return respuesta;
  }, []);

  const actualizar = useCallback(() => {
    if (esCamara) {
      consultarCamara();
    } else {
      consultarNotificaciones();
    }
  }, [esCamara, consultarCamara, consultarNotificaciones]);

  useEffect(() => {
    if (esCamara) {
      return;
    }
    let ignorar = false;
    consultarPermisoNotificaciones().then((respuesta) => {
      if (!ignorar) {
        setPermisoNotificaciones(respuesta);
      }
    });
    return () => {
      ignorar = true;
    };
  }, [esCamara]);

  // Al volver de Ajustes la app pasa a "active": se vuelve a consultar el permiso.
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estadoApp) => {
      if (estadoApp === 'active') {
        actualizar();
      }
    });
    return () => suscripcion.remove();
  }, [actualizar]);

  const pedir = useCallback(async (): Promise<EstadoPermiso> => {
    if (esCamara) {
      return derivarEstado(await pedirCamara());
    }
    const respuesta = await pedirPermisoNotificaciones();
    setPermisoNotificaciones(respuesta);
    return derivarEstado(respuesta);
  }, [esCamara, pedirCamara]);

  const abrirAjustes = useCallback(() => {
    Linking.openSettings();
  }, []);

  const estado = derivarEstado(esCamara ? permisoCamara : permisoNotificaciones);
  return { estado, pedir, actualizar, abrirAjustes };
}
