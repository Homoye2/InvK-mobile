import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  type: 'trial' | 'expired';
  trialEndDate?: string;
  onClose?: () => void;
  onSubscribe: () => void;
}

export default function SubscriptionModal({ visible, type, trialEndDate, onClose, onSubscribe }: Props) {
  const isExpired = type === 'expired';
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: isExpired ? '#fee2e2' : '#dcfce7' }]}>
            <Ionicons
              name={isExpired ? 'warning-outline' : 'checkmark-circle-outline'}
              size={48}
              color={isExpired ? '#dc2626' : '#16a34a'}
            />
          </View>
          <Text style={styles.title}>
            {isExpired ? 'Abonnement expiré' : 'Bienvenue sur invK !'}
          </Text>
          <Text style={styles.body}>
            {isExpired
              ? "Votre abonnement a expiré. Renouvelez-le pour continuer à utiliser l'application."
              : `Votre essai gratuit est actif jusqu'au ${trialEndDate ? new Date(trialEndDate).toLocaleDateString('fr-FR') : '—'}.\nProfitez de toutes les fonctionnalités !`}
          </Text>
          <TouchableOpacity style={[styles.btn, isExpired && styles.btnRed]} onPress={onSubscribe}>
            <Text style={styles.btnText}>
              {isExpired ? 'Renouveler mon abonnement' : 'Voir les plans'}
            </Text>
          </TouchableOpacity>
          {!isExpired && onClose && (
            <TouchableOpacity onPress={onClose} style={styles.skip}>
              <Text style={styles.skipText}>Continuer l'essai gratuit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', alignItems: 'center' },
  iconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 10 },
  body: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  btn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, width: '100%', alignItems: 'center' },
  btnRed: { backgroundColor: '#dc2626' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  skip: { marginTop: 14 },
  skipText: { color: '#6b7280', fontSize: 13 },
});
