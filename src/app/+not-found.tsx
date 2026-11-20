import { router, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Boton } from '../components/Boton';
import { MensajeEstado } from '../components/MensajeEstado';
import { type Colores } from '../constants/tema';
import { useEstilos } from '../hooks/useTema';

export default function NoEncontrada() {
  const estilos = useEstilos(crearEstilos);
  const ruta = usePathname();
  return (
    <View style={estilos.pantalla}>
      <MensajeEstado
        icono="compass-outline"
        titulo="Esta página no existe"
        mensaje={`No encontramos nada en "${ruta}".`}>
        <Boton texto="Ir al Catálogo" onPress={() => router.replace('/')} />
      </MensajeEstado>
    </View>
  );
}

function crearEstilos(c: Colores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo, justifyContent: 'center' },
  });
}
