import { useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  Modal, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { productsAPI } from '../../lib/api';

const emptyForm = { name: '', sku: '', buyPrice: '0', sellPrice: '0', unit: 'pièce', initialStock: '0', alertThreshold: '10', isActive: true };

export default function ProductsScreen() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; product?: any }>({ open: false });
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => { const { data } = await productsAPI.getAll(); return data; },
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => productsAPI.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); closeModal(); },
    onError: (e: any) => setError(e.response?.data?.message || 'Erreur'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => productsAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); closeModal(); },
    onError: (e: any) => setError(e.response?.data?.message || 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const closeModal = () => setModal({ open: false });

  const openCreate = () => { setForm({ ...emptyForm }); setError(''); setModal({ open: true }); };
  const openEdit = (p: any) => {
    setForm({ name: p.name, sku: p.sku || '', buyPrice: String(p.buyPrice), sellPrice: String(p.sellPrice), unit: p.unit, initialStock: String(p.stock?.quantity || 0), alertThreshold: String(p.stock?.alertThreshold || 10), isActive: p.isActive });
    setError('');
    setModal({ open: true, product: p });
  };

  const handleSubmit = () => {
    if (!form.name || !form.sellPrice) { setError('Nom et prix requis'); return; }
    const payload = { ...form, buyPrice: +form.buyPrice, sellPrice: +form.sellPrice, initialStock: +form.initialStock, alertThreshold: +form.alertThreshold };
    if (modal.product) {
      const { initialStock, ...rest } = payload;
      updateMutation.mutate({ id: modal.product.id, data: rest });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filtered = (products as any[]).filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={styles.container}>
      {/* Search + Add */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9ca3af"
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item: p }) => {
            const low = p.stock && p.stock.quantity <= p.stock.alertThreshold;
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.name}</Text>
                    {p.sku ? <Text style={styles.sku}>{p.sku}</Text> : null}
                  </View>
                  <View style={[styles.badge, p.isActive ? styles.badgeGreen : styles.badgeGray]}>
                    <Text style={[styles.badgeText, { color: p.isActive ? '#16a34a' : '#6b7280' }]}>
                      {p.isActive ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardMid}>
                  <Text style={styles.price}>{p.sellPrice.toLocaleString('fr-FR')} FCFA</Text>
                  <View style={styles.stockRow}>
                    <Text style={[styles.stock, low && { color: '#dc2626' }]}>
                      Stock: {p.stock?.quantity ?? '—'}
                    </Text>
                    {low && <Ionicons name="warning-outline" size={14} color="#dc2626" style={{ marginLeft: 4 }} />}
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => openEdit(p)} style={styles.editBtn}>
                    <Ionicons name="pencil-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                    <Text style={styles.editBtnText}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => Alert.alert('Supprimer ?', p.name, [
                      { text: 'Annuler' },
                      { text: 'Supprimer', style: 'destructive', onPress: () => deleteMutation.mutate(p.id) },
                    ])}
                  >
                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="cube-outline" size={48} color="#d1d5db" />
              <Text style={styles.empty}>Aucun produit trouvé</Text>
            </View>
          }
        />
      )}

      <Modal visible={modal.open} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modal.product ? 'Modifier le produit' : 'Nouveau produit'}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={[1]}
            keyExtractor={() => 'form'}
            renderItem={() => (
              <View style={styles.modalBody}>
                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={16} color="#dc2626" style={{ marginRight: 6 }} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
                {[
                  { key: 'name', label: 'Nom *', placeholder: 'Coca-Cola 33cl', icon: 'pricetag-outline' as const },
                  { key: 'sku', label: 'SKU', placeholder: 'COCA-33', icon: 'barcode-outline' as const },
                  { key: 'unit', label: 'Unité', placeholder: 'bouteille', icon: 'scale-outline' as const },
                  { key: 'buyPrice', label: "Prix d'achat (FCFA)", keyboard: 'numeric' as const, icon: 'arrow-down-circle-outline' as const },
                  { key: 'sellPrice', label: 'Prix de vente (FCFA) *', keyboard: 'numeric' as const, icon: 'arrow-up-circle-outline' as const },
                  ...(!modal.product ? [{ key: 'initialStock', label: 'Stock initial', keyboard: 'numeric' as const, icon: 'layers-outline' as const }] : []),
                  { key: 'alertThreshold', label: "Seuil d'alerte", keyboard: 'numeric' as const, icon: 'warning-outline' as const },
                ].map(({ key, label, placeholder, keyboard, icon }) => (
                  <View key={key} style={styles.field}>
                    <Text style={styles.fieldLabel}>{label}</Text>
                    <View style={styles.inputRow}>
                      <Ionicons name={icon} size={16} color="#9ca3af" style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.inputWithIcon}
                        value={(form as any)[key]}
                        onChangeText={(v) => setForm({ ...form, [key]: v })}
                        placeholder={placeholder}
                        placeholderTextColor="#9ca3af"
                        keyboardType={keyboard || 'default'}
                      />
                    </View>
                  </View>
                ))}
                <View style={styles.switchRow}>
                  <Text style={styles.fieldLabel}>Produit actif</Text>
                  <Switch
                    value={form.isActive}
                    onValueChange={(v) => setForm({ ...form, isActive: v })}
                    trackColor={{ true: '#22c55e', false: '#d1d5db' }}
                    thumbColor="#fff"
                  />
                </View>
                <TouchableOpacity style={[styles.submitBtn, isPending && { opacity: 0.6 }]} onPress={handleSubmit} disabled={isPending}>
                  {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{modal.product ? 'Enregistrer' : 'Créer le produit'}</Text>}
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
  header: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#f9fafb' },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' },
  addBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  productName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sku: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeGray: { backgroundColor: '#f3f4f6' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardMid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  price: { fontSize: 16, fontWeight: '800', color: '#2563eb' },
  stockRow: { flexDirection: 'row', alignItems: 'center' },
  stock: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  deleteBtn: { padding: 6 },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 10 },
  empty: { color: '#9ca3af', fontSize: 15 },
  modal: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 4 },
  modalBody: { padding: 20 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 12 },
  inputWithIcon: { flex: 1, paddingVertical: 11, fontSize: 15, color: '#111827' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  submitBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, marginBottom: 12 },
  errorText: { color: '#dc2626', fontSize: 13, flex: 1 },
});
