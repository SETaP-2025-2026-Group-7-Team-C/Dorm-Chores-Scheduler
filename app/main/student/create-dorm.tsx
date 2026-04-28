import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
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
import Input from '../../../components/Input';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { createDorm, joinDorm, setActiveDormId } from '../../../lib/dorms';
import { supabase } from '../../../lib/supabase';

const GRADIENT_THRESHOLD = 24;

export default function CreateDorm() {
  const [name, setName] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [notice, setNotice] = useState<{
    type: 'error' | 'success' | 'info' | 'warning' | 'tip';
    text: string;
  } | null>(null);

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = e.nativeEvent;
    const scrollY = contentOffset.y;
    const headerValue = Math.min(scrollY / GRADIENT_THRESHOLD, 1);
    headerGradientOpacity.setValue(headerValue);
  };

  const handleCreate = useCallback(async () => {
    setNotice(null);

    const nameTrimmed = name.trim();

    if (!nameTrimmed) {
      setNotice({ type: 'error', text: 'Please enter a dorm name' });
      return;
    }
    if (nameTrimmed.length < 3 || nameTrimmed.length > 50) {
      setNotice({ type: 'error', text: 'Dorm name must be between 3 and 50 characters' });
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error('User not authenticated.');

      const localUserId = userData.user.id;
      if (!localUserId) {
        setNotice({ type: 'error', text: 'Could not determine your user ID.' });
        return;
      }

      const dorm = await createDorm({ name: nameTrimmed }, localUserId);

      if (dorm.created_by !== localUserId) {
        console.warn('Dorm created_by does not match local user ID!', { dorm, localUserId });
        setNotice({
          type: 'error',
          text: 'Dorm creation failed due to account mismatch. Please try again.',
        });
        return;
      }

      await joinDorm(localUserId, dorm.join_code);
      await setActiveDormId(dorm.id);

      router.push('/main/student/dorms');
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err.message || 'Failed to create dorm. Please try again.',
      });
    }
  }, [name]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ headerShown: false, gestureEnabled: false, animation: 'slide_from_right' }}
      />

      <View style={styles.topBar}>
        <HeaderBackButton iconName="times" />
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
            <Text style={styles.heading}>New Dorm</Text>

            <Spacer size="small" />

            <Text style={styles.subheading}>
              Give your dorm a name to get started. You can always change it later
            </Text>

            <Spacer size="large" />

            <Text style={styles.inputLabel}>Dorm name</Text>
            <Input value={name} onChangeText={setName} placeholder="e.g. Maple House" />

            <Spacer size="large" />

            <Button title="Create dorm" onPress={handleCreate} variant="standard" />

            {notice && (
              <>
                <Spacer size="medium" />
                <InlineNotification type={notice.type} text={notice.text} />
              </>
            )}

            <Spacer size="large" />

            <Text style={styles.centerText}>
              Changed your mind? <InlineButton title="Go back" onPress={() => router.back()} />
            </Text>

            <Spacer size="large" />
          </View>
        </ScrollView>
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
  subheading: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: COLOURS.gray[500],
    lineHeight: 22,
  },
  inputLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLOURS.black,
    marginBottom: 8,
  },
  centerText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.black,
    textAlign: 'center',
  },
});
