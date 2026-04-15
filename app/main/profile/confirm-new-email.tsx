import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from 'expo-router';
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
import InlineButton from '../../../components/InlineButton';
import InlineNotification from '../../../components/InlineNotification';
import InputCode from '../../../components/InputCode';
import Spacer from '../../../components/Spacer';

import { COLOURS } from '../../../constants/colours';
import { supabase } from '../../../lib/supabase';

const GRADIENT_THRESHOLD = 24;

export default function ConfirmNewEmail() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [codeValue, setCodeValue] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    const headerValue = Math.min(scrollY / GRADIENT_THRESHOLD, 1);
    headerGradientOpacity.setValue(headerValue);
  };

  const handleConfirmChange = async () => {
    setNotice(null);

    if (!email) {
      setNotice({ type: 'error', text: 'Missing email address for verification.' });
      return;
    }

    if (!codeValue || codeValue.replace(/\D/g, '').length !== 6) {
      setNotice({ type: 'error', text: 'Please enter the 6-digit confirmation code.' });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: codeValue.replace(/\D/g, ''),
      type: 'email_change',
    });

    setLoading(false);

    if (error) {
      setNotice({ type: 'error', text: error.message });
      return;
    }

    setNotice({ type: 'success', text: 'Email address confirmed successfully.' });

    setTimeout(() => {
      router.replace('/main/profile/personal-details');
    }, 1200);
  };

  const handleResendCode = async () => {
    setNotice(null);

    if (!email) {
      setNotice({ type: 'error', text: 'Missing email address for resend.' });
      return;
    }

    const { error } = await supabase.auth.resend({
      type: 'email_change',
      email,
    });

    if (error) {
      setNotice({ type: 'error', text: error.message });
      return;
    }

    setNotice({ type: 'success', text: 'A new confirmation code has been sent.' });
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
            <Text style={styles.heading}>Confirm new email address</Text>

            <Spacer size="small" />

            <Text style={styles.body}>
              Enter the confirmation code sent to your new email address to complete the change.
            </Text>

            <Spacer size="medium" />

            {/* Updated formatting */}
            <InlineNotification
              type="info"
              text="We’ve sent a verification code to the following email address:"
            />

            <Spacer size="small" />

            <Text style={styles.emailSubtitle}>{email ?? 'your new email address'}</Text>

            <Spacer size="medium" />

            <Text style={styles.inputLabel}>Confirmation code</Text>

            <Spacer size="small" />

            <InputCode
              value={codeValue}
              onChangeText={(value) => {
                setCodeValue(value);
                setNotice(null);
              }}
            />

            {notice && (
              <>
                <Spacer size="medium" />
                <InlineNotification type={notice.type} text={notice.text} />
              </>
            )}

            <Spacer size="small" />

            <Text style={styles.bodyText}>
              Didn’t receive a code? <InlineButton title="Resend code" onPress={handleResendCode} />
            </Text>

            <Spacer size="large" />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={loading ? 'Confirming...' : 'Confirm change'}
            onPress={handleConfirmChange}
            variant="standard"
            disabled={loading}
          />
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
  },
  bodyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.black,
  },

  emailSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: COLOURS.black,
    lineHeight: 14,
    marginTop: 2,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    paddingTop: 12,
    backgroundColor: COLOURS.white,
  },
});
