import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { Keyboard, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import Button from '../../components/Button';
import CurvedBanner from '../../components/CurvedBanner';
import InlineButton from '../../components/InlineButton';
import Input from '../../components/Input';
import Spacer from '../../components/Spacer';
import { COLOURS } from '../../constants/colours';

type AuthAction = 'resetPassword' | 'signIn' | 'signUp';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAction = useCallback((action: AuthAction) => {
    console.log(`${action} action triggered`);
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          <CurvedBanner variant="large" />
          <Spacer size="large" />

          <View style={styles.content}>
            <Text style={styles.title}>SIGN IN</Text>
            <Text style={styles.subtitle}>Please sign in below to continue</Text>
          </View>

          <Spacer size="large" />

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

            <Spacer size="small" />

            <Text style={styles.bodyText}>
              Forgot your password?{' '}
              <InlineButton title="Reset password" onPress={() => handleAction('resetPassword')} />
            </Text>

            <Spacer size="large" />

            <Button title="Sign in" onPress={() => handleAction('signIn')} variant="standard" />

            <Spacer size="large" />

            <Text style={[styles.bodyText, styles.centerText]}>
              Don&apos;t have an account?{' '}
              <InlineButton title="Sign Up" onPress={() => handleAction('signUp')} />
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
});
