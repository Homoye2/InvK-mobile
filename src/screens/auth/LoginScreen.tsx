import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../lib/api';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export default function LoginScreen({ navigation }: any) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const isConnected = useNetworkStatus();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!isConnected) {
      Alert.alert('Hors ligne', 'Vérifiez votre connexion internet et réessayez.');
      return;
    }
    if (!identifier.trim() || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.login(identifier.trim(), password);
      await setAuth(data.user, data.accessToken, data.refreshToken);
    } catch (e: any) {
      const msg = e.response?.data?.message;
      Alert.alert('Connexion échouée', Array.isArray(msg) ? msg[0] : msg || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>invK</Text>
          <Text style={styles.logoSub}>Gestion de boutique</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Bon retour !</Text>
          <Text style={styles.sub}>Connectez-vous à votre espace</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Téléphone ou Email</Text>
            <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="+221771234567"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={[styles.inputWithIcon, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPwd}
              />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Se connecter</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
            <Text style={styles.linkText}>Pas de compte ? <Text style={styles.link}>Créer un compte</Text></Text>
          </TouchableOpacity>
        </View>

        {!isConnected && (
          <View style={styles.offlineBox}>
            <Ionicons name="wifi-outline" size={16} color="#92400e" style={{ marginRight: 6 }} />
            <Text style={styles.offlineText}>Pas de connexion internet</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0f4ff' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoBox: { alignItems: 'center', marginBottom: 32 },
  logoText: { fontSize: 40, fontWeight: '800', color: '#2563eb' },
  logoSub: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sub: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, backgroundColor: '#f9fafb', paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  inputWithIcon: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#111827' },
  eyeBtn: { padding: 4 },
  btn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkRow: { marginTop: 16, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#6b7280' },
  link: { color: '#2563eb', fontWeight: '600' },
  offlineBox: { marginTop: 16, backgroundColor: '#fef3c7', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  offlineText: { color: '#92400e', fontSize: 13, fontWeight: '600' },
});
