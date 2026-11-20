import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { BibliotecaProvider } from '../context/BibliotecaContext';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { configurarPresentacionDeNotificaciones } from '../lib/notificaciones';

// Un deep link a /buscar (o cualquier pantalla del Stack raíz) deja las pestañas debajo.
export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();
configurarPresentacionDeNotificaciones();

// Componente de navegación del layout raíz: necesita estar dentro del provider
// para leer la sesión que decide qué rutas existen (Stack.Protected).
function PilaRaiz() {
  const { sesionIniciada, listo } = useBiblioteca();
  const esquema = useColorScheme();

  useEffect(() => {
    if (listo) {
      SplashScreen.hideAsync();
    }
  }, [listo]);

  return (
    <ThemeProvider value={esquema === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="buscar" options={{ title: 'Buscar' }} />
        <Stack.Screen name="escanear" options={{ title: 'Escanear' }} />
        <Stack.Screen
          name="reservar/[isbn]"
          options={{ presentation: 'modal', title: 'Confirmar reserva' }}
        />
        <Stack.Screen
          name="permisos/[recurso]"
          options={{ presentation: 'modal', title: 'Permiso' }}
        />
        <Stack.Protected guard={!sesionIniciada}>
          <Stack.Screen
            name="login"
            options={{ presentation: 'modal', title: 'Ingreso del personal' }}
          />
        </Stack.Protected>
        <Stack.Protected guard={sesionIniciada}>
          <Stack.Screen name="mostrador" options={{ title: 'Mostrador' }} />
        </Stack.Protected>
        <Stack.Screen name="reserva" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Página no encontrada' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function LayoutRaiz() {
  return (
    <BibliotecaProvider>
      <PilaRaiz />
    </BibliotecaProvider>
  );
}
