import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import POSScreen from '../screens/employee/POSScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import { notificationsAPI } from '../lib/api';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HeaderRight() {
  const navigation = useNavigation<any>();
  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => { const { data } = await notificationsAPI.getUnreadCount(); return data; },
    refetchInterval: 30000,
  });
  const unread = unreadData?.count || 0;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8, gap: 4 }}>
      <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={{ padding: 8 }}>
        <View>
          <Ionicons name="notifications-outline" size={24} color="#374151" />
          {unread > 0 && (
            <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: '#dc2626', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ padding: 8 }}>
        <Ionicons name="settings-outline" size={24} color="#374151" />
      </TouchableOpacity>
    </View>
  );
}

function EmployeeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { height: 70, paddingBottom: 10, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerRight: () => <HeaderRight />,
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '700', color: '#111827' },
      }}
    >
      <Tab.Screen
        name="POS"
        component={POSScreen}
        options={{ title: 'Caisse', tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

export default function EmployeeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={EmployeeTabs} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: true, title: 'Notifications', headerBackTitle: 'Retour' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: true, title: 'Paramètres', headerBackTitle: 'Retour' }}
      />
    </Stack.Navigator>
  );
}
