import { StyleSheet, Switch, Text, View } from 'react-native';

import { AREA_TACTIL_MINIMA, ESPACIADO, RADIO, TAMANIO_TEXTO, type Colores } from '../constants/tema';
import { useColores, useEstilos } from '../hooks/useTema';
import { formatearFecha } from '../lib/fechas';
import type { Prestamo } from '../types/biblioteca';
import { Boton } from './Boton';

type Props = {
  prestamo: Prestamo;
  onCambiarRecordatorio: (prestamo: Prestamo, activar: boolean) => void;
  onDevolver: (prestamo: Prestamo) => void;
};

export function FilaPrestamo({ prestamo, onCambiarRecordatorio, onDevolver }: Props) {
  const estilos = useEstilos(crearEstilos);
  const colores = useColores();
  const recordatorioActivo = prestamo.notificacionId !== null;

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{prestamo.titulo}</Text>
      <Text style={estilos.detalle}>Devolución: {formatearFecha(prestamo.venceEl)}</Text>
      <View style={estilos.fila}>
        <Text style={estilos.etiqueta}>Recordarme</Text>
        <Switch
          accessibilityLabel={`Recordarme devolver ${prestamo.titulo}`}
          value={recordatorioActivo}
          onValueChange={(activar) => onCambiarRecordatorio(prestamo, activar)}
          trackColor={{ true: colores.primario, false: colores.borde }}
        />
      </View>
      <Boton texto="Devolver" variante="peligro" onPress={() => onDevolver(prestamo)} />
    </View>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    tarjeta: {
      padding: ESPACIADO.lg,
      gap: ESPACIADO.sm,
      borderRadius: RADIO.md,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
    },
    titulo: { fontSize: TAMANIO_TEXTO.normal, fontWeight: '700', color: c.texto },
    detalle: { fontSize: TAMANIO_TEXTO.chico, color: c.textoSuave },
    fila: {
      minHeight: AREA_TACTIL_MINIMA,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    etiqueta: { fontSize: TAMANIO_TEXTO.normal, color: c.texto },
  });
}
