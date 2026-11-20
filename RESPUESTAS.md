# Respuestas – TP N° 4 "Biblioteca IPF"

Cómo leer las marcas:

- **[verificado en web]**: lo probé en la app corriendo con `npx expo start --web` (mismo código, SDK 58).
- **[razonado]**: lo deduje del código y de la documentación de Expo; falta comprobarlo en un teléfono con Expo Go.

Las referencias `archivo:línea` apuntan al estado del repositorio en el último commit.

---

## Parte B · Estado, efectos y renderizado

### B1. El ciclo de vida de `useLibros`

**a) Render por render**

`useLibros` está en `src/hooks/useLibros.ts`. El estado inicial es `libros = []`, `cargando = true`, `error = null` (líneas 16-19) y el efecto depende de `intento` (línea 45).

Cuando `obtenerLibros()` responde bien:

| Render | `libros` | `cargando` | `error` | Qué lo provoca |
| --- | --- | --- | --- | --- |
| 1 | `[]` | `true` | `null` | El montaje del Catálogo. Después del commit corre el efecto y llama a `cargar()`, que espera 800 ms. La pantalla muestra "Cargando el catálogo…". |
| 2 | 16 libros | `false` | `null` | `setLibros(datos)` (línea 28) y `setCargando(false)` en el `finally` (línea 36). Las dos actualizaciones ocurren en la misma tarea, así que React las agrupa en un solo render. |

Aparte de esto, el Catálogo usa `useBiblioteca()`, así que también se vuelve a renderizar cuando cambia el Context (por ejemplo, cuando el provider termina de leer AsyncStorage y pone `listo = true`). Esos renders no cambian los valores de `useLibros`.

Cuando `obtenerLibros()` falla y la persona toca "Reintentar":

| Render | `libros` | `cargando` | `error` | Qué lo provoca |
| --- | --- | --- | --- | --- |
| 1 | `[]` | `true` | `null` | Montaje; el efecto pide los libros. |
| 2 | `[]` | `false` | mensaje | `setError(MENSAJE_ERROR)` (línea 32) y `setCargando(false)` (línea 36), agrupados. Se ve "Algo salió mal" con el botón "Reintentar" (captura `03-catalogo-error.jpg`). |
| 3 | `[]` | `true` | `null` | El toque en "Reintentar": `reintentar()` hace `setError(null)`, `setCargando(true)` y `setIntento(n + 1)` (líneas 47-51) dentro del mismo evento, así que es un solo render. Como cambió `intento`, React corre la limpieza del efecto anterior y vuelve a ejecutarlo. |
| 4 | 16 libros (o `[]`) | `false` | `null` (o mensaje) | La nueva respuesta, igual que en el render 2 del caso exitoso (o de error si vuelve a fallar). |

[verificado en web] Vi la secuencia cargando → error → (Reintentar) → cargando → lista.

**b) ¿Se desmonta el Catálogo?**

Agregué temporalmente un `console.log` en el cuerpo del efecto y otro en su limpieza, y después lo saqué (no quedó en el código). Esto es lo que salió en la consola de la versión web:

```
[B1b] useLibros: efecto montado, intento 0      ← abrir la app (Catálogo)
[B1b] ---- paso: cambiar a Mis reservas
[B1b] useLibros: efecto montado, intento 0      ← se monta Mis reservas (también usa useLibros)
[B1b] ---- paso: volver a Catalogo y abrir un detalle
[B1b] useLibros: efecto montado, intento 0      ← se monta el detalle
[B1b] ---- paso: atras desde el detalle
[B1b] useLibros: limpieza del efecto            ← se desmonta el detalle, no el Catálogo
```

- Al cambiar a "Mis reservas", el Catálogo **no** se desmonta: las pestañas mantienen montadas las pantallas que ya se visitaron.
- Al abrir un detalle, el Catálogo **tampoco** se desmonta: queda debajo en el Stack de la pestaña.
- La única limpieza que apareció fue la del detalle al volver atrás, porque esa pantalla sí sale del Stack.

Por eso, en mi app la limpieza del efecto del Catálogo corre en estas situaciones:

1. Al tocar "Reintentar": cambia `intento` y React limpia el efecto anterior antes de correr el nuevo.
2. Cuando la pantalla se desmonta de verdad, por ejemplo cuando el navegador raíz se reconstruye. En la web pasó al iniciar sesión: el Catálogo volvió a pedir los libros.
3. Cuando la app se cierra.

La limpieza importa sobre todo en el caso 1 y en pantallas que sí se desmontan seguido, como el detalle. Si la respuesta vieja llega después, `ignorar = true` evita un `setState` sobre una pantalla que ya no está.

[verificado en web] para el log. [razonado] En Expo Go debería pasar lo mismo, porque las pestañas y los Stacks de React Navigation se comportan igual en nativo.

**c) ¿Por qué no se puede pasar una función `async` a `useEffect`?**

`useEffect` espera que el callback devuelva `undefined` o una función de limpieza. Una función `async` siempre devuelve una `Promise`, así que React recibiría una promesa en lugar de la limpieza (y lo avisa en desarrollo). Además, no habría forma de cancelar nada, porque la "limpieza" llegaría recién cuando la promesa se resuelva.

Lo resolví declarando una función `async` **adentro** del efecto, llamándola y devolviendo una limpieza síncrona (`src/hooks/useLibros.ts:21-45`):

```ts
useEffect(() => {
  let ignorar = false;

  async function cargar() {
    try {
      const datos = await obtenerLibros();
      if (!ignorar) {
        setLibros(datos);
      }
    } catch {
      if (!ignorar) {
        setError(MENSAJE_ERROR);
      }
    } finally {
      if (!ignorar) {
        setCargando(false);
      }
    }
  }

  cargar();
  return () => {
    ignorar = true;
  };
}, [intento]);
```

**d) ¿Cómo implementé `reintentar`?**

`reintentar` no llama a `obtenerLibros()` directamente: cambia un contador que está en el array de dependencias (`useLibros.ts:47-51` y `:45`):

```ts
const reintentar = useCallback(() => {
  setError(null);
  setCargando(true);
  setIntento((n) => n + 1);
}, []);
```

Como `intento` cambia, React vuelve a ejecutar el efecto, y antes corre la limpieza del anterior. Así el pedido nuevo pasa por el mismo camino que el primero (con su bandera `ignorar`).

Elegí `intento` porque es un valor que **solo** cambia cuando la persona quiere reintentar. Si pusiera `error` o `libros` en las dependencias, el propio efecto los modifica y se generaría un bucle. Un booleano que se alterna también funcionaría, pero un contador deja claro que cada toque es un intento nuevo, aunque el estado anterior sea el mismo.

### B2. La condición de carrera del buscador

`/buscar` está en `src/app/buscar.tsx`. Para la consulta "bor" la API devuelve Ficciones y El Aleph, igual que para "borges" (lo comprobé filtrando `src/data/libros.ts` con la misma condición que `buscarLibros`). Con otros datos la diferencia se notaría más, pero el problema es el mismo: la lista no corresponde a lo que dice el campo de texto.

| Momento | Qué pasa | Sin limpieza: qué se ve | Con mi código: qué se ve |
| --- | --- | --- | --- |
| t = 0 ms | Escribe "bor" → se pide `buscarLibros("bor")` (1.400 ms). | Indicador de carga (o nada, según el código). | "Buscando "bor"…". Con mi código el pedido **no sale todavía**: espera 300 ms sin cambios (debounce). |
| t = 200 ms | Escribe "borges" → se pide `buscarLibros("borges")` (300 ms). | Sigue cargando; hay dos pedidos en vuelo. | La limpieza del efecto de "bor" cancela su temporizador: "bor" nunca se pide. Se ve "Buscando "borges"…". |
| t = 500 ms | Llega la respuesta de "borges". | Resultados de "borges". | Todavía carga: el pedido de "borges" salió recién a los 500 ms y llega a los 800 ms. |
| t = 1.400 ms | Llega la respuesta de "bor". | La respuesta vieja **pisa** a la nueva: el campo dice "borges" y la lista es la de "bor". | No llega nada (el pedido nunca salió). Aun sin debounce, la respuesta de "bor" se descartaría porque su `ignorar` ya está en `true`. |

**a) Qué hace la limpieza**

El efecto está en `buscar.tsx:32-55`:

```ts
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
      .catch(() => { /* … */ });
  }, DEMORA_BUSQUEDA_MS);

  return () => {
    ignorar = true;
    clearTimeout(temporizador);
  };
}, [consulta, intento]);
```

La limpieza hace dos cosas:

1. `clearTimeout(temporizador)`: si la persona sigue escribiendo antes de 300 ms, el pedido anterior ni siquiera se hace.
2. `ignorar = true`: si el pedido ya había salido, su `.then` encuentra `ignorar` en `true` y no llama a `setRespuesta`.

React la ejecuta después del render en el que cambia `consulta` (antes de correr el efecto nuevo) y al desmontar la pantalla.

Además, cada respuesta se guarda junto con la consulta que la produjo. En pantalla solo se muestra si coincide con la consulta actual de la URL (`buscar.tsx:62`):

```ts
const vigente = respuesta !== null && respuesta.consulta === consulta ? respuesta : null;
```

**b) La propuesta de comparar `texto === q` dentro del `.then()`**

No funciona. La función del `.then()` es una clausura creada en el render en el que corrió el efecto, así que "ve" el `q` de **ese** render, no el de la URL actual. En ese render, `texto` (lo que se buscó) y `q` valen lo mismo, porque `texto` salió justamente de ese `q`. La comparación da siempre `true` y la respuesta vieja se muestra igual.

En JavaScript una clausura captura las variables del ámbito donde se creó. En React, cada render es una llamada nueva al componente con sus propias constantes `q`, `texto`, etc. La función creada en el render de "bor" sigue viendo el `q = "bor"` de ese render aunque después haya renders nuevos. Para que funcionara habría que leer el valor actual desde algo que no quede congelado, como un `useRef` actualizado en cada render. La bandera `ignorar` de la limpieza resuelve lo mismo sin refs.

**c) La URL y el botón atrás mientras se escribe**

Cada tecla llama a `router.setParams({ q: nuevo })` (`buscar.tsx:102`). La URL cambia (`/buscar?q=b`, `/buscar?q=bo`, …), pero **no** se apila una pantalla nueva: se actualizan los parámetros de la ruta actual. El botón atrás sale del buscador hacia la pantalla anterior.

[verificado en web] Escribí "cortazar" (8 letras) y `history.length` siguió en 2. La URL terminó en `/buscar?q=cortazar` y la flecha atrás me llevó al Catálogo.

Con `router.push` cada tecla apilaría otra pantalla `/buscar`. Para salir habría que tocar atrás una vez por cada letra. Además, cada pantalla nueva se monta de cero, así que el campo perdería el foco y el teclado se cerraría.

### B3. Mutar o reemplazar

**a)** El texto sigue mostrando **0**. `espera.encolar('Ana')` modifica el objeto que está guardado en el estado, pero no llama a ningún `setState`. React no se entera, no hay render nuevo y el `<Text>` conserva lo que pintó la última vez. Internamente `tamanio` ya vale 3.

**b)** Al escribir en el `TextInput` controlado se llama a `setState` y el componente se vuelve a renderizar. En ese render se lee `espera.tamanio`, que ya vale 3, y el número "salta". El valor estuvo mal desde el primer toque: solo se ve cuando otra cosa provoca un render.

Un error que aparece "a veces" es peor que uno que aparece siempre porque depende de algo que no tiene relación con el problema (en este caso, escribir en otro campo). Es difícil de reproducir, puede pasar las pruebas manuales y hace desconfiar de toda la pantalla. Un error constante se ve enseguida y se corrige.

**c) Cómo lo resolví y alternativas**

En el Context nunca muto la `Cola` ni la `Pila` que está en el estado. Hago una copia, modifico la copia y guardo un objeto nuevo:

```ts
// src/lib/biblioteca.ts:45-52
export function copiarCola<T>(cola: Cola<T> | undefined): Cola<T> {
  return new Cola<T>(cola ? cola.aArray() : []);
}

// src/context/BibliotecaContext.tsx:172-174 (reservar sin ejemplares)
const nueva = copiarCola(esperas[libro.isbn]);
nueva.encolar(NOMBRE_USUARIO_ACTUAL);
setEsperas((anteriores) => ({ ...anteriores, [libro.isbn]: nueva }));
```

Lo mismo hago en "Entregar al siguiente" (`BibliotecaContext.tsx:240-245`) y con la pila de recientes (`:147-156`).

| Opción | Ventaja | Costo |
| --- | --- | --- |
| **Copiar la cola y reemplazarla** (mi solución) | React ve un objeto nuevo y re-renderiza siempre; `useMemo` y las dependencias funcionan por referencia; el estado viejo no cambia. | Copiar cuesta O(n) por operación. Con listas de 1 a 3 personas no importa. Hay que acordarse de copiar siempre. |
| Contador de versión (`useState` que se incrementa después de mutar) | Muy barato: no copia nada. | La cola sigue siendo el mismo objeto, así que cualquier `useMemo` o dependencia que use la cola no detecta el cambio. Si una función olvida incrementar el contador, vuelve el error de B3. |
| `useReducer` | Todas las transiciones en un solo lugar, fáciles de probar. | El reducer también tiene que devolver un estado nuevo, así que se sigue copiando. Es más código para una app de este tamaño. |

---

### B4. ¿Dónde vive cada dato?

| Dato | Dónde vive en mi app | Por qué ahí y no en otro lugar |
| --- | --- | --- |
| Texto del buscador | **URL** (`q`, leído con `useLocalSearchParams` en `buscar.tsx:26-28`). | Así un link `bibliotecaipf://buscar?q=borges` abre la búsqueda hecha y hay una sola fuente de verdad. En estado local se perdería al compartir o volver a abrir el link. |
| Préstamos y reservas | **Context** (`prestamos` en `BibliotecaContext.tsx`), guardado en AsyncStorage. | Lo usan el detalle, la confirmación, Mis reservas y el mostrador, que son pantallas de navegadores distintos. |
| Listas de espera | **Context** (`esperas: Record<isbn, Cola<string>>`). | Las modifican la reserva y el mostrador, y las leen el detalle y Mis reservas. |
| Vistos recientemente | **Context** (`recientes: Pila<Libro>`), guardado en AsyncStorage. | Se apila en el detalle y se muestra en el Catálogo: dos pantallas distintas. |
| Sesión del personal | **Context** (`sesionIniciada`). No se guarda a propósito. | La necesita el layout raíz para `Stack.Protected`. Al cerrar la app se cierra la sesión, que es lo esperable en un mostrador compartido. |
| Ejemplares disponibles de un libro | **Se calcula** (`calcularDisponibles`, `src/lib/biblioteca.ts:9-20`). | Sale de `libro.ejemplares`, los préstamos activos y lo devuelto. Guardarlo sería tener el mismo dato dos veces (ver E4 d). |
| Estado del permiso de cámara | **Sistema operativo**. La app lo consulta con `useCameraPermissions` dentro de `usePermiso` (estado del hook). | La fuente de verdad es el sistema: la persona lo puede cambiar en Ajustes. Por eso se vuelve a consultar al volver a la app y al enfocar la pantalla. |
| Identificador de la notificación programada | **Context**, dentro de cada préstamo (`notificacionId`), guardado en AsyncStorage. | Hace falta para cancelarla al apagar el interruptor o al devolver el libro, aunque la app se haya cerrado. |

**¿Qué se re-renderiza cuando cambia el `value` del Context?**

Todos los componentes que llaman a `useBiblioteca()` (que usa `useContext`): `PilaRaiz` en el layout raíz, `LinkPersonal`, Catálogo, detalle, Mis reservas, confirmación de reserva, mostrador y `ContenidoPermiso`. `value` es un único objeto (`BibliotecaContext.tsx:287`). Cuando cambia `prestamos`, el objeto es nuevo y React avisa a todos los que lo consumen.

Entonces **sí**: el Catálogo solo usa `recientes`, pero se vuelve a renderizar cuando se activa un recordatorio en "Mis reservas", porque ese cambio crea un `value` nuevo.

Para evitarlo se podría dividir el Context en varios (`RecientesContext`, `PrestamosContext`, `SesionContext`), o usar un selector (por ejemplo `use-context-selector`) para que cada pantalla se suscriba solo a lo que usa.

En una app de este tamaño no lo veo necesario. Son 16 libros y unas pocas pantallas, y el proyecto tiene activado React Compiler (`app.json` → `experiments.reactCompiler`), que memoriza los elementos cuyas props no cambiaron. No lo medí: para decidir lo haría con el Profiler de React DevTools ("Highlight updates while rendering") antes de agregar complejidad.

---

## Parte C · Navegación y rutas

### C1. La pila en mi app

Notación: `Stack raíz: [base → tope]`, `Tabs: pestaña activa`, `Stack Catálogo: [base → tope]`.

| # | Acción | Pilas resultantes |
| --- | --- | --- |
| 1 | Abre la app. | Stack raíz: `[(tabs)]` · Tabs: Catálogo · Stack Catálogo: `[index]` |
| 2 | Toca un libro del Catálogo. | Stack raíz: `[(tabs)]` · Stack Catálogo: `[index → libro/[isbn]]` |
| 3 | Toca "Reservar". | Stack raíz: `[(tabs) → reservar/[isbn] (modal)]` · Stack Catálogo: `[index → libro/[isbn]]` |
| 4 | Toca "Confirmar". | Stack raíz: `[(tabs)]` (el modal se cerró) · Tabs: **Mis reservas** · Stack Catálogo sigue `[index → libro/[isbn]]` |
| 5 | Toca atrás (Android). | Stack raíz: `[(tabs)]` · Tabs: vuelve a **Catálogo** · Stack Catálogo: `[index → libro/[isbn]]`, así que se ve el detalle. [razonado] |
| 6 | Toca la tab "Catálogo". | Si la pestaña Catálogo ya está activa, tocarla otra vez vacía su Stack: `[index]`. Si se toca desde "Mis reservas", se ve lo que había: `[index → libro/[isbn]]`. |

[verificado en web] para los pasos 1 a 4. Después de confirmar, la URL pasó a `/reservas` y "atrás" no volvió a la confirmación. También verifiqué el paso 6: con un detalle abierto, fui a "Mis reservas", toqué "Catálogo" y apareció el detalle (`/libro/9788437604572`). Al tocar "Catálogo" de nuevo volvió a `/`.

En la web, el paso 5 se comportó distinto: `history.back()` me llevó a `/` (el índice), porque el navegador web sigue su propio historial de URLs. En Android el botón atrás lo maneja el navegador de pestañas. Por defecto vuelve a la primera pestaña sin tocar su Stack, así que debería verse el detalle; falta confirmarlo en el teléfono.

**a) Método del paso 4**

Usé `router.dismissTo('/reservas')` (`src/app/reservar/[isbn].tsx:17-19`, llamado en `confirmar()`, `:87-93`). Cierra pantallas del Stack más cercano hasta llegar a `/reservas`.

- Con `push`, `/reservas` se agregaría **encima** del modal. "Atrás" volvería a la confirmación y se podría confirmar dos veces.
- Con `replace`, el modal se reemplazaría por una entrada nueva en el Stack raíz. Podría quedar otra instancia de `(tabs)` encima de la original, con dos Catálogos en el historial.
- Con `dismissTo`, el modal se cierra y la navegación termina en la pestaña "Mis reservas" que ya existía, sin duplicados ni forma de volver a la confirmación. Por eso lo elegí.

**b) ¿Qué ve la persona en el paso 6?**

Depende de desde dónde toque. Si viene de "Mis reservas", ve **el detalle**: cada pestaña conserva su propio Stack y el detalle quedó arriba en el paso 2. Si la pestaña Catálogo ya está activa (como después del paso 5), tocarla vuelve al **Catálogo**: tocar una pestaña activa vacía su Stack hasta la primera pantalla.

Me parece correcto para esta app. Si alguien estaba mirando un libro y fue a ver sus reservas, al volver lo encuentra donde lo dejó. Si quiere el listado, un segundo toque lo lleva ahí, igual que en las apps conocidas.

### C2. El escáner que dispara de más

**a)** `onBarcodeScanned` se ejecuta muchas veces por segundo mientras el código sigue frente a la cámara. Sin protección, cada llamada haría un `router.push`, y cada `push` es una acción que entra en la cola de acciones de navegación (como vimos en el TP 2). Se procesan una tras otra, así que se apilarían varias copias del mismo detalle, y para volver habría que tocar atrás muchas veces. Además, cada detalle haría su propio pedido a la API.

**b)** Usé `useRef` (`src/app/escanear.tsx:24`, verificado en `:35` y marcado en `:47`):

```ts
const yaNavego = useRef(false);
// …
if (yaNavego.current) {
  return;
}
// …
yaNavego.current = true;
router.replace({ pathname: '/libro/[isbn]', params: { isbn } });
```

Un `useState` puesto en `true` no alcanza porque el valor nuevo recién existe en el **próximo render**. Las llamadas a `onBarcodeScanned` que llegan antes de ese render ejecutan una función creada en el render anterior, cuya clausura sigue viendo `false`, así que navegan otra vez. Un ref es el mismo objeto en todos los renders: `yaNavego.current = true` se ve al instante en la próxima llamada, haya o no render en el medio.

**c)** Con `replace` el escáner sale del historial y el detalle ocupa su lugar. Al tocar atrás desde el detalle, la persona vuelve a lo que había antes del escáner (el Catálogo), que es lo esperable.

Con `push` el escáner quedaría debajo y "atrás" volvería a la cámara. En mi código `yaNavego` seguiría en `true` (la pantalla no se desmontó), así que la cámara se vería pero no reaccionaría a ningún código: una pantalla "muerta". Sin el ref sería peor: volvería a leer el mismo libro y a navegar.

[verificado en web] Con la entrada manual (que usa la misma función `abrirIsbn`), escribí 9788437604572, se abrió el detalle de Rayuela con `replace` y la URL pasó de `/escanear` a `/libro/9788437604572`.

**d)** Si el ISBN no está en el catálogo, muestro un aviso dentro de la pantalla ("El ISBN … no está en el catálogo. Probá con otro libro."), no navego y la cámara sigue activa (`escanear.tsx:38-46`). Para que el mismo código no dispare el aviso una y otra vez, guardo el último ISBN no encontrado en otro ref (`ultimoNoEncontrado`, `:25`) y solo actualizo el aviso si el código leído es distinto (`:41-44`). Con la entrada manual el aviso se muestra siempre, porque es una acción explícita.

[verificado en web] Con la entrada manual, 978-99-9999-999-9 mostró el aviso y no navegó (captura `19-escaner-isbn-no-encontrado.jpg`). La lectura con la cámara no la pude probar: el panel del navegador bloquea la cámara.

### C3. Deep links y rutas protegidas

No pude probar los links en Expo Go con `exp://IP:8081/--/…`: no tengo un teléfono en este entorno. Probé las **mismas rutas en la versión web** (`http://localhost:8081/…`). La columna "Qué parte de mi código lo decide" no depende de la plataforma.

| Link | Qué ve la persona | Qué queda debajo en la pila | Qué parte de mi código lo decide |
| --- | --- | --- | --- |
| `bibliotecaipf://libro/9788499089508` | El detalle de "Ficciones". | El Catálogo (aparece la flecha atrás y lleva a `/`). [verificado en web] | `unstable_settings = { anchor: 'index' }` en `src/app/(tabs)/(catalogo)/_layout.tsx:5-8`, y la ruta `libro/[isbn].tsx`. |
| `bibliotecaipf://libro/123` | "Ese código no es un ISBN" con el botón "Ir al Catálogo" (captura 07). | El Catálogo. [verificado en web] | La validación `esIsbnValido(isbn)` en `libro/[isbn].tsx:24` y `:33-46` (`src/lib/isbn.ts:7-9`). |
| `bibliotecaipf://buscar?q=borges` | El buscador con "borges" escrito y sus resultados (captura 04). | Las pestañas con el Catálogo: la flecha atrás llevó a `/`. [verificado en web] | `unstable_settings = { anchor: '(tabs)' }` en `src/app/_layout.tsx:11-13`, y `useLocalSearchParams` en `buscar.tsx:26`. |
| `bibliotecaipf://mostrador` (sin sesión) | El Catálogo: la ruta `/mostrador` no existe sin sesión. | En la web el Catálogo apareció con una flecha atrás que llevaba a otro Catálogo (la redirección dejó dos entradas de `(tabs)`). [verificado en web] | `<Stack.Protected guard={sesionIniciada}>` en `src/app/_layout.tsx:50-52`. Al no cumplirse, Expo Router redirige al ancla. |
| `bibliotecaipf://reserva` | "Mis reservas": la URL terminó en `/reservas`. [verificado en web] | Las pestañas (`(tabs)`), con Mis reservas activa. | `<Redirect href="/reservas" />` en `src/app/reserva.tsx:4-6`. |
| `bibliotecaipf://escanear` (cámara bloqueada) | "La cámara está bloqueada", el botón "Abrir Ajustes" y el campo para escribir el ISBN a mano. [razonado] | Las pestañas con el Catálogo (ancla del Stack raíz). | `derivarEstado` en `src/hooks/usePermiso.ts:20-28` (`canAskAgain === false` → `'bloqueado'`) y la rama `else` de `escanear.tsx:87-97`. |

En la web no pude dejar la cámara en estado "bloqueado": expo-camera en la web siguió informando `canAskAgain: true` aunque el navegador la negara. La última fila hay que comprobarla en el teléfono.

**¿Por qué `/libro/123` llega al detalle?** Porque `[isbn]` es un segmento dinámico: Expo Router acepta **cualquier** texto en esa posición y se lo pasa a la pantalla como string. El router solo resuelve qué archivo corresponde a la URL; no sabe qué es un ISBN válido ni qué libros existen. La responsabilidad de responder bien es de la pantalla: validar el formato, buscar el libro y mostrar un mensaje claro con una salida si no existe. Eso hace `libro/[isbn].tsx`.

### C4. Foco, montaje y primer plano

**a) Qué evento detecta cada una**

- `useEffect` con `[]`: el **montaje** del componente (y la limpieza, el desmontaje). No vuelve a correr mientras la pantalla siga montada.
- `useFocusEffect`: cada vez que la pantalla **recibe el foco dentro de la navegación** (al volver de otra pestaña, al cerrar un modal o al volver de una pantalla apilada encima). La limpieza corre al perder el foco.
- `AppState`: los cambios de la **app completa** entre primer plano y segundo plano (`active`, `background`, `inactive` en iOS). No sabe de pantallas.

**b) Quién se entera**

- La persona sale a Ajustes, habilita las notificaciones y vuelve: se entera **`AppState`** (la app pasa de `background` a `active`). `useFocusEffect` no, porque dentro de la navegación la pantalla nunca perdió el foco. `useEffect` con `[]` tampoco, porque la pantalla no se volvió a montar.
- La persona va a la pestaña Catálogo y vuelve a "Mis reservas": se entera **`useFocusEffect`**. `AppState` no cambia (la app siempre estuvo en primer plano) y `useEffect` con `[]` no corre (la pestaña sigue montada, como vi en B1 b).

**c) Qué usé**

Usé las dos:

- `AppState` dentro de `usePermiso` (`src/hooks/usePermiso.ts:65-72`): al volver a `active` llama a `actualizar()`. Cubre la vuelta desde Ajustes.
- `useFocusEffect` en "Mis reservas" (`src/app/(tabs)/reservas.tsx:42-46`) y en el escáner (`src/app/escanear.tsx:28-33`). Cubre el cambio de pestaña y el cierre del modal `/permisos/…`, que usa otra instancia del hook.

Agregué el `useFocusEffect` del escáner después de una prueba. Sin él, al volver del modal `/permisos/camara` el escáner seguía con la respuesta vieja de su propio `useCameraPermissions`: el modal pide el permiso con otra instancia del hook. Con solo `AppState`, el escáner habría seguido mostrando "Usar la cámara" después de que la persona aceptara en el modal, en los casos en que el diálogo del sistema no cambia el `AppState` de la app.

---

## Parte D · Permisos en mi app

### D1. Recorrido completo de la cámara

**Toda esta tabla es [razonada]**: no tengo un Android 14 en este entorno. Sale de mi código (`usePermiso.ts:20-28`, `ContenidoPermiso.tsx:24-34`, `escanear.tsx:59-97`) y del comportamiento documentado de Android 11+ (dos rechazos equivalen a "no volver a preguntar"). Hay que confirmarla en el teléfono.

| # | Acción | Qué muestra mi app | `status` | `canAskAgain` |
| --- | --- | --- | --- | --- |
| 1 | Toca "Escanear" por primera vez. | Un instante "Revisando el permiso de la cámara…" y después "Escaneá con la cámara", con el botón "Usar la cámara" y el campo para escribir el ISBN. | `undetermined` | `true` |
| 2 | "Usar la cámara" → `/permisos/camara` → "Continuar" → "No permitir". | El modal se cierra (`pedir()` devolvió `'preguntable'`) y el escáner vuelve a mostrar "Escaneá con la cámara" y la entrada manual. | `denied` | `true` |
| 3 | Toca "Escanear" otra vez. | Lo mismo que el paso 2: "Escaneá con la cámara" y "Usar la cámara". | `denied` | `true` |
| 4 | "Continuar" → "No permitir". | `pedir()` devuelve `'bloqueado'`, así que el modal **no** se cierra (`ContenidoPermiso.tsx:31`) y pasa a mostrar "Está bloqueado: podés habilitarlo en Ajustes" con el botón "Abrir Ajustes". | `denied` | `false` |
| 5 | Toca "Escanear" otra vez. | "La cámara está bloqueada", el botón "Abrir Ajustes" y el campo para escribir el ISBN. | `denied` | `false` |
| 6 | "Abrir Ajustes" → habilita la cámara → vuelve a la app. | El listener de `AppState` reconsulta el permiso y la pantalla pasa a mostrar la cámara (`CameraView`) con "Apuntá al código de barras de la contratapa". | `granted` | `true` |

[verificado en web] Solo los pasos 1 y 2 en la versión web: se ve "Escaneá con la cámara" (captura 17), "Usar la cámara" abre `/permisos/camara` con "Continuar" (captura 18) y, al negar, se vuelve al escáner.

**a) iOS** [razonado, no tengo un iPhone]. iOS muestra el diálogo del sistema **una sola vez**. El cambio aparece en el **paso 2**: después del primer "No permitir", `canAskAgain` pasa a `false`. Mi app muestra en el mismo modal "Está bloqueado… Abrir Ajustes" (no se cierra) y, desde el paso 3, el escáner muestra directamente "La cámara está bloqueada" con "Abrir Ajustes". El paso 4 ya no muestra ningún diálogo.

**b) La línea que decide**

```ts
// src/hooks/usePermiso.ts:27
return respuesta.canAskAgain ? 'preguntable' : 'bloqueado';
```

Usa el campo `canAskAgain`. `status` no alcanza porque vale `'denied'` en los dos casos: cuando la persona dijo "No permitir" una vez y se le puede volver a preguntar, y cuando ya no se le puede preguntar más. Con `status` solo, la app mostraría "Continuar" en un estado en el que `requestPermission()` no abre ningún diálogo: la persona tocaría el botón y no pasaría nada.

**c) Paso 6**

Se entera el listener de `AppState` de `usePermiso` (`usePermiso.ts:65-72`): cuando la app vuelve a `active`, llama a `actualizar()`, que vuelve a consultar el permiso con la función `get` de `useCameraPermissions`. Sin esa parte, la pantalla seguiría mostrando "La cámara está bloqueada" aunque el permiso ya estuviera concedido, hasta salir del escáner y volver a entrar (lo que lo vuelve a montar).

### D2. Notificaciones y consistencia

**a)** Si no se cancelara, a los 15 segundos llegaría "Acordate de devolver … a la biblioteca" por un libro que ya se devolvió: un aviso falso que confunde y hace perder confianza en los recordatorios. Por eso `devolver` cancela la notificación antes de quitar el préstamo (`BibliotecaContext.tsx:180-198`, en especial la línea 187). Lo mismo hace `desactivarRecordatorio` al apagar el interruptor (`:225`).

**b) Dónde guardo el identificador y qué pasa si la app se cierra**

El identificador que devuelve `scheduleNotificationAsync` se guarda en el préstamo (`notificacionId`), dentro del Context, y el Context se guarda en AsyncStorage (`src/lib/almacenamiento.ts`).

Si la app se cierra antes de que llegue la notificación:

- **La notificación** queda programada en el sistema operativo, que la muestra igual a los 15 segundos: no depende de que la app esté abierta.
- **El identificador** sigue guardado en AsyncStorage.

El problema es que, cuando la persona vuelve a abrir la app, el préstamo todavía tiene `notificacionId` aunque la notificación ya se mostró. El interruptor "Recordarme" aparece encendido sin ningún recordatorio pendiente. Si no hubiera persistencia, pasaría lo contrario: la notificación llegaría pero la app ya no tendría el identificador para cancelarla si la persona devuelve el libro.

Lo resolví de dos formas:

1. Al iniciar, el Context consulta qué notificaciones siguen programadas (`getAllScheduledNotificationsAsync`, `src/lib/notificaciones.ts`) y borra los identificadores que ya no están (`limpiarRecordatoriosVencidos`, `src/lib/biblioteca.ts:54-68`, usado en `BibliotecaContext.tsx:95-100`).
2. Con la app abierta, un listener de notificaciones recibidas apaga el interruptor cuando llega el recordatorio (`BibliotecaContext.tsx:113-122`).

[razonado] Lo comprobé con `tsc` y en la web la app carga sin errores. Que el identificador se limpie al recibir la notificación hay que verlo en el teléfono, porque en la web no hay notificaciones locales.

**c) El canal antes del permiso**

En Android 13 (API 33) o superior las notificaciones necesitan el permiso en tiempo de ejecución `POST_NOTIFICATIONS`. La documentación de expo-notifications indica que el sistema muestra el diálogo de permiso recién cuando la app ya tiene al menos un canal de notificaciones creado. Por eso `pedirPermisoNotificaciones()` llama primero a `crearCanalPrestamos()` (`src/lib/notificaciones.ts:20-27` y `:34-37`). Si se pidiera antes, el diálogo podría no aparecer y la respuesta sería "denegado" sin que la persona eligiera nada.

En Android 12 o inferior no existe ese permiso en tiempo de ejecución: las notificaciones están permitidas desde la instalación, `requestPermissionsAsync()` devuelve "concedido" sin mostrar un diálogo y la persona solo puede desactivarlas desde Ajustes. El canal sigue siendo necesario desde Android 8 para mostrar notificaciones, pero ya no condiciona el diálogo.

**d) Libro entregado con el permiso denegado**

La persona se entera por un **aviso dentro de la app**: un banner en "Mis reservas" con "¡Te entregaron "…"! Ya figura en tus préstamos." (captura `24-aviso-en-mis-reservas.jpg`, [verificado en web], donde las notificaciones no están disponibles).

El código que decide está en `src/context/BibliotecaContext.tsx:259-266`:

```ts
const notificado =
  (await tienePermisoNotificaciones()) && (await notificarLibroEntregado(titulo));
if (!notificado) {
  setAvisos((anteriores) => [
    ...anteriores,
    crearAviso(`¡Te entregaron "${titulo}"! Ya figura en tus préstamos.`),
  ]);
}
```

`tienePermisoNotificaciones()` (`notificaciones.ts:39-46`) consulta el permiso **en ese momento** con `getPermissionsAsync()`; no usa un valor guardado. Importa porque la persona puede cambiar el permiso en Ajustes en cualquier momento. Con un valor guardado de antes, la app podría intentar notificar sin permiso (la notificación se pierde en silencio y la persona no se entera de nada), o mostrar el aviso interno aunque ya haya dado el permiso. Además, si programar la notificación falla por cualquier motivo, `notificado` queda en `false` y se muestra el aviso igual.

### D3. Lo que mi app pide y lo que no

Android: salida real de `npx expo prebuild --platform android` más los manifiestos de las librerías en `node_modules`. iOS: no pude generar la carpeta `ios` en Windows, así que la deduje del código del plugin `expo-camera` (`node_modules/expo-camera/plugin/build/withCamera.js`). [razonado] para iOS.

| Plataforma | Permiso o clave declarada | Función de la app que lo justifica | ¿Quién lo agrega? |
| --- | --- | --- | --- |
| Android | `android.permission.CAMERA` | Leer el código de barras en `/escanear`. | El plugin y el manifiesto de `expo-camera`. |
| Android | `android.permission.POST_NOTIFICATIONS` | Recordatorio de devolución y aviso de libro entregado. | El manifiesto de `expo-notifications`. |
| Android | `android.permission.RECEIVE_BOOT_COMPLETED` | Que las notificaciones programadas sobrevivan a un reinicio del teléfono. | El manifiesto de `expo-notifications`. |
| Android | `android.permission.INTERNET`, `android.permission.VIBRATE` | Conexión con el servidor de desarrollo (Metro) y vibración de las notificaciones. | La plantilla de `expo prebuild` (no los agregué yo). |
| Android | `RECORD_AUDIO`, ubicación, almacenamiento, `READ_MEDIA_*`, `SYSTEM_ALERT_WINDOW` con `tools:node="remove"` | Ninguna: se **bloquean**. | Yo, con `android.blockedPermissions` en `app.json`. |
| iOS | `NSCameraUsageDescription` = "Usamos tu cámara para leer el código de barras del libro y abrir su ficha al instante." | Escáner. | El plugin `expo-camera` con mi texto (`cameraPermission`). |
| iOS | (sin `NSMicrophoneUsageDescription`) | La app no graba audio. | `microphonePermission: false` en el plugin `expo-camera`. |
| iOS | Notificaciones: no necesitan una clave en Info.plist; se piden en tiempo de ejecución. Sin entitlement de push. | Recordatorios locales. | `expo-notifications` con `enableRemoteNotifications: false`. |

**a) ¿Por qué no declaro `RECORD_AUDIO`?**

`expo-camera` puede grabar video con sonido, y por eso su plugin agrega `RECORD_AUDIO` por defecto. En el código del plugin se ve: `recordAudioAndroid && 'android.permission.RECORD_AUDIO'`, con `recordAudioAndroid = true` por defecto. Mi app solo lee códigos de barras, así que lo desactivo y además lo bloqueo por si otra librería lo agregara:

```json
["expo-camera", {
  "cameraPermission": "Usamos tu cámara para leer el código de barras del libro y abrir su ficha al instante.",
  "microphonePermission": false,
  "recordAudioAndroid": false
}]
```

```json
"android": {
  "blockedPermissions": ["android.permission.RECORD_AUDIO", "…"]
}
```

En el manifiesto generado quedó `<uses-permission android:name="android.permission.RECORD_AUDIO" tools:node="remove"/>`.

**b) "Elegir una foto de portada desde la galería"**

Usaría `expo-image-picker` con `launchImageLibraryAsync`. [razonado, a verificar con la documentación de la versión 58] En Android 13+ y en iOS 14+ abre el selector de fotos del sistema, que no necesita un permiso de lectura de toda la galería: la app solo recibe la foto que la persona elige. Mantendría bloqueados `READ_MEDIA_IMAGES` y `READ_EXTERNAL_STORAGE`, y revisaría qué clave agrega el plugin en iOS (`photosPermission`) para escribir un texto de propósito propio.

**No alcanza con una actualización OTA**: `expo-image-picker` tiene código nativo que no está en el binario actual, y una actualización OTA solo reemplaza el JavaScript y los assets. Hace falta una build nueva. Hay que sacar además `expo-image-picker` de la lista de "no instala" de los requisitos.

**c) Qué no pude verificar en Expo Go**

- **El texto de propósito de la cámara**: Expo Go es una app ya compilada con sus propios textos, así que el diálogo muestra el texto de Expo Go, no el mío.
- **`blockedPermissions`, `microphonePermission: false` y `recordAudioAndroid: false`**: según la documentación, `blockedPermissions` no tiene efecto en Expo Go. Los permisos que declara el binario son los de Expo Go.
- **El canal `prestamos`**: se crea, pero aparece dentro de los ajustes de notificaciones de Expo Go, no de una app "Biblioteca IPF".
- **El scheme `bibliotecaipf://`**: en Expo Go los links son `exp://IP:8081/--/…`.

Para verificarlo haría un *development build* (`npx expo run:android` o `eas build --profile development`) e instalaría la app propia. Revisaría el diálogo de la cámara (captura del desafío opcional), el manifiesto generado (ya lo revisé con `expo prebuild`, ver README), Ajustes → Apps → Biblioteca IPF → Notificaciones (debería aparecer el canal "Préstamos") y los links `bibliotecaipf://`.

**Aclaración:** en este entorno no tuve ningún teléfono, así que tampoco pude correr la app en Expo Go. Todo lo marcado [razonado] queda pendiente de esa prueba.

---

## Parte E · Buenas prácticas y decisiones de diseño

### E1. Revisión de código

**a) Problemas**

| # | Línea | Clasificación | Problema y por qué sucede | Corrección |
| --- | --- | --- | --- | --- |
| 1 | 18-20 | Rendimiento / error de ejecución | `useEffect` sin array de dependencias: corre después de **cada** render. Como `setLibros` recibe un array nuevo, provoca otro render, que vuelve a pedir los libros: un bucle infinito de pedidos. | Array de dependencias y limpieza; en mi app, `useLibros` con `[intento]`. |
| 2 | 19 | Error de ejecución | La promesa no tiene `catch`. `obtenerLibros()` falla 1 de cada 5 veces y genera un rechazo no manejado. La persona ve la lista vacía sin explicación. | `try/catch` y un estado `error` con mensaje y "Reintentar". |
| 3 | 18-20 | Mala práctica | No hay estados de carga, error ni vacío: mientras carga, o si falla, la pantalla queda en blanco. | Usar `cargando`, `error` y `ListEmptyComponent`. |
| 4 | 19 | Advertencia / error | Sin limpieza: si la pantalla se desmonta antes de la respuesta, se hace `setState` sobre un componente desmontado, y una respuesta vieja puede pisar a una nueva. | Bandera `ignorar` en la limpieza. |
| 5 | 13-16 | Mala práctica (y motivo de rechazo) | Pide cámara y notificaciones apenas se abre el Catálogo, sin contexto ni pantalla previa y sin que la persona haya hecho nada relacionado. | Pedir la cámara recién al escanear (con `/permisos/camara`) y las notificaciones al activar "Recordarme". |
| 6 | 13-16 | Advertencia (lint `react-hooks/exhaustive-deps`) | El efecto usa `pedirPermiso` pero tiene `[]` como dependencias. Además, la promesa de `requestPermissionsAsync()` no se espera ni se maneja. | Sacar ese efecto (ver punto 5). |
| 7 | 11 | Advertencia (lint `no-unused-vars`) | `permiso` se declara y nunca se usa. | Usar el estado (cuatro estados) o eliminarlo. |
| 8 | 10 y 22 | Mala práctica | `any[]` y `libro: any`: se pierde el tipado de `Libro` y los errores aparecen en tiempo de ejecución en lugar de en `tsc`. | `useState<Libro[]>([])` y `{ libro: Libro }`. |
| 9 | 22-30 | Rendimiento / mala práctica | `Fila` se declara **dentro** de `Catalogo`. En cada render es una función nueva, o sea un tipo de componente distinto: React desmonta y vuelve a montar todas las filas en vez de actualizarlas. | Declararla a nivel de módulo, en su propio archivo (`src/components/FilaLibro.tsx`). |
| 10 | 25 | Mala práctica | Estilos en línea con valores fijos (`16`, `#333`, `12`): no respeta el tema, no funciona en modo oscuro y crea un objeto nuevo en cada render. | `StyleSheet.create` con valores de `src/constants/tema.ts`. |
| 11 | 24 | Mala práctica | `router.push('/libro/' + libro.isbn)`: la concatenación de strings no aprovecha las rutas tipadas, así que un error en la ruta no lo detecta `tsc`. | `router.push({ pathname: '/libro/[isbn]', params: { isbn } })`. |
| 12 | 33-36 | Rendimiento | `ScrollView` con `map` renderiza todos los elementos a la vez, aunque no se vean. | `FlatList`. |
| 13 | 35 | Advertencia / error lógico | `key={i}` usa el índice: si la lista cambia de orden o se filtra, React asocia el estado a la fila equivocada. | `keyExtractor={(libro) => libro.isbn}`. |
| 14 | 37-39 | Accesibilidad | El botón de la cámara es solo un ícono y no tiene `accessibilityRole="button"` ni `accessibilityLabel`: un lector de pantalla no sabe qué hace. Además, con un ícono de 28 px y sin padding, el área táctil es menor a 44 × 44. | Rol, etiqueta ("Escanear código de barras") y `minWidth/minHeight: 44`. |
| 15 | 6, 15 | Mala práctica (acoplamiento) | El Catálogo importa `expo-notifications`, que no tiene nada que ver con listar libros. | Mover la lógica de notificaciones a `src/lib/notificaciones.ts`. |

**b) El efecto de las líneas 18-20 durante el primer minuto**

1. Render 1: `libros = []`. Después del commit corre el efecto y llama a `obtenerLibros()`.
2. 800 ms después llega la respuesta y `setLibros(datos)` guarda un array **nuevo**, lo que provoca el render 2.
3. Como el efecto no tiene array de dependencias, corre de nuevo después del render 2 y pide los libros otra vez.
4. Se repite: un pedido cada ~800 ms, unos **75 pedidos por minuto**. La lista se vuelve a pintar cada vez y consume red y batería.
5. Como 1 de cada 5 pedidos falla y no hay `catch`, en un minuto aparecen unos 15 rechazos no manejados (advertencias en desarrollo). Cuando un pedido falla no hay `setLibros`, así que no hay render. Si nada más provoca un render, el bucle se corta ahí y la lista queda con los datos del pedido anterior. Cualquier otro render lo vuelve a arrancar.

Si `obtenerLibros()` devolviera **siempre el mismo array**, el bucle se cortaría en el segundo pedido. El primer `setLibros(A)` cambia `[]` por `A` y provoca un render. El efecto vuelve a pedir y llama a `setLibros(A)` con la misma referencia. React compara con `Object.is`, ve que no cambió y no vuelve a renderizar (puede hacer un render extra antes de descartarlo, pero sin commit no corre el efecto). Sin render no corre el efecto. El problema de fondo seguiría ahí: el código funcionaría "de casualidad", porque la API devuelve objetos nuevos, como cualquier API real.

**c) La pantalla reescrita con mi app**

Es el archivo real `src/app/(tabs)/(catalogo)/index.tsx`:

```tsx
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
```

Los permisos ya no se piden acá. El botón de escanear es un `Boton` con texto, `accessibilityRole="button"` y área mínima de 44 × 44 (`src/components/Boton.tsx`). La fila tiene rol, etiqueta y su propio archivo (`src/components/FilaLibro.tsx`).

**d) Tienda y desinstalación**

- **Rechazo en una tienda: pedir cámara y notificaciones al abrir la app (líneas 13-16).** Las guías de App Store piden solicitar los permisos cuando la función se usa y con un propósito claro. Pedir la cámara en la pantalla de catálogo, sin relación con lo que la persona está haciendo, es motivo típico de rechazo en la revisión. Google Play también revisa el uso justificado de permisos sensibles.
- **Desinstalación: también los permisos al inicio, seguidos del bucle de pedidos.** Lo primero que ve la persona son dos diálogos del sistema sin explicación, y es la primera impresión. Si igual se queda, el bucle de la línea 18 gasta datos y batería sin parar, y la app "se siente" pesada. Elijo los diálogos como primera causa porque aparecen en los primeros segundos, antes de que la persona vea un solo libro.

### E2. Organización y acoplamiento

**a) Quién importa a quién**

Lo obtuve con `grep` sobre los `import` de cada carpeta:

```
app          → components, constants, context (solo _layout.tsx), hooks, lib, types
components   → constants, hooks, lib, types
hooks        → constants, context, lib, types
context      → constants, data, estructuras, lib, types
lib          → constants, data, estructuras, types
data         → types
constants    → types
estructuras  → (nada, salvo sus tests que importan Pila y Cola)
types        → (nada)
```

No hay importaciones "hacia arriba": ningún archivo fuera de `src/app` importa algo de `src/app`, y `lib`, `estructuras`, `data`, `types` y `constants` no importan componentes ni hooks. Si un hook importara algo de `src/app`:

- crearía dependencias circulares (la pantalla importa el hook y el hook la pantalla);
- ataría la lógica a una ruta concreta, así que mover o renombrar un archivo de rutas rompería código que no tiene nada que ver con la navegación;
- como cada archivo de `src/app` es una ruta, Expo Router podría tratar como pantalla algo que solo se quería reutilizar.

**b) Si el catálogo viniera de una API real**

`LIBROS` solo se importa en `src/lib/api.ts`. Lo comprobé con `grep`:

```
src/lib/api.ts:1:import { LIBROS } from '../data/libros';
```

Cambiaría `src/lib/api.ts`: el cuerpo de `obtenerLibros` y `buscarLibros` pasaría a usar `fetch`, con la misma firma `Promise<Libro[]>`. `src/data/libros.ts` dejaría de usarse y se borraría. El resto (hooks, pantallas, componentes) no cambia, porque solo conoce `obtenerLibros()` y `buscarLibros()`.

La lista tiene dos archivos (uno modificado y uno borrado). Eso indica que el acceso a datos está aislado en una sola capa. Si cambiaran más archivos, querría decir que las pantallas dependen de cómo se obtienen los datos y no solo de qué datos reciben. Las listas de espera iniciales (`src/data/esperaInicial.ts`, importado por el Context) también vendrían del servidor en una app real, pero eso es otra API, no el catálogo.

**c) `<ConPermiso recurso="camara">…</ConPermiso>`**

- **Ganaría:** menos código en cada pantalla, una forma declarativa de decir "esto necesita la cámara" y la misma interfaz de permisos en toda la app.
- **Perdería:**
  1. Flexibilidad. El escáner tiene que mostrar el campo para escribir el ISBN **en los cuatro estados**. Un envoltorio que reemplaza a sus hijos cuando no hay permiso esconde justamente la alternativa que hace que la app nunca se bloquee.
  2. La pantalla previa como ruta (`/permisos/[recurso]`, modal), que se puede abrir desde cualquier lugar, tiene su URL y se cierra con "atrás".
  3. Separación: el componente mezclaría la lógica del permiso con la interfaz.

**No me serviría para las notificaciones.** Esas se piden desde un interruptor, como reacción a una acción: no hay una pantalla que "necesite" el permiso para mostrarse. Ahí hace falta algo imperativo: consultar en el momento, navegar a la pantalla previa y, si se concede, programar el recordatorio. Eso es lo que hacen `usePermiso` y `activarRecordatorio`. Con el hook y la ruta resuelvo los dos casos con la misma pieza.

### E3. Mapa de fallas

| Situación | Qué ve la persona | Dónde se maneja (archivo y línea) |
| --- | --- | --- |
| `obtenerLibros()` falla | "Algo salió mal / No pudimos cargar el catálogo. Revisá tu conexión e intentá de nuevo." con el botón "Reintentar" (captura 03, [verificado en web]). | `src/hooks/useLibros.ts:30-33` (captura el error) y `src/app/(tabs)/(catalogo)/index.tsx:31-37` (lo muestra). Lo mismo en detalle, reserva y mostrador. |
| Se abre `/libro/abc` | "Ese código no es un ISBN", con el texto que llegó y el botón "Ir al Catálogo" (captura 07, probado con `/libro/123`, [verificado en web]). | `src/app/(tabs)/(catalogo)/libro/[isbn].tsx:24` y `:33-46`; `src/lib/isbn.ts:7-9`. |
| Se escanea un ISBN que no está en el catálogo | El aviso "El ISBN … no está en el catálogo. Probá con otro libro."; la cámara sigue activa (captura 19, con entrada manual, [verificado en web]). | `src/app/escanear.tsx:38-46`. |
| La cámara está bloqueada | "La cámara está bloqueada. Podés habilitarla en Ajustes o escribir el ISBN a mano.", con "Abrir Ajustes" y el campo manual ([razonado]). | `src/hooks/usePermiso.ts:27` y `src/app/escanear.tsx:87-97`. |
| Las notificaciones están denegadas | Al activar "Recordarme" se abre `/permisos/notificaciones` ("Continuar" o "Abrir Ajustes", captura 16). Los avisos de entrega aparecen como banner en Mis reservas (captura 24), y la pestaña aclara "Notificaciones no permitidas: los avisos van a aparecer acá". | `src/app/(tabs)/reservas.tsx:48-62` y `:93-95`; `src/context/BibliotecaContext.tsx:259-266`. |
| Se intenta reservar un libro ya reservado | "Ya reservaste este libro", con "Ver mis reservas" y "Cerrar" (captura 15, [verificado en web]). | `src/app/reservar/[isbn].tsx:64-78`; el Context también lo rechaza en `BibliotecaContext.tsx:158-163`. |
| "Entregar al siguiente" con la lista de espera vacía | El mostrador solo lista libros con alguien esperando (`conEspera`), así que el botón no aparece. Si igual se llegara a llamar (por ejemplo, dos toques muy rápidos), el Context devuelve `lista-vacia` y se muestra "Nadie está esperando "…"". Mientras se entrega, el botón queda ocupado. | `src/app/mostrador.tsx:22`, `:28-29` y `:68`; `src/context/BibliotecaContext.tsx:236-243`. |
| Login con clave incorrecta | "El usuario o la clave no son correctos. Revisalos e intentá de nuevo." (captura 20, [verificado en web]). | `src/app/login.tsx:18-22`; la validación está en `BibliotecaContext.tsx` (`iniciarSesion`). |

No quedó ninguna situación en la que la persona vea "nada" o la app se rompa.

### E4. Decisiones con argumentos

**a) Identificador: ISBN como parámetro de ruta y `key`.**

Elegí el ISBN.

- Es el dato que trae el código de barras: el escáner lee el EAN-13 y navega directo a `/libro/<isbn>`, sin buscar un id intermedio.
- Es estable y único por edición, así que sirve como `keyExtractor` en todas las listas.
- `useLocalSearchParams` siempre devuelve **strings** (lo que vimos en el ejercicio E1 del TP 2). Con un id numérico habría que convertir y validar (`Number(id)`, `NaN`, decimales). El ISBN ya es un texto de 13 dígitos y se valida con una expresión regular (`src/lib/isbn.ts:1`). No conviene convertirlo a número: 13 dígitos entran en un `number`, pero el ISBN es un código, no una cantidad.
- **Dos ediciones** del mismo título tienen ISBN distintos y en mi app son dos libros distintos. Para una biblioteca es correcto: cada edición tiene sus propios ejemplares.

En contra: **los libros sin ISBN** (anteriores a 1970, donaciones, apuntes) no tendrían identificador. Para eso agregaría un id propio de la biblioteca y usaría el ISBN como dato opcional para el escáner. En este catálogo, donde todos tienen ISBN, el ISBN simplifica todo.

**b) Estructuras: clase `Pila` con `#items` o array con `[...pila, x]`.**

Usé las clases, como pide el TP.

- **Me dio:** encapsulamiento (nadie puede hacer `shift()` sobre la cola ni sacar del medio de la pila), una interfaz con nombre (`encolar`, `desencolar`, `verFrente`, `apilar`, `verTope`), reutilizar lo del TP 2 y tests unitarios aislados (10 casos en `src/estructuras/__tests__`).
- **Me complicó:**
  1. React compara por referencia, y las clases se modifican "por dentro". Tuve que copiar antes de cada cambio (`copiarCola`, `copiarPila`) para no caer en el error de B3.
  2. No se pueden guardar en AsyncStorage tal cual: `JSON.stringify` de una instancia con campos privados da `{}`. Por eso las serializo con `aArray()` y las reconstruyo al leer (`BibliotecaContext.tsx`, `serializarEsperas` / `crearEsperasIniciales`).
  3. Los campos `#items` no se ven en las herramientas de depuración.

Con un array en el estado (`[...pila, x]`, `slice`) todo eso es gratis, pero se pierde la garantía de que solo se use como pila o como cola. Para una app de este tamaño las dos opciones son razonables. La clase obliga a ser disciplinado con las copias.

**c) Memorización.**

El proyecto tiene React Compiler activado (`app.json` → `"reactCompiler": true`), que memoriza automáticamente componentes y valores. Igual usé memorización manual en el Context:

- **Donde aporta:**
  - El `value` del Context con `useMemo` (`BibliotecaContext.tsx:287`). Sin él, cualquier render del provider crearía un objeto nuevo y todos los consumidores se volverían a renderizar aunque no hubiera cambiado ningún dato.
  - Las funciones con `useCallback`. Por ejemplo, `registrarVisto` (`:147`) está en las dependencias del efecto del detalle (`libro/[isbn].tsx:27-31`). Si cambiara de identidad en cada render, ese efecto volvería a correr en cada cambio del Context.
- **Donde sería ruido:** memorizar algo barato, como el texto de la línea de permiso en `reservas.tsx` (`textoPermiso`, un `if` entre dos strings) o la función `abrirLibro` del Catálogo (ya está fuera del componente). Ahí `useMemo` agrega código y comparaciones sin ahorrar nada medible.
- **Cómo comprobarlo:** con el Profiler de React DevTools (grabar, activar el interruptor "Recordarme" y ver qué componentes se renderizaron y cuánto tardaron) o con "Highlight updates when components render". Así se mide antes y después de agregar o quitar un `useMemo` en lugar de suponerlo.

**d) Datos duplicados.**

Los ejemplares disponibles **se calculan**; no se guardan (`calcularDisponibles`, `src/lib/biblioteca.ts:9-20`):

```ts
const prestadosDelEstante = prestamos.filter(
  (p) => p.isbn === libro.isbn && p.origen === 'estante',
).length;
const devueltos = devueltosAlEstante[libro.isbn] ?? 0;
return Math.max(0, libro.ejemplares + devueltos - prestadosDelEstante);
```

Cuando el mismo dato vive en dos lugares, tarde o temprano se desincroniza. Si guardara `disponibles` en el estado, tendría que restar al reservar, sumar al devolver, sumar al recibir una entrega del mostrador y tener en cuenta lo persistido. Basta con olvidar uno de esos caminos para que el detalle diga "2 disponibles" mientras "Mis reservas" muestra que ya tengo los dos. Con el cálculo hay una sola fuente de verdad (los préstamos) y el número siempre es consistente.

El contador `devueltosAlEstante` no es una copia de "disponibles": registra un hecho distinto (un libro que me entregaron por la lista de espera y después devolví vuelve al estante), que no se puede deducir de los préstamos activos.

[verificado en web] Después de recibir "El Aleph" por la lista de espera, su detalle muestra "Ejemplares disponibles: 0" y "Ya tenés este libro prestado" (captura 26).
