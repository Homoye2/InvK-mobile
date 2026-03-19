import { useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  Modal, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { inventoryAPI, productsAPI } from '../../lib/api';

const movementLabels: Record<string, string> = { IN: 'Entrée', OUT: 'Sortie', ADJUSTMENT: 'Ajustement', SALE: 'Vente', CANCEL: 'Annulation' };
const movementColors: Record<string, string> = { IN: '#16a34a', OUT: '#dc2626', ADJUSTMENT: '#2563eb', SALE: '#ea580c', CANCEL: '#7c3aed' };

type Tab = 'stocks' | 'movements';

export default function InventoryScreen() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('stocks');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'IN', quantity: '1', reason: '' });
  const [error, setError] = useState('');

  const { data: stocks = [], isLoading: loadingStocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: async () => { const { data } = await inventoryAPI.getStocks(); return data; },
  });

  const { data: movements = [], isLoading: loadingMovements } = useQuery({
    queryKey: ['movements'],
    queryFn: async () => { const { data } = await inventoryAPI.getMovements(); return data; },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => { const { data } = await productsAPI.getAll(); return data; },
  });

  const adjustMutation = useMutation({
    mutationFn: (d: any) => inventoryAPI.adjustStock(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stocks'] });
      qc.invalidateQueries({ queryKey: ['movements'] });
      setModal(false);
      setForm({ productId: '', type: 'IN', quantity: '1', reason: '' });
    },
    onError: (e: any) => setError(e.response?.data?.message || 'Erreur'),
  });

  const handleAdjust = () => {
    if (!form.productId) { setError('Sélectionnez un produit'); return; }
    if (!form.quantity || +form.quantity <= 0) { setError('Quantité invalide'); return; }
    adjustMutation.mutate({ productId: form.productId, type: form.type, quantity: +form.quantity, reason: form.reason });
  };

  const filteredStocks = (stocks as any[]).filter((s: any) =>
    s.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (s.product?.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredMovements = (movements as any[]).filter((m: any) =>
    m.product?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {(['stocks', 'movements'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'stocks' ? '📦 Stocks' : '📋 Mouvements'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search + Adjust */}
      <View style={styles.header}>
        <TextInput style={styles.search} placeholder="🔍 Rechercher..." value={search} onChangeText={setSearch} placeholderTextColor="#9ca3af" />
        {tab === 'stocks' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => { setError(''); setModal(true); }}>
            <Ionicons name="swap-vertical-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.addBtnText}>Ajuster</Text>
          </TouchableOpacity>
        )}
      </View>

      {tab === 'stocks' ? (
        loadingStocks ? <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" /> : (
          <FlatList
            data={filteredStocks}
            keyExtractor={(i: any) => i.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            renderItem={({ item: s }: any) => {
              const low = s.quantity <= s.alertThreshold;
              return (
                <View style={[styles.card, low && styles.cardAlert]}>
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{s.product?.name}</Text>
                      {s.product?.sku ? <Text style={styles.sku}>{s.product.sku}</Text> : null}
                    </View>
                    <View style={[styles.qtyBadge, { backgroundColor: low ? '#fee2e2' : '#dcfce7' }]}>
                      <Text style={[styles.qtyText, { color: low ? '#dc2626' : '#16a34a' }]}>{s.quantity}</Text>
                    </View>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.footerText}>Seuil: {s.alertThreshold}</Text>
                    {low && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="warning-outline" size={13} color="#ea580c" style={{ marginRight: 3 }} />
                        <Text style={styles.alertText}>Stock bas</Text>
                      </View>
                    )}
                    <Text style={styles.footerText}>{s.product?.unit}</Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.empty}>Aucun stock trouvé</Text>}
          />
        )
      ) : (
        loadingMovements ? <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" /> : (
          <FlatList
            data={filteredMovements}
            keyExtractor={(i: any) => i.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            renderItem={({ item: m }: any) => (
              <View style={styles.movCard}>
                <View style={[styles.movBadge, { backgroundColor: movementColors[m.type] + '20' }]}>
                  <Text style={[styles.movType, { color: movementColors[m.type] }]}>{movementLabels[m.type] || m.type}</Text>
                </View>
                <View style={styles.movInfo}>
                  <Text style={styles.movProduct}>{m.product?.name}</Text>
                  {m.reason ? <Text style={styles.movReason}>{m.reason}</Text> : null}
                  <Text style={styles.movTime}>{new Date(m.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={[styles.movQty, { color: movementColors[m.type] }]}>
                  {m.type === 'OUT' || m.type === 'SALE' ? '-' : '+'}{m.quantity}
                </Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Aucun mouvement</Text>}
          />
        )
      )}

      {/* Adjust Modal */}
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ajuster le stock</Text>
            <TouchableOpacity onPress={() => setModal(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={[1]}
            keyExtractor={() => 'form'}
            renderItem={() => (
              <View style={styles.modalBody}>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Produit *</Text>
                  <View style={styles.pickerBox}>
                    {(products as any[]).map((p: any) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.pickerItem, form.productId === p.id && styles.pickerItemActive]}
                        onPress={() => setForm({ ...form, productId: p.id })}
                      >
                        <Text style={[styles.pickerText, form.productId === p.id && styles.pickerTextActive]}>{p.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Type</Text>
                  <View style={styles.typeRow}>
                    {['IN', 'OUT', 'ADJUSTMENT'].map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typeBtn, form.type === t && { backgroundColor: movementColors[t] }]}
                        onPress={() => setForm({ ...form, type: t })}
                      >
                        <Text style={[styles.typeBtnText, form.type === t && { color: '#fff' }]}>{movementLabels[t]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Quantité *</Text>
                  <TextInput style={styles.fieldInput} value={form.quantity} onChangeText={(v) => setForm({ ...form, quantity: v })} keyboardType="numeric" />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Raison (optionnel)</Text>
                  <TextInput style={styles.fieldInput} value={form.reason} onChangeText={(v) => setForm({ ...form, reason: v })} placeholder="Ex: Livraison fournisseur" placeholderTextColor="#9ca3af" />
                </View>

                <TouchableOpacity style={[styles.submitBtn, adjustMutation.isPending && { opacity: 0.6 }]} onPress={handleAdjust} disabled={adjustMutation.isPending}>
                  {adjustMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Confirmer</Text>}
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2563eb' },
  tabText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#2563eb' },
  header: { flexDirection: 'row', padding: 16, gap: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  search: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#f9fafb' },
  addBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center', flexDirection: 'row', alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardAlert: { borderLeftWidth: 3, borderLeftColor: '#ea580c' },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sku: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  qtyBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  qtyText: { fontSize: 18, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 12, color: '#9ca3af' },
  alertText: { fontSize: 12, color: '#ea580c', fontWeight: '600' },
  movCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  movBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 12 },
  movType: { fontSize: 12, fontWeight: '700' },
  movInfo: { flex: 1 },
  movProduct: { fontSize: 14, fontWeight: '600', color: '#111827' },
  movReason: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  movTime: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  movQty: { fontSize: 18, fontWeight: '800' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 15 },
  modal: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 4 },
  modalBody: { padding: 20 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, backgroundColor: '#fff' },
  pickerBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerItem: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  pickerItemActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  pickerText: { fontSize: 13, color: '#374151' },
  pickerTextActive: { color: '#fff', fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  submitBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  errorText: { color: '#dc2626', backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 },
});
