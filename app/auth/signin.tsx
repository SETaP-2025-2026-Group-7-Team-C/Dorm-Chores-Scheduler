import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Button from '../../components/Button';
import CurvedBanner from '../../components/CurvedBanner';
import InlineButton from '../../components/InlineButton';
import InlineNotification from '../../components/InlineNotification';
import Input from '../../components/Input';
import Spacer from '../../components/Spacer';

import { COLOURS } from '../../constants/colours';
import { getUserRole, isSoftDeletedUser, signInUser, signOutUser } from '../../lib/auth';
import { UnauthorisedError, ValidationError, formatErrorMessage } from '../../lib/errors';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [notice, setNotice] = useState<{
    type: 'error' | 'success' | 'info' | 'warning' | 'tip';
    text: string;
  } | null>(null);

  useEffect(() => {
    const backAction = () => {
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const setFieldError = (error: string) => {
    if (error.startsWith('Email')) {
      setEmailError(error);
    } else if (error.startsWith('Password')) {
      setPasswordError(error);
    } else {
      setNotice({ type: 'error', text: error });
    }
  };

  const clearErrors = () => {
    setEmailError(null);
    setPasswordError(null);
    setNotice(null);
  };

  const handleAction = useCallback(async () => {
    clearErrors();

    try {
      const data = await signInUser(email, password);

      const userId = data.user?.id;
      if (!userId) {
        setNotice({ type: 'error', text: 'Unable to find signed in user.' });
        return;
      }

      const isDeleted = await isSoftDeletedUser(userId);
      if (isDeleted) {
        await signOutUser();
        setNotice({
          type: 'error',
          text: 'This account has been deactivated and can no longer be used.',
        });
        return;
      }

      setNotice({ type: 'success', text: 'Signed in successfully!' });

      const role = await getUserRole(userId);
      if (role === 'manager') {
        router.push('/main/manager/dashboard');
      } else {
        router.push('/main/student/home');
      }
    } catch (err: any) {
      if (err instanceof ValidationError) {
        setFieldError(err.message);
      } else if (err instanceof UnauthorisedError) {
        setNotice({ type: 'error', text: err.message });
      } else {
        setNotice({
          type: 'error',
          text: err.message ? formatErrorMessage(err.message) : 'An unexpected error occurred.',
        });
      }
    }
  }, [email, password]);

  const scrollContent = (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
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
          hasError={!!emailError}
          onBlur={() => setEmailError(null)}
        />
        {emailError && (
          <InlineNotification type="error" text={emailError} style={{ marginTop: 4 }} />
        )}

        <Spacer size="medium" />

        <Text style={styles.inputLabel}>Password</Text>
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          hasError={!!passwordError}
          onBlur={() => setPasswordError(null)}
        />
        {passwordError && (
          <InlineNotification type="error" text={passwordError} style={{ marginTop: 4 }} />
        )}

        <Spacer size="small" />

        <Text style={styles.bodyText}>
          Forgot your password?{' '}
          <InlineButton
            title="Reset password"
            onPress={() => router.push('/auth/reset-password')}
          />
        </Text>

        <Spacer size="large" />

        <Button title="Sign in" onPress={handleAction} variant="standard" />

        {notice && (
          <>
            <Spacer size="medium" />
            <InlineNotification type={notice.type} text={notice.text} />
          </>
        )}

        <Spacer size="large" />

        <Text style={[styles.bodyText, styles.centerText]}>
          Don&apos;t have an account?{' '}
          <InlineButton title="Sign Up" onPress={() => router.push('/auth/account-type')} />
        </Text>

        <Spacer size="large" />
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={keyboardVisible ? 0 : -80}
      >
        {scrollContent}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOURS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
