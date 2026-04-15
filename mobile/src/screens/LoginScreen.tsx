import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Username dan password wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (err: any) {
      Alert.alert('Gagal Login', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>K</Text>
          </View>
          <Text style={styles.title}>Kazana Mobile</Text>
          <Text style={styles.subtitle}>Infrastruktur Stok Opname Modern</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan username..."
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan password..."
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.loginBtn, isSubmitting && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginBtnText}>Masuk ke Sistem</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          © 2024 Kazana ERP System • v1.0.0
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  keyboardView: { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 80, height: 80, backgroundColor: '#3b82f6', borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  logoText: { color: '#ffffff', fontSize: 36, fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginTop: 24 },
  subtitle: { color: '#64748b', marginTop: 8, textAlign: 'center' },
  formContainer: { gap: 16 },
  inputGroup: { marginBottom: 16 },
  label: { color: '#475569', marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: '#f8fafc', borderColor: '#f1f5f9', borderWidth: 1, height: 56, borderRadius: 16, paddingHorizontal: 16, color: '#1e293b' },
  loginBtn: { height: 56, backgroundColor: '#3b82f6', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  loginBtnDisabled: { backgroundColor: 'rgba(59, 130, 246, 0.7)' },
  loginBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 18 },
  footerText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 48 }
});
