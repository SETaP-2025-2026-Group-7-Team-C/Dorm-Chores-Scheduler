import { Stack, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Keyboard, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import Button from '../../components/Button';
import CurvedBanner from '../../components/CurvedBanner';
import InlineButton from '../../components/InlineButton';
import Input from '../../components/Input';
import Spacer from '../../components/Spacer';
import { COLOURS } from '../../constants/colours';

export default function ResetPassword() {
  const [email, setEmail] = useState('');

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleReset = useCallback(() => {
    if (!email.trim()) {
      console.log('Email is required');
      return;
    }

    console.log('Reset password triggered');
  }, [email]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
        <View style={styles.container}>
          <CurvedBanner variant="large" />
          <Spacer size="large" />

          <View style={styles.content}>
            <Text style={styles.title}>RESET PASSWORD</Text>
            <Text style={styles.subtitle}>Please fill out the details below</Text>
          </View>

          <Spacer size="large" />

          <View style={styles.content}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="example@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              autoComplete="email"
            />

            <Spacer size="large" />

            <Button
              title="Reset password"
              onPress={() => router.push('/auth/change-password')}
              variant="standard"
            />
            <Spacer size="large" />

            <Text style={[styles.bodyText, styles.centerText]}>
              No longer needed?{' '}
              <InlineButton title="Return to Sign in" onPress={() => router.push('/auth/signin')} />
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
