import { Stack, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Keyboard, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import Button from '../../components/Button';
import CurvedBanner from '../../components/CurvedBanner';
import InlineButton from '../../components/InlineButton';
import Input from '../../components/Input';
import Spacer from '../../components/Spacer';
import { COLOURS } from '../../constants/colours';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [defaultValue, setDefaultValue] = useState('');

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          <CurvedBanner variant="small" />
          <Spacer size="small" />

          <View style={styles.content}>
            <Text style={styles.title}>CREATE ACCOUNT</Text>
            <Text style={styles.subtitle}>Please enter the following information</Text>
          </View>

          <Spacer size="medium" />

          <View style={styles.content}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <Input value={defaultValue} onChangeText={setDefaultValue} placeholder="Example Name" />
          </View>

          <Spacer size="medium" />

          <View style={styles.content}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Spacer size="medium" />

            <Text style={styles.inputLabel}>Password</Text>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />

            <Spacer size="medium" />

            <Text style={[styles.inputLabel, styles.inputMargin]}>Confirm password</Text>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Confirm your password"
              secureTextEntry
            />

            <Spacer size="medium" />

            <Button title="Sign Up" onPress={() => router.push('/auth/confirm-email')} />
            <Spacer size="medium" />

            <Text style={[styles.bodyText, styles.centerText]}>
              Incorrect account type?{' '}
              <InlineButton
                title="Change account type"
                onPress={() => router.push('/auth/account-type')}
              />
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOURS.white,
  },
  content: {
    marginHorizontal: 24,
  },
  title: {
    fontFamily: 'Inter-Black',
    fontSize: 56,
    color: COLOURS.primary,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.primary,
  },
  inputLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLOURS.black,
    marginBottom: 8,
  },
  bodyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.black,
  },
  centerText: {
    textAlign: 'center',
  },
  inputMargin: {
    marginBottom: 8,
  },
});
