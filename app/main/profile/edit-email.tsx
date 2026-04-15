import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Button from '../../../components/Button';
import HeaderBackButton from '../../../components/HeaderBackButton';
import InlineNotification from '../../../components/InlineNotification';
import Input from '../../../components/Input';
import Spacer from '../../../components/Spacer';

import { COLOURS } from '../../../constants/colours';
import { supabase } from '../../../lib/supabase';

const GRADIENT_THRESHOLD = 24;

export default function EditEmail() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    const loadEmail = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.log('Error fetching auth user:', error);
        return;
      }

      setEmail(user.email ?? '');
    };

    loadEmail();
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    const headerValue = Math.min(scrollY / GRADIENT_THRESHOLD, 1);
    headerGradientOpacity.setValue(headerValue);
  };

  const handleRequestChange = async () => {
    setEmailError(null);
    setNotice(null);

    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ email });

    setLoading(false);

    if (error) {
      setNotice({ type: 'error', text: error.message });
      return;
    }

    setNotice({
      type: 'success',
      text: 'Check both your current and new email to confirm the change.',
    });

    setTimeout(() => {
      router.replace({
        pathname: '/main/profile/confirm-new-email',
        params: { email },
      });
    }, 1200);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ headerShown: false, gestureEnabled: true, animation: 'slide_from_right' }}
      />

      <View style={styles.topBar}>
        <HeaderBackButton iconName="chevron-left" />
      </View>

      <Animated.View
        style={[styles.headerGradientWrapper, { opacity: headerGradientOpacity }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['rgba(134, 134, 133, 0.35)', 'rgba(102, 102, 102, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={keyboardVisible ? 0 : -80}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.content}>
            <Text style={styles.heading}>Change email address</Text>

            <Spacer size="small" />

            <Text style={styles.body}>
              Enter the email address you’d like to use for your account. Keep in mind that this
              will be used for account-related updates and login.
            </Text>

            <Spacer size="medium" />

            <InlineNotification
              type="warning"
              text="For security, Supabase may require confirmation using both your current and new email address."
            />

            <Spacer size="medium" />

            <Text style={styles.inputLabel}>New email address</Text>

            <Input
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setEmailError(null);
                setNotice(null);
              }}
              placeholder="example@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              hasError={!!emailError}
            />

            {emailError && (
              <InlineNotification type="error" text={emailError} style={{ marginTop: 4 }} />
            )}

            {notice && (
              <>
                <Spacer size="medium" />
                <InlineNotification type={notice.type} text={notice.text} />
              </>
            )}

            <Spacer size="large" />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={loading ? 'Requesting...' : 'Request change'}
            onPress={handleRequestChange}
            variant="standard"
            disabled={loading}
          />

          <Spacer size="large" />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOURS.white,
  },
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLOURS.white,
    zIndex: 10,
  },
  headerGradientWrapper: {
    height: 6,
    width: '100%',
    zIndex: 9,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    marginHorizontal: 20,
  },
  heading: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLOURS.black,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.gray[700],
    lineHeight: 24,
  },
  inputLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLOURS.black,
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    paddingTop: 12,
    backgroundColor: COLOURS.white,
  },
});
