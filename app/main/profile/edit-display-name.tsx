import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { getCurrentUser, updateDisplayName } from '../../../lib/auth';

const GRADIENT_THRESHOLD = 24;

export default function EditDisplayName() {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadDisplayName = async () => {
      try {
        const user = await getCurrentUser();

        if (!user) {
          return;
        }

        setDisplayName(user.displayName ?? '');
      } catch (error) {
        console.error('Failed to load display name:', error);
      }
    };

    loadDisplayName();
  }, []);

  const handleSaveDisplayName = async () => {
    setNotice(null);
    setLoading(true);

    try {
      const user = await getCurrentUser();

      if (!user) {
        setNotice({ type: 'error', text: 'Could not find the current user.' });
        return;
      }

      await updateDisplayName(user.id, displayName);

      setNotice({ type: 'success', text: 'Display name updated successfully.' });

      setTimeout(() => {
        router.back();
      }, 1200);
    } catch (error: any) {
      setNotice({
        type: 'error',
        text: error?.message || 'Something went wrong while updating your display name.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    const headerValue = Math.min(scrollY / GRADIENT_THRESHOLD, 1);
    headerGradientOpacity.setValue(headerValue);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />

      <View style={styles.topBar}>
        <HeaderBackButton iconName="chevron-left" />
      </View>

      <Animated.View
        style={[styles.headerGradientWrapper, { opacity: headerGradientOpacity }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['rgba(134,133,133,0.35)', 'rgba(102,102,102,0)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
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
            <Text style={styles.heading}>Change display name</Text>

            <Spacer size="small" />

            <Text style={styles.body}>
              Enter the display name you’d like to use for your account.
            </Text>

            <Spacer size="large" />

            <Text style={styles.label}>New display name</Text>

            <Input
              value={displayName}
              onChangeText={(val) => {
                setDisplayName(val);
                if (notice?.type === 'error') setNotice(null);
              }}
              placeholder="Example Name"
              hasError={notice?.type === 'error'}
            />

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
            title={loading ? 'Saving...' : 'Save changes'}
            onPress={handleSaveDisplayName}
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
    backgroundColor: COLOURS.white,
  },
  headerGradientWrapper: {
    height: 6,
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
  label: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    marginBottom: 8,
    color: COLOURS.black,
  },
  footer: {
    padding: 20,
    backgroundColor: COLOURS.white,
  },
});
