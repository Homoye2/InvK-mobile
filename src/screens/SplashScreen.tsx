import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoBox, { transform: [{ scale }], opacity }]}>
        <Text style={styles.logo}>invK</Text>
        <Text style={styles.tagline}>Gestion de boutique</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  logoBox: { alignItems: 'center' },
  logo: { fontSize: 56, fontWeight: '900', color: '#fff', letterSpacing: -2 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 8, fontWeight: '500' },
});
