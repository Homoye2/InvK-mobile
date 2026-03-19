import { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  Modal, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { productsAPI, salesAPI } from '../../lib/api';

type Tab = 'caisse' | 'ventes';
type PaymentMethod = 'CASH' | 'WAVE' | 'ORANGE_MONEY' | 'MOBILE_MONEY' | 'CARD';

const paymentLabels: Record<PaymentMethod, string> = {
  CASH: 'Espèces', WAVE: 'Wave', ORANGE_MONEY: 'Orange Money',
  MOBILE_MONEY: 'Mobile Money', CARD: 'Carte',
};

interface CartItem { id: string; name: string; sellPrice: number; quantity: number; unit: string; stock: number; }

export default function POSScreen() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('caisse');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [cancelModal, setCancelModal] = useState<string | null>(null);

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => { const { data } = await productsAPI.getAll(); return data; },
  });

  const { data: mySales, isLoading: loadingSales, refetch: refetchSales } = useQuery({
    queryKey: ['my-sales'],
    queryFn: async () => { const { data } = await salesAPI.getMine(30); return data; },
  });

  const saleMutation = useMutation({
    mutationFn: (d: any) => salesAPI.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      setCart([]);
      setCheckoutModal(false);
      Alert.alert('✅ Vente enregistrée', 'La vente a été enregistrée avec succès.');
    },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.message || 'Erreur lors de la vente'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => salesAPI.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      setCancelModal(null);
      Alert.alert('✅ Vente annulée', 'Le stock a été remis à jour.');
    },
    onError: (e: any) => Alert.alert('Erreur', e.response?.data?.message || 'Impossible d\'annuler'),
  });

  const filteredProducts = useMemo(() =>
    (products as any[]).filter((p: any) =>
      p.isActive &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(search.toLowerCase()))
    ), [products, search]);

  const addToCart = (product: any) => {
    const existing = cart.find((c) => c.id === product.id);
    const currentQty = existing?.quantity || 0;
    if (currentQty >= (product.stock?.quantity || 0)) {
      Alert.alert('Stock insuffisant', `Stock disponible: ${product.stock?.quantity || 0}`);
      return;
    }
    if (existing) {
      setCart(cart.map((c) => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { id: product.id, name: product.name, sellPrice: product.sellPrice, quantity: 1, unit: product.unit, stock: product.stock?.quantity || 0 }]);
    }
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { setCart(cart.filter((c) => c.id !== id)); return; }
    const item = cart.find((c) => c.id === id);
    if (item && qty > item.stock) { Alert.alert('Stock insuffisant', `Max: ${item.stock}`); return; }
    setCart(cart.map((c) => c.id === id ? { ...c, quantity: qty } : c));
  };

  const total = cart.reduce((sum, c) => sum + c.sellPrice * c.quantity, 0);

  const handleSell = () => {
    if (cart.length === 0) return;
    saleMutation.mutate({
      items: cart.map((c) => ({ productId: c.id, quantity: c.quantity, unitPrice: c.sellPrice })),
      paymentMethod,
    });
  };

  const stats = mySales?.stats;
  const sales = mySales?.sales || [];

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {(['caisse', 'ventes'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'caisse' ? '🛒 Caisse' : '📊 Mes ventes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'caisse' ? (
        <View style={styles.flex}>
          {/* Search */}
          <View style={styles.searchBar}>
            <TextInput style={styles.searchInput} placeholder="🔍 Rechercher un produit..." value={search} onChangeText={setSearch} placeholderTextColor="#9ca3af" />
          </View>

          {/* Products grid */}
          <View style={styles.flex}>
            {loadingProducts ? <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" /> : (
              <FlatList
                data={filteredProducts}
                keyExtractor={(i: any) => i.id}
                numColumns={2}
                contentContainerStyle={styles.productGrid}
                columnWrapperStyle={{ gap: 10 }}
                renderItem={({ item: p }: any) => {
                  const inCart = cart.find((c) => c.id === p.id);
                  const outOfStock = (p.stock?.quantity || 0) === 0;
                  return (
                    <TouchableOpacity
                      style={[styles.productCard, outOfStock && styles.productCardDisabled, inCart && styles.productCardSelected]}
                      onPress={() => !outOfStock && addToCart(p)}
                      disabled={outOfStock}
                    >
                      <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
                      {p.sku ? <Text style={styles.productSku}>{p.sku}</Text> : null}
                      <Text style={styles.productPrice}>{p.sellPrice.toLocaleString('fr-FR')} F</Text>
                      <Text style={[styles.productStock, outOfStock && { color: '#dc2626' }]}>
                        Stock: {p.stock?.quantity ?? 0}
                      </Text>
                      {inCart && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{inCart.quantity}</Text></View>}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={<Text style={styles.empty}>Aucun produit</Text>}
              />
            )}
          </View>

          {/* Cart summary */}
          {cart.length > 0 && (
            <View style={styles.cartBar}>
              <View style={styles.cartInfo}>
                <Text style={styles.cartCount}>{cart.reduce((s, c) => s + c.quantity, 0)} article{cart.reduce((s, c) => s + c.quantity, 0) > 1 ? 's' : ''}</Text>
                <Text style={styles.cartTotal}>{total.toLocaleString('fr-FR')} FCFA</Text>
              </View>
              <TouchableOpacity style={styles.checkoutBtn} onPress={() => setCheckoutModal(true)}>
                <Text style={styles.checkoutBtnText}>Valider →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.salesContent}>
          {/* Stats */}
          {stats && (
            <View style={styles.statsGrid}>
              <StatCard label="Ce mois" value={`${(stats.monthRevenue || 0).toLocaleString('fr-FR')} F`} color="#dbeafe" textColor="#2563eb" />
              <StatCard label="Ventes mois" value={stats.monthSalesCount || 0} color="#dcfce7" textColor="#16a34a" />
              <StatCard label="Aujourd'hui" value={`${(stats.todayRevenue || 0).toLocaleString('fr-FR')} F`} color="#f3e8ff" textColor="#7c3aed" />
              <StatCard label="Ventes auj." value={stats.todaySalesCount || 0} color="#ffedd5" textColor="#ea580c" />
            </View>
          )}

          {/* Sales list */}
          <Text style={styles.sectionTitle}>Historique</Text>
          {loadingSales ? <ActivityIndicator color="#2563eb" /> : (
            (sales as any[]).map((s: any) => (
              <View key={s.id} style={styles.saleCard}>
                <View style={styles.saleTop}>
                  <View>
                    <Text style={styles.saleDate}>{new Date(s.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
                    <Text style={styles.saleItems}>{s.items?.length || 0} article{(s.items?.length || 0) > 1 ? 's' : ''} · {paymentLabels[s.paymentMethod as PaymentMethod] || s.paymentMethod}</Text>
                  </View>
                  <View style={styles.saleRight}>
                    <Text style={styles.saleAmount}>{s.totalAmount.toLocaleString('fr-FR')} F</Text>
                    <View style={[styles.statusBadge, s.status === 'CANCELLED' ? styles.statusRed : styles.statusGreen]}>
                      <Text style={styles.statusText}>{s.status === 'CANCELLED' ? 'Annulée' : 'Complétée'}</Text>
                    </View>
                  </View>
                </View>
                {s.status !== 'CANCELLED' && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setCancelModal(s.id)}>
                    <Text style={styles.cancelBtnText}>Annuler la vente</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Checkout Modal */}
      <Modal visible={checkoutModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Confirmer la vente</Text>
            <TouchableOpacity onPress={() => setCheckoutModal(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            {cart.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>{item.sellPrice.toLocaleString('fr-FR')} F × {item.quantity}</Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, item.quantity - 1)}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, item.quantity + 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.cartItemTotal}>{(item.sellPrice * item.quantity).toLocaleString('fr-FR')} F</Text>
              </View>
            ))}

            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{total.toLocaleString('fr-FR')} FCFA</Text>
            </View>

            <Text style={styles.paymentLabel}>Mode de paiement</Text>
            <View style={styles.paymentGrid}>
              {(Object.keys(paymentLabels) as PaymentMethod[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.paymentBtn, paymentMethod === m && styles.paymentBtnActive]}
                  onPress={() => setPaymentMethod(m)}
                >
                  <Text style={[styles.paymentBtnText, paymentMethod === m && styles.paymentBtnTextActive]}>{paymentLabels[m]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.sellBtn, saleMutation.isPending && { opacity: 0.6 }]} onPress={handleSell} disabled={saleMutation.isPending}>
              {saleMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sellBtnText}>Confirmer — {total.toLocaleString('fr-FR')} FCFA</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Cancel Confirm Modal */}
      <Modal visible={!!cancelModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Annuler la vente ?</Text>
            <Text style={styles.confirmBody}>Le stock sera automatiquement remis à jour.</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setCancelModal(null)}>
                <Text style={styles.confirmCancelText}>Non</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmOk, cancelMutation.isPending && { opacity: 0.6 }]}
                onPress={() => cancelModal && cancelMutation.mutate(cancelModal)}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmOkText}>Oui, annuler</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatCard({ label, value, color, textColor }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  flex: { flex: 1 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2563eb' },
  tabText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#2563eb' },
  searchBar: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  searchInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#f9fafb' },
  productGrid: { padding: 12, paddingBottom: 100 },
  productCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, marginBottom: 10 },
  productCardDisabled: { opacity: 0.4 },
  productCardSelected: { borderWidth: 2, borderColor: '#2563eb' },
  productName: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 4 },
  productSku: { fontSize: 11, color: '#9ca3af', marginBottom: 4 },
  productPrice: { fontSize: 15, fontWeight: '800', color: '#2563eb', marginBottom: 2 },
  productStock: { fontSize: 11, color: '#6b7280' },
  cartBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#2563eb', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cartBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 8 },
  cartInfo: { flex: 1 },
  cartCount: { fontSize: 13, color: '#6b7280' },
  cartTotal: { fontSize: 18, fontWeight: '800', color: '#111827' },
  checkoutBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  checkoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 15 },
  salesContent: { padding: 16, paddingBottom: 32 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: '47%', borderRadius: 14, padding: 14 },
  statLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600', marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  saleCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  saleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  saleDate: { fontSize: 13, fontWeight: '600', color: '#111827' },
  saleItems: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  saleRight: { alignItems: 'flex-end' },
  saleAmount: { fontSize: 16, fontWeight: '800', color: '#111827' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  statusGreen: { backgroundColor: '#dcfce7' },
  statusRed: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  cancelBtn: { borderWidth: 1, borderColor: '#fca5a5', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  cancelBtnText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 4 },
  modalBody: { padding: 20 },
  cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  cartItemPrice: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  qtyValue: { fontSize: 16, fontWeight: '700', color: '#111827', minWidth: 24, textAlign: 'center' },
  cartItemTotal: { fontSize: 14, fontWeight: '700', color: '#2563eb' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#374151' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  paymentLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  paymentBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  paymentBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  paymentBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  paymentBtnTextActive: { color: '#fff' },
  sellBtn: { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  sellBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%' },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  confirmBody: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  confirmBtns: { flexDirection: 'row', gap: 12 },
  confirmCancel: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  confirmCancelText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  confirmOk: { flex: 1, backgroundColor: '#dc2626', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  confirmOkText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
