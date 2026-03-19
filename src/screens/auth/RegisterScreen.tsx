import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../lib/api';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import PhoneInput from '../../components/PhoneInput';

export default function RegisterScreen({ navigation }: any) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const isConnected = useNetworkStatus();

  const [form, setForm] = useState({ tenantName: '', name: '', phone: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

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
      // Pass fromRegister=true so HomeScreen shows the welcome trial modal
      await setAuth(data.user, data.accessToken, data.refreshToken, true);
      // Navigation is handled automatically by RootNavigator reacting to isAuthenticated
    } catch (e: any) {
      const msg = e.response?.data?.message;
      Alert.alert('Erreur', Array.isArray(msg) ? msg[0] : msg || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

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
          {/* Boutique */}
          <View style={styles.field}>
            <Text style={styles.label}>Nom de la boutique</Text>
            <View style={styles.inputRow}>
              <Ionicons name="storefront-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                value={form.tenantName}
                onChangeText={(v) => setForm({ ...form, tenantName: v })}
                placeholder="Boutique Chez Ali"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Votre nom</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder="Ali Diallo"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Phone with country picker */}
          <View style={styles.field}>
            <Text style={styles.label}>Téléphone</Text>
            <PhoneInput
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
          </View>

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
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
                      <Text style={styles.linkText}>Déjà un compte ? <Text style={styles.link}>Se Connecter</Text></Text>
                    </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0f4ff' },
  container: { flexGrow: 1, padding: 24 },
  header: { marginBottom: 24, marginTop: 60 },
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
  linkRow: { marginTop: 16, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#6b7280' },
  link: { color: '#2563eb', fontWeight: '600' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
