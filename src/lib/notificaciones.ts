import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { CANAL_PRESTAMOS, SEGUNDOS_RECORDATORIO_DEMO } from '../constants/biblioteca';

export function configurarPresentacionDeNotificaciones(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// En Android 13+ el diálogo del sistema solo aparece si ya existe un canal,
// por eso se crea antes de pedir el permiso.
export async function crearCanalPrestamos(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(CANAL_PRESTAMOS, {
    name: 'Préstamos',
    importance: AndroidImportance.HIGH,
  });
}

export async function consultarPermisoNotificaciones() {
  return Notifications.getPermissionsAsync();
}

export async function pedirPermisoNotificaciones() {
  await crearCanalPrestamos();
  return Notifications.requestPermissionsAsync();
}

export async function tienePermisoNotificaciones(): Promise<boolean> {
  try {
    const respuesta = await consultarPermisoNotificaciones();
    return respuesta.granted;
  } catch {
    return false;
  }
}

// Devuelve el identificador de la notificación o null si no se pudo programar
// (por ejemplo, en la web, donde no hay notificaciones locales).
export async function programarRecordatorioDevolucion(titulo: string): Promise<string | null> {
  try {
    await crearCanalPrestamos();
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Recordatorio de devolución',
        body: `Acordate de devolver "${titulo}" a la biblioteca.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: SEGUNDOS_RECORDATORIO_DEMO,
        channelId: CANAL_PRESTAMOS,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelarNotificacion(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Si ya no existe (por ejemplo, ya se mostró), no hay nada que cancelar.
  }
}

export async function notificarLibroEntregado(titulo: string): Promise<boolean> {
  try {
    await crearCanalPrestamos();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '¡Tu libro está listo!',
        body: `Ya podés retirar "${titulo}" en el mostrador de la biblioteca.`,
      },
      trigger: { channelId: CANAL_PRESTAMOS },
    });
    return true;
  } catch {
    return false;
  }
}

// Identificadores de las notificaciones que el sistema todavía tiene programadas,
// o null si no se pueden consultar (por ejemplo, en la web).
export async function idsNotificacionesProgramadas(): Promise<Set<string> | null> {
  try {
    const programadas = await Notifications.getAllScheduledNotificationsAsync();
    return new Set(programadas.map((n) => n.identifier));
  } catch {
    return null;
  }
}

// Avisa cuando llega una notificación con la app abierta. Devuelve la función para desuscribirse.
export function escucharNotificacionRecibida(alRecibir: (id: string) => void): () => void {
  const suscripcion = Notifications.addNotificationReceivedListener((notificacion) => {
    alRecibir(notificacion.request.identifier);
  });
  return () => suscripcion.remove();
}
