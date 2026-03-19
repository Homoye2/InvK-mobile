import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { usersAPI } from '../../lib/api';

export default function TeamScreen() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<any>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: async () => { const { data } = await usersAPI.getAll(); return data; },
  });

  const inviteMutation = useMutation({
    mutationFn: () => usersAPI.invite({ name: form.name, email: form.phone, password: form.password }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      setCreated({ name: form.name, identifier: form.phone, password: form.password });
      setModal(false);
      setForm({ name: '', phone: '', password: '' });
    },
    onError: (e: any) => setError(e.response?.data?.message || 'Erreur'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => usersAPI.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });

  const handleInvite = () => {
    if (!form.name || !form.phone || !form.password) { setError('Tous les champs sont requis'); return; }
    setError('');
    inviteMutation.mutate();
  };

  const employees = (users as any[]).filter((u: any) => u.role === 'EMPLOYE');
  const managers = (users as any[]).filter((u: any) => u.role !== 'EMPLOYE');

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.count}>{(users as any[]).length} membre{(users as any[]).length > 1 ? 's' : ''}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setForm({ name: '', phone: '', password: '' }); setError(''); setModal(true); }}>
          <Ionicons name="person-add-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {created && (
        <View style={styles.createdBanner}>
          <View style={styles.createdTitleRow}>
            <Ionicons name="checkmark-circle" size={18} color="#15803d" style={{ marginRight: 6 }} />
            <Text style={styles.createdTitle}>Employé créé !</Text>
          </View>
          <Text style={styles.createdInfo}>Identifiant : <Text style={styles.mono}>{created.identifier}</Text></Text>
          <Text style={styles.createdInfo}>Mot de passe : <Text style={styles.mono}>{created.password}</Text></Text>
          <TouchableOpacity onPress={() => setCreated(null)}><Text style={styles.dismiss}>Fermer</Text></TouchableOpacity>
        </View>
      )}

      {isLoading ? <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" /> : (
        <FlatList
          data={[...managers, ...employees]}
          keyExtractor={(i: any) => i.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item: u }: any) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{u.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{u.name}</Text>
                <Text style={styles.role}>{u.role === 'EMPLOYE' ? 'Employé' : 'Gérant'}</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, u.isActive ? styles.toggleActive : styles.toggleInactive]}
                onPress={() => Alert.alert(u.isActive ? 'Désactiver ?' : 'Activer ?', u.name, [{ text: 'Annuler' }, { text: 'Confirmer', onPress: () => toggleMutation.mutate(u.id) }])}
              >
                <Text style={[styles.toggleText, { color: u.isActive ? '#16a34a' : '#6b7280' }]}>{u.isActive ? 'Actif' : 'Inactif'}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ajouter un employé</Text>
            <TouchableOpacity onPress={() => setModal(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nom complet *</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
                <TextInput style={styles.inputWithIcon} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Prénom Nom" placeholderTextColor="#9ca3af" />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Téléphone * (identifiant)</Text>
              <View style={styles.inputRow}>
                <Ionicons name="call-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
                <TextInput style={styles.inputWithIcon} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="+221771234567" placeholderTextColor="#9ca3af" keyboardType="phone-pad" />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Mot de passe *</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
                <TextInput style={[styles.inputWithIcon, { flex: 1 }]} value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} placeholder="Min. 6 caractères" placeholderTextColor="#9ca3af" secureTextEntry={!showPwd} />
                <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={{ padding: 4 }}>
                  <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[styles.submitBtn, inviteMutation.isPending && { opacity: 0.6 }]} onPress={handleInvite} disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Créer l'employé</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  count: { fontSize: 14, color: '#6b7280' },
  addBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  createdBanner: { margin: 16, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, padding: 14 },
  createdTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  createdTitle: { fontSize: 14, fontWeight: '700', color: '#15803d' },
  createdInfo: { fontSize: 13, color: '#374151', marginBottom: 2 },
  mono: { fontFamily: 'monospace', fontWeight: '700' },
  dismiss: { color: '#16a34a', fontSize: 13, marginTop: 8, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#2563eb' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827' },
  role: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  toggle: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  toggleActive: { backgroundColor: '#dcfce7' },
  toggleInactive: { backgroundColor: '#f3f4f6' },
  toggleText: { fontSize: 12, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 4 },
  modalBody: { padding: 20 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 12 },
  inputWithIcon: { flex: 1, paddingVertical: 11, fontSize: 15, color: '#111827' },
  submitBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  errorText: { color: '#dc2626', backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 },
});
