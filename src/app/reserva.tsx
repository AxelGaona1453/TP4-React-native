import { Redirect } from 'expo-router';

// URL de la versión anterior de la app: se reemplaza por /reservas.
export default function ReservaVieja() {
  return <Redirect href="/reservas" />;
}
