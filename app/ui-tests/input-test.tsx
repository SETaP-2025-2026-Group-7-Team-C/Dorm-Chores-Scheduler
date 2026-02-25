import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import HeaderBackButton from '../../components/HeaderBackButton';
import Input from '../../components/Input';
import InputCode from '../../components/InputCode';

export default function InputTest() {
  const [defaultValue, setDefaultValue] = useState('');
  const [errorValue, setErrorValue] = useState('');
  const [placeholderValue, setPlaceholderValue] = useState('');
  const [prefilledValue, setPrefilledValue] = useState('Prefilled text content');
  const [hasError, setHasError] = useState(false);
  const [codeValue, setCodeValue] = useState('');

  const toggleError = () => {
    setHasError(!hasError);
  };

  const clearAllInputs = () => {
    setDefaultValue('');
    setErrorValue('');
    setPlaceholderValue('');
    setPrefilledValue('');
    setHasError(false);
    setCodeValue('');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Input Component</Text>
        <Text style={styles.subtitle}>Test input states, styling and interactions</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default State</Text>
          <Text style={styles.description}>Normal input with default border styling</Text>
          <Input
            value={defaultValue}
            onChangeText={setDefaultValue}
            placeholder="Type something here..."
            style={styles.inputSpacing}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focus State</Text>
          <Text style={styles.description}>Click to see focus styling with black border</Text>
          <Input placeholder="Click to focus and see border change" style={styles.inputSpacing} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error State</Text>
          <Text style={styles.description}>Error styling with red border - toggle below</Text>
          <Input
            value={errorValue}
            onChangeText={setErrorValue}
            hasError={hasError}
            placeholder="This input can show error state"
            style={styles.inputSpacing}
          />
          <Button
            title={hasError ? 'Remove Error State' : 'Show Error State'}
            onPress={toggleError}
            variant="secondary"
            style={styles.buttonSpacing}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Placeholder Variations</Text>
          <Text style={styles.description}>Different placeholder text examples</Text>
          <Input
            value={placeholderValue}
            onChangeText={setPlaceholderValue}
            placeholder="Short placeholder"
            style={styles.inputSpacing}
          />
          <Input
            placeholder="This is a much longer placeholder text to demonstrate how it handles overflow"
            style={styles.inputSpacing}
          />
          <Input placeholder="" style={styles.inputSpacing} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prefilled Content</Text>
          <Text style={styles.description}>Input with existing content</Text>
          <Input
            value={prefilledValue}
            onChangeText={setPrefilledValue}
            style={styles.inputSpacing}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Different Input Types</Text>
          <Text style={styles.description}>Various keyboard and input configurations</Text>

          <Text style={styles.inputLabel}>Email Input:</Text>
          <Input
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.inputSpacing}
          />

          <Text style={styles.inputLabel}>Number Input:</Text>
          <Input placeholder="Enter number" keyboardType="numeric" style={styles.inputSpacing} />

          <Text style={styles.inputLabel}>Password Input:</Text>
          <Input placeholder="Enter password" secureTextEntry style={styles.inputSpacing} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interactive Controls</Text>
          <Button
            title="Clear All Inputs"
            onPress={clearAllInputs}
            variant="danger"
            style={styles.buttonSpacing}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Code Input Component</Text>
          <Text style={styles.description}>6-digit numeric code input with dash formatting</Text>

          <Text style={styles.inputLabel}>Default Code Input:</Text>
          <InputCode
            value={codeValue}
            onChangeText={setCodeValue}
            onComplete={(code) => console.log('Code completed:', code)}
            style={styles.inputSpacing}
          />

          <Text style={styles.inputLabel}>Prefilled Code (123456):</Text>
          <InputCode value="123456" style={styles.inputSpacing} />
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'left',
    marginBottom: 24,
    color: '#666666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  inputSpacing: {
    marginBottom: 12,
  },
  buttonSpacing: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    marginTop: 8,
  },
});
