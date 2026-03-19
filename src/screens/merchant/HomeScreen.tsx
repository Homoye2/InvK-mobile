import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { dashboardAPI, inventoryAPI, subscriptionsAPI } from '../../lib/api';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';

const paymentLabels: Record<string, string> = {
  CASH: 'Espèces', WAVE: 'Wave', ORANGE_MONEY: 'Orange Money',
  MOBILE_MONEY: 'Mobile Money', CARD: 'Carte',
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { justRegistered, clearJustRegistered, user } = useAuthStore();

  // Welcome modal: shown once right after registration
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  // Trial banner: shown until user explicitly closes it (not on first visit — welcome modal handles that)
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(false);
  // After trial banner is closed → show "subscribe now" push modal
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  // Trigger welcome modal once when coming from registration
  useEffect(() => {
    if (justRegistered) {
      setShowWelcomeModal(true);
      setTrialBannerDismissed(true); // hide banner since welcome modal covers it
      clearJustRegistered();
    }
  }, [justRegistered]);

  const { data: stats, refetch: refetchStats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => { const { data } = await dashboardAPI.getStats(); return data; },
  });

  const { data: activity, refetch: refetchActivity } = useQuery({
    queryKey: ['activity'],
    queryFn: async () => { const { data } = await dashboardAPI.getActivity(); return data; },
  });

  const { data: lowStocks = [] } = useQuery({
    queryKey: ['low-stocks'],
    queryFn: async () => { const { data } = await inventoryAPI.getLowStocks(); return data; },
  });

  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: async () => { const { data } = await subscriptionsAPI.getUsage(); return data; },
  });

  const onRefresh = () => { refetchStats(); refetchActivity(); };

  const isTrial = usage?.status === 'TRIAL';
  const isExpired = usage?.status === 'EXPIRED';

  const handleDismissTrial = () => {
    setTrialBannerDismissed(true);
    setShowSubscribeModal(true);
  };

  const handleGoSubscribe = () => {
    setShowSubscribeModal(false);
    navigation.getParent()?.navigate('Settings');
  };

  return (
    <>
      {/* Expired blocking modal */}
      <Modal visible={isExpired} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="warning-outline" size={48} color="#dc2626" />
            </View>
            <Text style={styles.modalTitle}>Abonnement expiré</Text>
            <Text style={styles.modalBody}>
              Votre abonnement a expiré. Renouvelez-le pour continuer à utiliser l'application.
            </Text>
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnRed]} onPress={handleGoSubscribe}>
              <Text style={styles.modalBtnText}>Renouveler mon abonnement</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Welcome modal: shown once right after registration */}
      <Modal visible={showWelcomeModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconBox, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#16a34a" />
            </View>
            <Text style={styles.modalTitle}>Bienvenue sur invK !</Text>
            <Text style={styles.modalBody}>
              Votre essai gratuit de 30 jours est actif.{'\n'}
              {user?.trialEndsAt
                ? `Il expire le ${new Date(user.trialEndsAt).toLocaleDateString('fr-FR')}.`
                : ''}
              {'\n\n'}Profitez de toutes les fonctionnalités sans restriction.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setShowWelcomeModal(false)}
            >
              <Text style={styles.modalBtnText}>Commencer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Post-trial dismiss: push to subscribe */}
      <Modal visible={showSubscribeModal && !isExpired} transparent animationType="fade">        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconBox, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="rocket-outline" size={48} color="#2563eb" />
            </View>
            <Text style={styles.modalTitle}>Passez à un abonnement</Text>
            <Text style={styles.modalBody}>
              Continuez à profiter de toutes les fonctionnalités invK sans interruption en choisissant un plan adapté à votre boutique.
            </Text>
            <TouchableOpacity style={styles.modalBtn} onPress={handleGoSubscribe}>
              <Text style={styles.modalBtnText}>Voir les plans</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSubscribeModal(false)} style={styles.modalSkip}>
              <Text style={styles.modalSkipText}>Plus tard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      >
        {/* Trial banner — shown until user closes it */}
        {isTrial && !trialBannerDismissed && (
          <View style={styles.trialBanner}>
            <View style={styles.trialLeft}>
              <Ionicons name="time-outline" size={18} color="#92400e" style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.trialTitle}>Essai gratuit en cours</Text>
                {usage?.endDate && (
                  <Text style={styles.trialSub}>
                    Expire le {new Date(usage.endDate).toLocaleDateString('fr-FR')}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={handleDismissTrial} style={styles.trialClose}>
              <Ionicons name="close" size={20} color="#92400e" />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.greeting}>Tableau de bord</Text>

        {/* KPI Grid */}
        <View style={styles.grid}>
          <KpiCard label="Aujourd'hui" value={`${((stats as any)?.todayRevenue || 0).toLocaleString('fr-FR')} F`} sub={`${(stats as any)?.todaySalesCount || 0} ventes`} color="#dcfce7" textColor="#16a34a" icon="today-outline" iconColor="#16a34a" />
          <KpiCard label="Ce mois" value={`${((stats as any)?.monthRevenue || 0).toLocaleString('fr-FR')} F`} sub={`${(stats as any)?.monthSalesCount || 0} ventes`} color="#dbeafe" textColor="#2563eb" icon="calendar-outline" iconColor="#2563eb" />
          <KpiCard label="Produits" value={stats?.totalProducts || 0} sub="actifs" color="#f3e8ff" textColor="#7c3aed" icon="cube-outline" iconColor="#7c3aed" />
          <KpiCard label="Alertes stock" value={stats?.lowStocks || 0} sub="à réapprovisionner" color="#ffedd5" textColor="#ea580c" icon="warning-outline" iconColor="#ea580c" />
        </View>

        {/* Team performance */}
        {activity?.byEmployee?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy-outline" size={16} color="#111827" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Performance équipe — ce mois</Text>
            </View>
            {activity.byEmployee.map((emp: any, i: number) => (
              <View key={emp.userId} style={styles.empRow}>
                <View style={[styles.rank, i === 0 && styles.rankGold]}>
                  {i === 0
                    ? <Ionicons name="star" size={14} color="#ca8a04" />
                    : <Text style={styles.rankText}>{i + 1}</Text>
                  }
                </View>
                <View style={styles.empInfo}>
                  <Text style={styles.empName}>{emp.name}</Text>
                  <Text style={styles.empRole}>{emp.role === 'EMPLOYE' ? 'Employé' : 'Gérant'}</Text>
                </View>
                <View style={styles.empStats}>
                  <Text style={styles.empAmount}>{emp.totalAmount.toLocaleString('fr-FR')} F</Text>
                  <Text style={styles.empCount}>{emp.salesCount} vente{emp.salesCount > 1 ? 's' : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent activity */}
        {activity?.recentActivity?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={16} color="#111827" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Activité récente</Text>
            </View>
            {activity.recentActivity.slice(0, 5).map((a: any) => (
              <View key={a.id} style={styles.actRow}>
                <View style={styles.actAvatar}>
                  <Text style={styles.actAvatarText}>{a.employeeName.charAt(0)}</Text>
                </View>
                <View style={styles.actInfo}>
                  <Text style={styles.actName}>{a.employeeName}</Text>
                  <Text style={styles.actTime}>
                    {new Date(a.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{a.itemsCount} article{a.itemsCount > 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.actRight}>
                  <Text style={styles.actAmount}>{a.totalAmount.toLocaleString('fr-FR')} F</Text>
                  <Text style={styles.actPayment}>{paymentLabels[a.paymentMethod] || a.paymentMethod}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Low stocks */}
        {(lowStocks as any[]).length > 0 && (
          <View style={[styles.section, styles.alertSection]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle-outline" size={16} color="#ea580c" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: '#ea580c' }]}>Alertes stock ({(lowStocks as any[]).length})</Text>
            </View>
            {(lowStocks as any[]).slice(0, 4).map((s: any) => (
              <View key={s.id} style={styles.stockRow}>
                <Text style={styles.stockName}>{s.product?.name}</Text>
                <Text style={[styles.stockQty, s.quantity === 0 && { color: '#dc2626' }]}>{s.quantity}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

function KpiCard({ label, value, sub, color, textColor, icon, iconColor }: any) {
  return (
    <View style={[styles.kpi, { backgroundColor: color }]}>
      <Ionicons name={icon} size={18} color={iconColor} style={{ marginBottom: 6 }} />
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color: textColor }]}>{value}</Text>
      <Text style={styles.kpiSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  // Trial banner
  trialBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fef3c7', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#fde68a' },
  trialLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  trialTitle: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  trialSub: { fontSize: 12, color: '#b45309', marginTop: 2 },
  trialClose: { padding: 4, marginLeft: 8 },
  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', alignItems: 'center' },
  modalIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 10 },
  modalBody: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center' },
  modalBtnRed: { backgroundColor: '#dc2626' },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalSkip: { marginTop: 14 },
  modalSkipText: { color: '#9ca3af', fontSize: 13 },
  // Dashboard
  greeting: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  kpi: { width: '47%', borderRadius: 14, padding: 14 },
  kpiLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600', marginBottom: 4 },
  kpiValue: { fontSize: 18, fontWeight: '800' },
  kpiSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  alertSection: { borderWidth: 1, borderColor: '#fed7aa' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  empRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  rankGold: { backgroundColor: '#fef9c3' },
  rankText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  empInfo: { flex: 1 },
  empName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  empRole: { fontSize: 11, color: '#9ca3af' },
  empStats: { alignItems: 'flex-end' },
  empAmount: { fontSize: 13, fontWeight: '700', color: '#111827' },
  empCount: { fontSize: 11, color: '#9ca3af' },
  actRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  actAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  actAvatarText: { fontSize: 14, fontWeight: '700', color: '#2563eb' },
  actInfo: { flex: 1 },
  actName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  actTime: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  actRight: { alignItems: 'flex-end' },
  actAmount: { fontSize: 13, fontWeight: '700', color: '#111827' },
  actPayment: { fontSize: 11, color: '#6b7280' },
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  stockName: { fontSize: 13, color: '#374151', flex: 1 },
  stockQty: { fontSize: 15, fontWeight: '700', color: '#ea580c' },
});
