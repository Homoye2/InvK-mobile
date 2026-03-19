import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function OfflineBanner() {
  const isConnected = useNetworkStatus();
  if (isConnected) return null;
  return (
    <View style={styles.banner}>
      <Ionicons name="wifi-outline" size={14} color="#fff" style={{ marginRight: 6 }} />
      <Text style={styles.text}>Hors ligne — données en cache</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: '#f59e0b', paddingVertical: 6, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  text: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
