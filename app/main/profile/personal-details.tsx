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

import ListItem from '@/components/ListItem';
import HeaderBackButton from '../../../components/HeaderBackButton';
import Spacer from '../../../components/Spacer';

import { COLOURS } from '../../../constants/colours';
import { getCurrentUser } from '../../../lib/auth';

const GRADIENT_THRESHOLD = 24;

export default function PersonalDetails() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

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
    const loadPersonalDetails = async () => {
      try {
        const user = await getCurrentUser();

        if (!user) {
          return;
        }

        setEmail(user.email ?? '');
        setDisplayName(user.displayName ?? '');
      } catch (error) {
        console.error('Failed to load personal details:', error);
      }
    };

    loadPersonalDetails();
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = e.nativeEvent;
    const scrollY = contentOffset.y;

    const headerValue = Math.min(scrollY / GRADIENT_THRESHOLD, 1);
    headerGradientOpacity.setValue(headerValue);
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
            <Text style={styles.heading}>Personal details</Text>

            <Spacer size="small" />

            <ListItem
              title="Display name"
              subtitle={displayName || 'Loading...'}
              iconName="signature"
              onPress={() => router.push('/main/profile/edit-display-name')}
            />

            <Spacer size="small" />

            <ListItem
              title="Email address"
              subtitle={email || 'Loading...'}
              iconName="envelope"
              onPress={() => router.push('/main/profile/edit-email')}
            />

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
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: COLOURS.black,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.gray[700],
    lineHeight: 24,
  },
});
