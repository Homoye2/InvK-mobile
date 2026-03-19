import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { salesAPI } from '../../lib/api';

const paymentLabels: Record<string, string> = { CASH: 'Espèces', WAVE: 'Wave', ORANGE_MONEY: 'Orange Money', MOBILE_MONEY: 'Mobile Money', CARD: 'Carte' };
const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  COMPLETED: { label: 'Complétée', bg: '#dcfce7', color: '#16a34a' },
  CANCELLED: { label: 'Annulée', bg: '#fee2e2', color: '#dc2626' },
};

export default function SalesScreen() {
  const [detail, setDetail] = useState<any>(null);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => { const { data } = await salesAPI.getAll(100); return data; },
  });

  const completed = (sales as any[]).filter((s: any) => s.status === 'COMPLETED');
  const totalRevenue = completed.reduce((s: number, sale: any) => s + sale.totalAmount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Ionicons name="receipt-outline" size={18} color="#6b7280" style={{ marginBottom: 4 }} />
          <Text style={styles.summaryLabel}>Total ventes</Text>
          <Text style={styles.summaryValue}>{(sales as any[]).length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="cash-outline" size={18} color="#16a34a" style={{ marginBottom: 4 }} />
          <Text style={styles.summaryLabel}>Revenus</Text>
          <Text style={[styles.summaryValue, { color: '#16a34a' }]}>{totalRevenue.toLocaleString('fr-FR')} F</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
      ) : (
        <FlatList
          data={sales as any[]}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item: s }) => {
            const st = statusConfig[s.status] || statusConfig.COMPLETED;
            return (
              <TouchableOpacity style={styles.card} onPress={() => setDetail(s)}>
                <View style={styles.cardRow}>
                  <Text style={styles.amount}>{s.totalAmount.toLocaleString('fr-FR')} FCFA</Text>
                  <View style={[styles.badge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.meta}>{new Date(s.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
                  <Text style={styles.meta}>{paymentLabels[s.paymentMethod] || s.paymentMethod} · {s.items?.length || 0} art.</Text>
                </View>
                {s.user && (
                  <View style={styles.sellerRow}>
                    <Ionicons name="person-outline" size={12} color="#9ca3af" style={{ marginRight: 4 }} />
                    <Text style={styles.seller}>{s.user.name}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>Aucune vente</Text>}
        />
      )}

      <Modal visible={!!detail} animationType="slide" presentationStyle="pageSheet">
        {detail && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détail de la vente</Text>
              <TouchableOpacity onPress={() => setDetail(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Date</Text><Text style={styles.detailValue}>{new Date(detail.createdAt).toLocaleString('fr-FR')}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Paiement</Text><Text style={styles.detailValue}>{paymentLabels[detail.paymentMethod]}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Statut</Text><Text style={[styles.detailValue, { color: statusConfig[detail.status]?.color }]}>{statusConfig[detail.status]?.label}</Text></View>
              {detail.user && <View style={styles.detailRow}><Text style={styles.detailLabel}>Vendeur</Text><Text style={styles.detailValue}>{detail.user.name}</Text></View>}
              <Text style={[styles.detailLabel, { marginTop: 16, marginBottom: 8 }]}>Articles</Text>
              {detail.items?.map((item: any) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.product?.name}</Text>
                  <Text style={styles.itemQty}>{item.quantity} × {item.unitPrice.toLocaleString('fr-FR')} F</Text>
                  <Text style={styles.itemTotal}>{item.subtotal.toLocaleString('fr-FR')} F</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{detail.totalAmount.toLocaleString('fr-FR')} FCFA</Text>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  summary: { flexDirection: 'row', padding: 16, gap: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  summaryCard: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#6b7280', marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  amount: { fontSize: 16, fontWeight: '700', color: '#111827' },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  meta: { fontSize: 12, color: '#6b7280' },
  sellerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  seller: { fontSize: 12, color: '#9ca3af' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 15 },
  modal: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 4 },
  modalBody: { padding: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  detailLabel: { fontSize: 13, color: '#6b7280' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemName: { flex: 1, fontSize: 13, color: '#111827', fontWeight: '600' },
  itemQty: { fontSize: 12, color: '#6b7280', marginHorizontal: 8 },
  itemTotal: { fontSize: 13, fontWeight: '700', color: '#111827' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#2563eb' },
});
