import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import MerchantNavigator from './MerchantNavigator';
import EmployeeNavigator from './EmployeeNavigator';
import SplashScreen from '../screens/SplashScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { hydrated, isAuthenticated, user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  if (!hydrated) {
    return <SplashScreen />;
  }

  const isMerchant = user?.role === 'ADMIN_COMMERCANT';
  const isEmployee = user?.role === 'EMPLOYE';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : isMerchant ? (
          <Stack.Screen name="Merchant" component={MerchantNavigator} />
        ) : isEmployee ? (
          <Stack.Screen name="Employee" component={EmployeeNavigator} />
        ) : (
          // ADMIN_GENERAL fallback — redirect to auth
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
