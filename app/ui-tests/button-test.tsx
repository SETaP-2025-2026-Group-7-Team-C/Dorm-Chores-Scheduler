import { Stack } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import HeaderBackButton from '../../components/HeaderBackButton';

export default function ButtonTestPage() {
  const handleStandardPress = () => {
    Alert.alert('Standard Button Pressed!', 'You pressed the standard button');
  };

  const handleSecondaryPress = () => {
    Alert.alert('Secondary Button Pressed!', 'You pressed the secondary button');
  };

  const handleTertiaryPress = () => {
    Alert.alert('Tertiary Button Pressed!', 'You pressed the tertiary button');
  };

  const handleDangerPress = () => {
    Alert.alert('Danger Button Pressed!', 'You pressed the danger button');
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
      <View style={styles.container}>
        <Text style={styles.title}>Button Component</Text>
        <Text style={styles.subtitle}>Testing different button variants and states</Text>

        <View style={styles.buttonContainer}>
          <Button title="Standard Button" onPress={handleStandardPress} variant="standard" />

          <Button title="Secondary Button" onPress={handleSecondaryPress} variant="secondary" />

          <Button title="Tertiary Button" onPress={handleTertiaryPress} variant="tertiary" />

          <Button title="Danger Button" onPress={handleDangerPress} variant="danger" />

          <Button title="Disabled Button" onPress={() => {}} disabled={true} />
        </View>
      </View>
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
    color: '#000000',
  },
  buttonContainer: {
    gap: 8,
  },
});
