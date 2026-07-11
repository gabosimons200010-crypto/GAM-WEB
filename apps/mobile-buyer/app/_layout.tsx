import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { FavoritesProvider } from '@/lib/favorites';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
        <FavoritesProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.paper },
            headerTintColor: colors.ink,
            headerTitleStyle: { fontWeight: '600' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.paper },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="producto/[slug]" options={{ title: '', headerBackTitle: 'Atrás' }} />
          <Stack.Screen name="tienda/[slug]" options={{ title: '', headerBackTitle: 'Atrás' }} />
          <Stack.Screen name="ingresar" options={{ title: 'Ingresar', presentation: 'modal' }} />
          <Stack.Screen name="registrarse" options={{ title: 'Crear cuenta', presentation: 'modal' }} />
          <Stack.Screen name="checkout" options={{ title: 'Pagar' }} />
          <Stack.Screen name="favoritos" options={{ title: 'Favoritos' }} />
          <Stack.Screen name="direcciones" options={{ title: 'Mis direcciones' }} />
          <Stack.Screen name="rastrear" options={{ title: 'Rastrear pedido' }} />
          <Stack.Screen name="recuperar" options={{ title: 'Recuperar contraseña', presentation: 'modal' }} />
          <Stack.Screen name="restablecer" options={{ title: 'Nueva contraseña', presentation: 'modal' }} />
          <Stack.Screen name="vendedor/index" options={{ title: 'Vendedor' }} />
          <Stack.Screen name="vendedor/productos" options={{ title: 'Mis productos' }} />
          <Stack.Screen name="vendedor/pedidos" options={{ title: 'Pedidos' }} />
        </Stack>
        </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
