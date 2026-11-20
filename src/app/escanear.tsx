import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from '../components/Boton';
import { CargandoPantalla } from '../components/CargandoPantalla';
import { EntradaIsbnManual } from '../components/EntradaIsbnManual';
import { MensajeEstado } from '../components/MensajeEstado';
import { ESPACIADO, RADIO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useLibros } from '../hooks/useLibros';
import { usePermiso } from '../hooks/usePermiso';
import { useEstilos } from '../hooks/useTema';
import { esIsbnValido, limpiarIsbn } from '../lib/isbn';

const ALTO_CAMARA = 320;

export default function Escanear() {
  const estilos = useEstilos(crearEstilos);
  const { estado, abrirAjustes, actualizar } = usePermiso('camara');
  const { libros } = useLibros();
  const [aviso, setAviso] = useState<string | null>(null);
  // useRef y no useState: el cambio se ve en la misma ejecución, sin esperar un render.
  const yaNavego = useRef(false);
  const ultimoNoEncontrado = useRef<string | null>(null);

  // Al volver de /permisos/camara (o de otra pantalla) se reconsulta el permiso.
  useFocusEffect(
    useCallback(() => {
      actualizar();
    }, [actualizar]),
  );

  function abrirIsbn(isbn: string, desdeCamara: boolean) {
    if (yaNavego.current) {
      return;
    }
    // Si el catálogo todavía no cargó (o falló), el detalle valida el ISBN.
    const noEsta = libros.length > 0 && !libros.some((l) => l.isbn === isbn);
    if (noEsta) {
      if (!desdeCamara || ultimoNoEncontrado.current !== isbn) {
        ultimoNoEncontrado.current = isbn;
        setAviso(`El ISBN ${isbn} no está en el catálogo. Probá con otro libro.`);
      }
      return;
    }
    yaNavego.current = true;
    router.replace({ pathname: '/libro/[isbn]', params: { isbn } });
  }

  function alEscanear({ data }: BarcodeScanningResult) {
    const isbn = limpiarIsbn(data);
    if (esIsbnValido(isbn)) {
      abrirIsbn(isbn, true);
    }
  }

  let zonaCamara;
  if (estado === 'cargando') {
    zonaCamara = <CargandoPantalla mensaje="Revisando el permiso de la cámara…" />;
  } else if (estado === 'concedido') {
    zonaCamara = (
      <View style={estilos.marcoCamara}>
        <CameraView
          style={estilos.camara}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
          onBarcodeScanned={alEscanear}
        />
        <Text style={estilos.ayuda}>Apuntá al código de barras de la contratapa.</Text>
      </View>
    );
  } else if (estado === 'preguntable') {
    zonaCamara = (
      <MensajeEstado
        icono="camera-outline"
        titulo="Escaneá con la cámara"
        mensaje="Para leer el código de barras necesitamos usar la cámara.">
        <Boton
          texto="Usar la cámara"
          onPress={() =>
            router.push({ pathname: '/permisos/[recurso]', params: { recurso: 'camara' } })
          }
        />
      </MensajeEstado>
    );
  } else {
    zonaCamara = (
      <MensajeEstado
        icono="lock-closed-outline"
        tono="error"
        titulo="La cámara está bloqueada"
        mensaje="Podés habilitarla en Ajustes o escribir el ISBN a mano.">
        <Boton texto="Abrir Ajustes" onPress={abrirAjustes} />
      </MensajeEstado>
    );
  }

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled">
      {zonaCamara}
      {aviso ? (
        <Text style={estilos.aviso} accessibilityRole="alert">
          {aviso}
        </Text>
      ) : null}
      <EntradaIsbnManual onIsbn={(isbn) => abrirIsbn(isbn, false)} />
    </ScrollView>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo },
    contenido: { padding: ESPACIADO.lg, gap: ESPACIADO.lg },
    marcoCamara: { gap: ESPACIADO.sm },
    camara: { height: ALTO_CAMARA, borderRadius: RADIO.md, overflow: 'hidden' },
    ayuda: { fontSize: TAMANIO_TEXTO.chico, color: c.textoSuave, textAlign: 'center' },
    aviso: {
      padding: ESPACIADO.md,
      borderRadius: RADIO.md,
      backgroundColor: c.fondoAviso,
      color: c.aviso,
      fontSize: TAMANIO_TEXTO.normal,
      fontWeight: '600',
    },
  });
}
