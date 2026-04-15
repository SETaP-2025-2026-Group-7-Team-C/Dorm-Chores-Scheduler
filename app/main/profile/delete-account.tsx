import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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
import Spacer from '../../../components/Spacer';

import { COLOURS } from '../../../constants/colours';
import { getCurrentUser, signOutUser, softDeleteCurrentUser } from '../../../lib/auth';

const GRADIENT_THRESHOLD = 24;

export default function DeleteAccount() {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    const headerValue = Math.min(scrollY / GRADIENT_THRESHOLD, 1);
    headerGradientOpacity.setValue(headerValue);
  };

  const confirmDelete = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    try {
      const user = await getCurrentUser();

      if (!user) {
        setNotice({ type: 'error', text: 'Could not find the current user.' });
        return;
      }

      await softDeleteCurrentUser(user.id);
      await signOutUser();

      setNotice({
        type: 'success',
        text: 'Your account has been deactivated successfully.',
      });

      setTimeout(() => {
        router.replace('/auth/signin');
      }, 1200);
    } catch (error: any) {
      setNotice({
        type: 'error',
        text: error?.message || 'Something went wrong while processing your request.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete account', 'This will deactivate your account and sign you out.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: confirmDelete,
      },
    ]);
  }, [confirmDelete]);

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          <Text style={styles.heading}>Delete account</Text>

          <Spacer size="small" />

          <Text style={styles.body}>
            Deleting your account will deactivate your profile and sign you out of the app.
          </Text>

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
          title={loading ? 'Processing...' : 'Delete account'}
          onPress={handleDelete}
          variant="danger"
          disabled={loading}
        />

        <Spacer size="large" />
      </View>
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
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    paddingTop: 12,
    backgroundColor: COLOURS.white,
  },
});
