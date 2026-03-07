import { Stack, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Keyboard, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import Button from '../../components/Button';
import CurvedBanner from '../../components/CurvedBanner';
import InlineButton from '../../components/InlineButton';
import Input from '../../components/Input';
import InputCode from '../../components/InputCode';
import Spacer from '../../components/Spacer';
import { COLOURS } from '../../constants/colours';

export default function ResetPassword() {
  const [email] = useState('');
  const [codeValue, setCodeValue] = useState('');
  const [password, setPassword] = useState('');

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
          <CurvedBanner variant="medium" />
          <Spacer size="medium" />

          <View style={styles.content}>
            <Text style={styles.title}>CHANGE PASSWORD</Text>
            <Text style={styles.subtitle}>Please fill out the details below</Text>
          </View>

          <Spacer size="medium" />

          <View style={styles.content}>
            <Text style={styles.inputLabel}>Confirmation code</Text>
            <Text style={[styles.description, styles.inputMargin]}>
              The code you recieved via email
            </Text>

            <Spacer size="small" />

            <InputCode
              value={codeValue}
              onChangeText={setCodeValue}
              onComplete={(code) => console.log('Code completed:', code)}
            />
          </View>

          <Spacer size="medium" />

          <View style={styles.content}>
            <Text style={[styles.inputLabel, styles.inputMargin]}>Password</Text>
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

            <Spacer size="small" />

            <Spacer size="medium" />

            <Button title="Change password" onPress={handleReset} variant="standard" />
            <Spacer size="medium" />

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
  },
  inputMargin: {
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
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: COLOURS.black,
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLOURS.gray[700],
    lineHeight: 18,
  },
});
