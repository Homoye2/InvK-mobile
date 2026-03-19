import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { notificationsAPI } from '../../lib/api';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const typeConfig: Record<string, { icon: IoniconsName; color: string; bg: string }> = {
  SUBSCRIPTION_EXPIRY: { icon: 'card-outline', color: '#d97706', bg: '#fef3c7' },
  TRIAL_EXPIRY: { icon: 'time-outline', color: '#ea580c', bg: '#ffedd5' },
  ADMIN_MESSAGE: { icon: 'megaphone-outline', color: '#2563eb', bg: '#eff6ff' },
  SYSTEM: { icon: 'notifications-outline', color: '#6b7280', bg: '#f3f4f6' },
};

export default function NotificationsScreen() {
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => { const { data } = await notificationsAPI.getMine(); return data; },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsAPI.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = (notifications as any[]).filter((n: any) => !n.isRead).length;

  return (
    <View style={styles.container}>
      {unread > 0 && (
        <View style={styles.topBar}>
          <Text style={styles.unreadText}>{unread} non lue{unread > 1 ? 's' : ''}</Text>
          <TouchableOpacity onPress={() => markAllMutation.mutate()} disabled={markAllMutation.isPending} style={styles.markAllBtn}>
            <Ionicons name="checkmark-done-outline" size={16} color="#2563eb" style={{ marginRight: 4 }} />
            <Text style={styles.markAll}>Tout marquer lu</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
      ) : (
        <FlatList
          data={notifications as any[]}
          keyExtractor={(i: any) => i.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item: n }: any) => {
            const cfg = typeConfig[n.type] || typeConfig.SYSTEM;
            return (
              <TouchableOpacity
                style={[styles.card, !n.isRead && styles.cardUnread]}
                onPress={() => !n.isRead && markReadMutation.mutate(n.id)}
              >
                <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon} size={22} color={cfg.color} />
                </View>
                <View style={styles.content}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>{n.title}</Text>
                    {!n.isRead && <View style={styles.dot} />}
                  </View>
                  <Text style={styles.message} numberOfLines={2}>{n.message}</Text>
                  <Text style={styles.time}>{new Date(n.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Aucune notification</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  unreadText: { fontSize: 13, color: '#6b7280' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center' },
  markAll: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: '#2563eb' },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563eb', marginLeft: 8 },
  message: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  time: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
});
