import { Stack, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Keyboard, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import Button from '../../components/Button';
import CurvedBanner from '../../components/CurvedBanner';
import InlineButton from '../../components/InlineButton';
import InputCode from '../../components/InputCode';
import Spacer from '../../components/Spacer';
import { COLOURS } from '../../constants/colours';

export default function ResetPassword() {
  const [codeValue, setCodeValue] = useState('');
  const email = 'example@example.com';

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleReset = useCallback(() => {
    if (!codeValue.trim()) {
      console.log('Code is required');
      return;
    }

    console.log('Reset password triggered');
    router.push('/auth/change-password');
  }, [codeValue]);

  const handleResend = useCallback(() => {
    console.log('Resend code triggered');
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
        <View style={styles.container}>
          <CurvedBanner variant="large" />
          <Spacer size="medium" />

          <View style={styles.content}>
            <Text style={styles.title}>CONFIRM EMAIL ADDRESS</Text>
            <Text style={styles.subtitle}>We have sent a confirmation email to: {email}</Text>
          </View>

          <Spacer size="medium" />

          <View style={styles.content}>
            <Text style={styles.inputLabel}>Confirmation code</Text>

            <Spacer size="small" />

            <InputCode
              value={codeValue}
              onChangeText={setCodeValue}
              onComplete={(code) => console.log('Code completed:', code)}
            />
          </View>

          <Spacer size="small" />

          <Text style={[styles.bodyText, styles.centerText]}>
            Not received a code <InlineButton title="Re-send code" onPress={handleResend} />
          </Text>

          <Spacer size="large" />

          <View style={styles.content}>
            <Button title="Submit" onPress={handleReset} variant="standard" />
          </View>

          <Spacer size="large" />

          <Text style={[styles.bodyText, styles.centerText]}>
            Incorrect email address{' '}
            <InlineButton title="Return to Sign up" onPress={() => router.push('/auth/signup')} />
          </Text>

          <Spacer size="large" />
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
