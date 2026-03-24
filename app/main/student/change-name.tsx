import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';


const ChangeDisplayName = () => {
  const [formData, setFormData] = useState({
    newName: ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    const { newName } = formData;

    setLoading(true);

    // --- SIMULATED BACKEND REQUEST ---
    setTimeout(() => {
      setLoading(false);

      // 3. Collision Check
      const isTaken = profiles.name.includes(newName.toLowerCase());
      if (isTaken || newName === profiles.currentUser.displayname) {
        Alert.alert("Error", "This name is already associated with an account.");
        return;
      }

      // 4. Success
      Alert.alert("Success", "Name changed to " + newName);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Change Display Name</Text>
        <Text style={styles.subtitle}>
          Current: <Text style={styles.NameHighlight}>{MOCK_DB.currentUser.displayname}</Text>
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Display Name</Text>
          <TextInput
            style={styles.input}
            keyboardType="none"
            autoCapitalize="none"
            onChangeText={(val) => setFormData({ ...formData, newName: val })}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Name</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffc2c2', // Your requested light pink background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  NameHighlight: {
    color: '#2563eb',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },

button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChangeDisplayName;