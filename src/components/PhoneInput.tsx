import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  FlatList, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COUNTRIES = [
  { code: 'SN', name: 'Sénégal', dial: '+221' },
  { code: 'CI', name: "Côte d'Ivoire", dial: '+225' },
  { code: 'ML', name: 'Mali', dial: '+223' },
  { code: 'BF', name: 'Burkina Faso', dial: '+226' },
  { code: 'GN', name: 'Guinée', dial: '+224' },
  { code: 'TG', name: 'Togo', dial: '+228' },
  { code: 'BJ', name: 'Bénin', dial: '+229' },
  { code: 'NE', name: 'Niger', dial: '+227' },
  { code: 'MR', name: 'Mauritanie', dial: '+222' },
  { code: 'CM', name: 'Cameroun', dial: '+237' },
  { code: 'FR', name: 'France', dial: '+33' },
];

interface Props {
  value: string;
  onChange: (fullNumber: string) => void;
  placeholder?: string;
}

export default function PhoneInput({ value, onChange, placeholder = '77 123 45 67' }: Props) {
  const [pickerVisible, setPickerVisible] = useState(false);

  // Parse current value to extract dial code and local number
  const detectCountry = () => {
    for (const c of COUNTRIES) {
      const stripped = c.dial.replace('+', '');
      if (value.startsWith(c.dial)) return { country: c, local: value.slice(c.dial.length) };
      if (value.startsWith(stripped)) return { country: c, local: value.slice(stripped.length) };
    }
    return { country: COUNTRIES[0], local: value };
  };

  const { country, local } = detectCountry();

  const handleLocalChange = (text: string) => {
    // Strip any leading zeros or dial code the user might type
    const cleaned = text.replace(/[^0-9]/g, '');
    onChange(country.dial + cleaned);
  };

  const handleCountrySelect = (c: typeof COUNTRIES[0]) => {
    setPickerVisible(false);
    onChange(c.dial + local);
  };

  return (
    <View style={styles.container}>
      {/* Country picker button */}
      <TouchableOpacity style={styles.dialBtn} onPress={() => setPickerVisible(true)}>
        <View style={styles.codeTag}>
          <Text style={styles.codeTagText}>{country.code}</Text>
        </View>
        <Text style={styles.dial}>{country.dial}</Text>
        <Ionicons name="chevron-down" size={14} color="#6b7280" />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Number input */}
      <TextInput
        style={styles.input}
        value={local}
        onChangeText={handleLocalChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType="phone-pad"
        autoCapitalize="none"
      />

      {/* Country picker modal */}
      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choisir un pays</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(i) => i.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.countryRow, item.code === country.code && styles.countryRowSelected]}
                onPress={() => handleCountrySelect(item)}
              >
                <View style={styles.codeTag}>
                  <Text style={styles.codeTagText}>{item.code}</Text>
                </View>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryDial}>{item.dial}</Text>
                {item.code === country.code && (
                  <Ionicons name="checkmark" size={18} color="#2563eb" />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  dialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  codeTag: {
    backgroundColor: '#dbeafe',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  codeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
    letterSpacing: 0.5,
  },
  dial: { fontSize: 14, fontWeight: '600', color: '#374151' },
  divider: { width: 1, height: 24, backgroundColor: '#d1d5db' },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 4 },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  countryRowSelected: { backgroundColor: '#eff6ff' },
  countryName: { flex: 1, fontSize: 15, color: '#111827' },
  countryDial: { fontSize: 14, color: '#6b7280', fontWeight: '600', marginRight: 4 },
});
