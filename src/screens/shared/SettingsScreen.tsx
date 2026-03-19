import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { usersAPI, subscriptionsAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const planLabels: Record<string, string> = { MENSUEL: 'Mensuel', TRIMESTRIEL: 'Trimestriel', SEMESTRIEL: 'Semestriel', ANNUEL: 'Annuel', ENTERPRISE: 'Enterprise' };

export default function SettingsScreen() {
  const { user, setUser, logout } = useAuthStore();
  const displayPhone = user?.phone || (user?.email?.startsWith('+') ? user.email : '');

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: displayPhone });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: async () => { const { data } = await subscriptionsAPI.getUsage(); return data; },
  });

  const profileMutation = useMutation({
    mutationFn: () => usersAPI.updateProfile({ name: profileForm.name, phone: profileForm.phone }),
    onSuccess: (res) => {
      setUser({ ...user!, name: res.data.name });
      setProfileMsg('success');
      setTimeout(() => setProfileMsg(''), 3000);
    },
    onError: (e: any) => setProfileMsg('error:' + (e.response?.data?.message || 'Erreur')),
  });

  const pwdMutation = useMutation({
    mutationFn: () => usersAPI.updateProfile({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword }),
    onSuccess: () => {
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwdMsg('success');
      setTimeout(() => setPwdMsg(''), 3000);
    },
    onError: (e: any) => setPwdMsg('error:' + (e.response?.data?.message || 'Erreur')),
  });

  const handlePwd = () => {
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { setPwdMsg('error:Les mots de passe ne correspondent pas'); return; }
    if (pwdForm.newPassword.length < 8) { setPwdMsg('error:Minimum 8 caractères'); return; }
    pwdMutation.mutate();
  };

  const statusColor = usage?.status === 'ACTIVE' ? '#16a34a' : usage?.status === 'TRIAL' ? '#d97706' : '#dc2626';
  const statusBg = usage?.status === 'ACTIVE' ? '#dcfce7' : usage?.status === 'TRIAL' ? '#fef3c7' : '#fee2e2';
  const statusLabel = usage?.status === 'ACTIVE' ? 'Actif' : usage?.status === 'TRIAL' ? 'Essai gratuit' : 'Expiré';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Subscription */}
      {usage && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={18} color="#374151" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Mon abonnement</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Plan</Text>
            <Text style={styles.rowValue}>{planLabels[usage.plan] || usage.plan}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Statut</Text>
            <View style={[styles.badge, { backgroundColor: statusBg }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          {usage.endDate && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Expire le</Text>
              <Text style={styles.rowValue}>{new Date(usage.endDate).toLocaleDateString('fr-FR')}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Produits</Text>
            <Text style={styles.rowValue}>{usage.products?.used} / {usage.products?.unlimited ? '∞' : usage.products?.limit}</Text>
          </View>
        </View>
      )}

      {/* Profile */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={18} color="#374151" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Profil</Text>
        </View>
        {profileMsg === 'success' && (
          <View style={styles.successMsg}>
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" style={{ marginRight: 6 }} />
            <Text style={styles.successText}>Profil mis à jour</Text>
          </View>
        )}
        {profileMsg.startsWith('error:') && (
          <View style={styles.errorMsg}>
            <Ionicons name="alert-circle" size={16} color="#dc2626" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{profileMsg.replace('error:', '')}</Text>
          </View>
        )}
        <View style={styles.field}>
          <Text style={styles.label}>Nom</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput style={styles.inputWithIcon} value={profileForm.name} onChangeText={(v) => setProfileForm({ ...profileForm, name: v })} />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Téléphone</Text>
          <View style={styles.inputRow}>
            <Ionicons name="call-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput style={styles.inputWithIcon} value={profileForm.phone} onChangeText={(v) => setProfileForm({ ...profileForm, phone: v })} keyboardType="phone-pad" />
          </View>
        </View>
        <TouchableOpacity style={[styles.btn, profileMutation.isPending && { opacity: 0.6 }]} onPress={() => profileMutation.mutate()} disabled={profileMutation.isPending}>
          {profileMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enregistrer</Text>}
        </TouchableOpacity>
      </View>

      {/* Password */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="lock-closed-outline" size={18} color="#374151" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Mot de passe</Text>
        </View>
        {pwdMsg === 'success' && (
          <View style={styles.successMsg}>
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" style={{ marginRight: 6 }} />
            <Text style={styles.successText}>Mot de passe modifié</Text>
          </View>
        )}
        {pwdMsg.startsWith('error:') && (
          <View style={styles.errorMsg}>
            <Ionicons name="alert-circle" size={16} color="#dc2626" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{pwdMsg.replace('error:', '')}</Text>
          </View>
        )}
        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe actuel</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput style={[styles.inputWithIcon, { flex: 1 }]} value={pwdForm.currentPassword} onChangeText={(v) => setPwdForm({ ...pwdForm, currentPassword: v })} secureTextEntry={!showCurrent} placeholder="••••••••" placeholderTextColor="#9ca3af" />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={{ padding: 4 }}>
              <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Nouveau mot de passe</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-open-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput style={[styles.inputWithIcon, { flex: 1 }]} value={pwdForm.newPassword} onChangeText={(v) => setPwdForm({ ...pwdForm, newPassword: v })} secureTextEntry={!showNew} placeholder="••••••••" placeholderTextColor="#9ca3af" />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={{ padding: 4 }}>
              <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Confirmer</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-open-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput style={styles.inputWithIcon} value={pwdForm.confirmPassword} onChangeText={(v) => setPwdForm({ ...pwdForm, confirmPassword: v })} secureTextEntry placeholder="••••••••" placeholderTextColor="#9ca3af" />
          </View>
        </View>
        <TouchableOpacity style={[styles.btn, styles.btnOrange, pwdMutation.isPending && { opacity: 0.6 }]} onPress={handlePwd} disabled={pwdMutation.isPending}>
          {pwdMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Changer le mot de passe</Text>}
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [{ text: 'Annuler' }, { text: 'Déconnexion', style: 'destructive', onPress: logout }])}
      >
        <Ionicons name="log-out-outline" size={20} color="#dc2626" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowLabel: { fontSize: 13, color: '#6b7280' },
  rowValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, backgroundColor: '#f9fafb', paddingHorizontal: 12 },
  inputWithIcon: { flex: 1, paddingVertical: 11, fontSize: 15, color: '#111827' },
  btn: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  btnOrange: { backgroundColor: '#ea580c' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  successMsg: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10, marginBottom: 12 },
  successText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  errorMsg: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', borderRadius: 8, padding: 10, marginBottom: 12 },
  errorText: { fontSize: 13, color: '#dc2626' },
  logoutBtn: { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fee2e2' },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
});
