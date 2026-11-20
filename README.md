# Biblioteca IPF

App integradora del Taller Complementario – React Native II (TP N° 4). Permite consultar el catálogo de la biblioteca, reservar libros, recibir un recordatorio antes de devolverlos y, para el personal, entregar libros respetando el orden de la lista de espera.

## Versiones

| Paquete | Versión |
| --- | --- |
| Expo SDK | **58** (`expo` 58.0.26) |
| expo-router | 58.0.32 |
| react-native | 0.88.1 |
| expo-camera | 58.0.14 |
| expo-notifications | 58.1.9 |

El proyecto se creó con `npx create-expo-app@latest` (plantilla por defecto: TypeScript + Expo Router) y todos los paquetes se instalaron con `npx expo install`.

## Cómo ejecutarlo

```bash
npm install
npx expo start          # escanear el QR con Expo Go (SDK 58)
npx expo start --web    # versión web (sin cámara ni notificaciones locales)
npm test                # tests de Pila y Cola (jest-expo)
npx expo lint
npx tsc --noEmit
```

**Credenciales del personal** (fijas en `src/constants/biblioteca.ts`): usuario `personal`, clave `biblioteca2026`.

**Libros para probar el escáner:** el catálogo (`src/data/libros.ts`) tiene 16 libros con ISBN reales verificados en openlibrary.org. Para probar con un libro en mano, reemplazá dos entradas por libros que tengas cerca con el ISBN-13 que figura en su contratapa.

## Árbol de rutas (`src/app`)

```
src/app
├── _layout.tsx               Stack raíz (Provider del Context, Stack.Protected, anchor: "(tabs)")
├── (tabs)
│   ├── _layout.tsx           Tabs (expo-router/js-tabs) con íconos de @expo/vector-icons
│   ├── (catalogo)
│   │   ├── _layout.tsx       Stack propio de la tab Catálogo (anchor: "index")
│   │   ├── index.tsx         /                 Catálogo
│   │   └── libro
│   │       └── [isbn].tsx    /libro/[isbn]     Detalle
│   └── reservas.tsx          /reservas         Mis reservas
├── buscar.tsx                /buscar?q=        Stack raíz
├── escanear.tsx              /escanear         Stack raíz
├── reservar
│   └── [isbn].tsx            /reservar/[isbn]  Stack raíz, presentation: "modal"
├── permisos
│   └── [recurso].tsx         /permisos/[recurso] presentation: "modal" (camara | notificaciones)
├── login.tsx                 /login            modal, Stack.Protected guard={!sesionIniciada}
├── mostrador.tsx             /mostrador        Stack.Protected guard={sesionIniciada}
├── reserva.tsx               /reserva          <Redirect href="/reservas" />
└── +not-found.tsx            cualquier otra URL (muestra la ruta con usePathname)
```

El resto del código está fuera de `src/app`:

```
src
├── components   Botones, filas, estados de pantalla (un componente por archivo)
├── constants    tema.ts (colores claro/oscuro, espaciados, tamaños), biblioteca.ts, permisos.ts
├── context      BibliotecaContext.tsx (préstamos, listas de espera, recientes, sesión, avisos)
├── data         libros.ts, esperaInicial.ts
├── estructuras  Pila.ts, Cola.ts (+ __tests__)
├── hooks        useLibros, usePermiso, useBiblioteca, useTema
├── lib          api.ts (entregado), notificaciones.ts, almacenamiento.ts, biblioteca.ts, isbn.ts, fechas.ts
└── types        index.ts (Libro, tal cual el enunciado), biblioteca.ts, permisos.ts
```

## Bloque `plugins` de `app.json` (comentado)

JSON no admite comentarios; este es el bloque real con explicaciones agregadas:

```jsonc
"plugins": [
  // Necesario para Expo Router (rutas a partir de src/app).
  "expo-router",

  // Pantalla de carga: se mantiene visible hasta que el Context lee AsyncStorage.
  ["expo-splash-screen", { "backgroundColor": "#1E3A8A", "image": "./assets/images/splash-icon.png", "imageWidth": 76 }],

  ["expo-camera", {
    // iOS: NSCameraUsageDescription. Sigue el molde "Usamos tu [dato] para [beneficio]".
    "cameraPermission": "Usamos tu cámara para leer el código de barras del libro y abrir su ficha al instante.",
    // iOS: false elimina NSMicrophoneUsageDescription (la app no graba video).
    "microphonePermission": false,
    // Android: no agrega RECORD_AUDIO.
    "recordAudioAndroid": false
  }],

  ["expo-notifications", {
    // Solo notificaciones locales: no se pide el entitlement de push (APNs) en iOS.
    "enableRemoteNotifications": false
  }]
]
```

## Permisos

| Recurso | Módulo | Cuándo se pide | Alternativa si se niega |
| --- | --- | --- | --- |
| Cámara | `expo-camera` (`useCameraPermissions`, envuelto en `usePermiso`) | Al tocar "Usar la cámara" en `/escanear`, después de la pantalla previa `/permisos/camara` ("Continuar") | Escribir el ISBN a mano en la misma pantalla. Si está bloqueado, botón "Abrir Ajustes". |
| Notificaciones | `expo-notifications` | Solo al activar "Recordarme" en un préstamo, después de `/permisos/notificaciones`. En Android se crea antes el canal `prestamos`. | Los avisos (por ejemplo, "te entregaron un libro") aparecen como banner dentro de `/reservas`. |

### Permisos declarados en Android

Salida real de `npx expo prebuild --platform android` (líneas `uses-permission` del `AndroidManifest.xml` generado):

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" tools:node="remove"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" tools:node="remove"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" tools:node="remove"/>
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" tools:node="remove"/>
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" tools:node="remove"/>
<uses-permission android:name="android.permission.RECORD_AUDIO" tools:node="remove"/>
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" tools:node="remove"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" tools:node="remove"/>
```

Además, el manifiesto de la librería `expo-notifications` agrega `POST_NOTIFICATIONS` y `RECEIVE_BOOT_COMPLETED`, que se fusionan al compilar.

### Justificación de `blockedPermissions`

`android.blockedPermissions` agrega `tools:node="remove"` para que esos permisos no lleguen al manifiesto final aunque alguna librería los declare (no tiene efecto en Expo Go, solo en una build propia).

| Permiso bloqueado | Por qué |
| --- | --- |
| `RECORD_AUDIO` | El escáner usa la cámara sin audio. Refuerza `recordAudioAndroid: false`. |
| `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | La app no usa ubicación (no instala `expo-location`). |
| `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO` | No se leen ni guardan fotos o archivos (no instala `expo-image-picker`). |
| `SYSTEM_ALERT_WINDOW` | La app no dibuja sobre otras apps. |

## Deep links de prueba

Con la app abierta en Expo Go, reemplazar `bibliotecaipf://` por `exp://<IP>:8081/--/`:

```
bibliotecaipf://libro/9788499089508      Detalle de "Ficciones"
bibliotecaipf://libro/123                ISBN inválido (mensaje + link al Catálogo)
bibliotecaipf://libro/9789999999999      ISBN con formato válido pero inexistente
bibliotecaipf://buscar?q=borges          Buscador con la consulta cargada
bibliotecaipf://mostrador                Sin sesión: no existe, redirige al Catálogo
bibliotecaipf://reserva                  Redirige a /reservas
bibliotecaipf://escanear                 Escáner
bibliotecaipf://cualquier-cosa           Pantalla 404
```

En la versión web son las mismas rutas sobre `http://localhost:8081/`.

## Lint, tipos y tests

Salida al momento de la entrega:

```
$ npx expo lint
(sin salida; código de salida 0)

$ npx tsc --noEmit
(sin salida; código de salida 0)

$ npx jest
Test Suites: 2 passed, 2 total
Tests:       10 passed, 10 total

$ npx expo-doctor
Running 20 checks on your project...
20/20 checks passed. No issues detected!
```

## Capturas

Las capturas de la carpeta [`capturas/`](capturas) se tomaron de la **versión web** de la app (`npx expo start --web`, ventana de 375 × 812). Son la misma app y el mismo código, pero en la web no hay cámara ni notificaciones locales.

| Pedido | Archivo |
| --- | --- |
| Catálogo cargando / con error / con datos | `02-catalogo-cargando.jpg`, `03-catalogo-error.jpg`, `01-catalogo-con-datos.jpg` |
| Buscador | `05-buscador-cargando.jpg`, `04-buscador-resultados.jpg`, `06-buscador-sin-resultados.jpg` |
| Detalle inexistente | `07-detalle-isbn-invalido.jpg`, `08-detalle-inexistente.jpg` |
| Reserva con y sin ejemplares | `10-reserva-con-ejemplares.jpg`, `11-mis-reservas-prestamo.jpg`, `13-reserva-sin-ejemplares.jpg`, `14-mis-reservas-con-espera.jpg`, `15-reserva-repetida.jpg` |
| Escáner (estado "preguntable", pantalla previa y entrada manual) | `17-escaner-preguntable.jpg`, `18-permiso-camara-previa.jpg`, `19-escaner-isbn-no-encontrado.jpg` |
| Mostrador antes y después de "Entregar al siguiente" | `21-mostrador-antes.jpg`, `22-mostrador-despues-entregar.jpg`, `23-mostrador-entregado-a-vos.jpg` |
| Aviso dentro de la app (sin permiso de notificaciones) | `24-aviso-en-mis-reservas.jpg` |
| Login con clave incorrecta | `20-login-clave-incorrecta.jpg` |
| Pantalla 404 | `25-pantalla-404.jpg` |
| Modo oscuro | `26-modo-oscuro-detalle.jpg` |

**Pendientes en un teléfono real con Expo Go** (no se pueden obtener en la web): escáner en los estados "cargando", "concedido" (cámara funcionando) y "bloqueado"; notificación recibida (recordatorio a los 15 segundos y libro entregado); diálogo del sistema para la cámara.
