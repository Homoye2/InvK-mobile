import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../lib/api';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export default function RegisterScreen({ navigation }: any) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const isConnected = useNetworkStatus();

  const [form, setForm] = useState({ tenantName: '', name: '', phone: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trialModal, setTrialModal] = useState<{ visible: boolean; endDate: string }>({ visible: false, endDate: '' });

  const handleRegister = async () => {
    if (!isConnected) { Alert.alert('Hors ligne', 'Vérifiez votre connexion internet.'); return; }
    if (!form.tenantName || !form.name || !form.phone || !form.password) {
      Alert.alert('Erreur', 'Tous les champs sont requis.');
      return;
    }
    if (form.password.length < 6) { Alert.alert('Erreur', 'Mot de passe minimum 6 caractères.'); return; }
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      const endDate = data.user?.trialEndsAt || '';
      setTrialModal({ visible: true, endDate });
      await setAuth(data.user, data.accessToken, data.refreshToken);
    } catch (e: any) {
      const msg = e.response?.data?.message;
      Alert.alert('Erreur', Array.isArray(msg) ? msg[0] : msg || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'tenantName', label: 'Nom de la boutique', placeholder: 'Boutique Chez Ali', icon: 'storefront-outline' as const },
    { key: 'name', label: 'Votre nom', placeholder: 'Ali Diallo', icon: 'person-outline' as const },
    { key: 'phone', label: 'Téléphone', placeholder: '+221771234567', icon: 'call-outline' as const, keyboard: 'phone-pad' as const },
  ];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={20} color="#2563eb" />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.sub}>30 jours d'essai gratuit</Text>
        </View>

        <View style={styles.card}>
          {fields.map(({ key, label, placeholder, icon, keyboard }) => (
            <View key={key} style={styles.field}>
              <Text style={styles.label}>{label}</Text>
              <View style={styles.inputRow}>
                <Ionicons name={icon} size={18} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithIcon}
                  value={(form as any)[key]}
                  onChangeText={(v) => setForm({ ...form, [key]: v })}
                  placeholder={placeholder}
                  placeholderTextColor="#9ca3af"
                  keyboardType={keyboard || 'default'}
                  autoCapitalize="none"
                />
              </View>
            </View>
          ))}

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={[styles.inputWithIcon, { flex: 1 }]}
                value={form.password}
                onChangeText={(v) => setForm({ ...form, password: v })}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPwd}
              />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Créer mon compte</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={trialModal.visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="checkmark-circle" size={56} color="#16a34a" />
            </View>
            <Text style={styles.modalTitle}>Bienvenue sur invK !</Text>
            <Text style={styles.modalBody}>
              Votre essai gratuit est actif jusqu'au{'\n'}
              <Text style={styles.modalDate}>
                {trialModal.endDate ? new Date(trialModal.endDate).toLocaleDateString('fr-FR') : '30 jours'}
              </Text>
              {'\n\n'}Profitez de toutes les fonctionnalités sans restriction.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={() => setTrialModal({ ...trialModal, visible: false })}>
              <Text style={styles.btnText}>Commencer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0f4ff' },
  container: { flexGrow: 1, padding: 24 },
  header: { marginBottom: 24, marginTop: 16 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { color: '#2563eb', fontSize: 15, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, backgroundColor: '#f9fafb', paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  inputWithIcon: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#111827' },
  eyeBtn: { padding: 4 },
  btn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', alignItems: 'center' },
  modalIconBox: { marginBottom: 12 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 10 },
  modalBody: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalDate: { fontWeight: '700', color: '#2563eb' },
});
