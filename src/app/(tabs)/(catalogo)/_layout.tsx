import { Stack } from 'expo-router';

import { LinkPersonal } from '../../../components/LinkPersonal';

// Un deep link a /libro/[isbn] deja el Catálogo debajo del detalle.
export const unstable_settings = {
  anchor: 'index',
};

export default function LayoutCatalogo() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Catálogo', headerRight: () => <LinkPersonal /> }}
      />
      <Stack.Screen name="libro/[isbn]" options={{ title: 'Libro' }} />
    </Stack>
  );
}
