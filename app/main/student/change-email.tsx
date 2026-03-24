import { useState } from 'react';
import {
    ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform,
    SafeAreaView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { supabase } from './lib/supabase';

const ChangeEmailPage = () => {
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateEmail = async () => {
    if (!newEmail || !confirmEmail) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newEmail.toLowerCase() === confirmEmail.toLowerCase()) {
    } else {
      Alert.alert("Error", "Emails do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        email: newEmail.toLowerCase().trim(),
      });

      if (error) throw error;

      if (data) {
        Alert.alert(
          "Check your inbox",
          "We've sent a confirmation link to both your old and new email addresses to verify the change."
        );
        setNewEmail('');
        setConfirmEmail('');
      }
    } catch (error) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Update Profile Email</Text>
          <Text style={styles.subtitle}>
            Enter your new email address. You will need to verify this change via email.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="new-email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={newEmail}
              onChangeText={setNewEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Email</Text>
            <TextInput
              style={styles.input}
              placeholder="confirm-email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={confirmEmail}
              onChangeText={setConfirmEmail}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleUpdateEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffc2c2',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ChangeEmailPage;