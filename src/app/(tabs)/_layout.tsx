import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';

import { useColores } from '../../hooks/useTema';

export default function LayoutPestanas() {
  const colores = useColores();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSuave,
      }}>
      <Tabs.Screen
        name="(catalogo)"
        options={{
          title: 'Catálogo',
          headerShown: false,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="library" size={size} color={focused ? colores.primario : colores.textoSuave} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Mis reservas',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="bookmark" size={size} color={focused ? colores.primario : colores.textoSuave} />
          ),
        }}
      />
    </Tabs>
  );
}
