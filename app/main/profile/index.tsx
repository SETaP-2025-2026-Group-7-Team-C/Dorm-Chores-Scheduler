import Constants from 'expo-constants';
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

import HeaderBackButton from '../../../components/HeaderBackButton';
import ListItem from '../../../components/ListItem';
import ProfilePicture from '../../../components/ProfilePicture';
import Spacer from '../../../components/Spacer';

import { COLOURS } from '../../../constants/colours';
import { getCurrentUser, signOutUser } from '../../../lib/auth';

const GRADIENT_THRESHOLD = 24;

export default function Profile() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [accountType, setAccountType] = useState('');

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
    const loadProfile = async () => {
      try {
        const user = await getCurrentUser();

        if (!user) {
          return;
        }

        setDisplayName(user.displayName ?? 'User');
        setAccountType(user.role === 'manager' ? 'Manager Account' : 'Student Account');
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    loadProfile();
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
            <Spacer size="large" />

            <View style={styles.profileSection}>
              <ProfilePicture variant="large" />
              <Spacer size="medium" />
              <Text style={styles.heading}>{displayName || 'Loading...'}</Text>
              <Text style={styles.accountType}>{accountType || 'Loading...'}</Text>
            </View>

            <Spacer size="large" />

            <Text style={styles.sectionTitle}>Settings</Text>
            <Spacer size="small" />

            <ListItem
              title="Personal details"
              subtitle="Update your account details"
              iconName="user-circle"
              onPress={() => router.push('/main/profile/personal-details')}
            />
            <ListItem
              title="Notifications"
              subtitle="Customise the notifications you receive"
              iconName="bell"
              onPress={() => router.push('/main/profile/notifications')}
            />
            <ListItem
              title="Security"
              subtitle="Manage your account security"
              iconName="shield-alt"
              onPress={() => router.push('/main/profile/security')}
            />

            <Spacer size="large" />

            <Text style={styles.sectionTitle}>Actions</Text>
            <Spacer size="small" />

            <ListItem
              title="Delete account"
              subtitle="Close your account and delete all data"
              iconName="times-circle"
              onPress={() => router.push('/main/profile/delete-account')}
            />
            <ListItem
              title="Logout"
              subtitle="Sign out of your account"
              iconName="sign-out-alt"
              onPress={async () => {
                try {
                  await signOutUser();
                  router.replace('/auth/signin');
                } catch (error) {
                  console.error('Failed to log out:', error);
                }
              }}
            />

            <Spacer size="large" />

            <Text style={styles.versionHeading}>Your app version</Text>
            <Spacer size="small" />
            <Text style={styles.body}>
              v{Constants.expoConfig?.version || '1.0.0'} (
              {Platform.OS === 'ios'
                ? Constants.expoConfig?.ios?.buildNumber || '1'
                : Constants.expoConfig?.android?.versionCode || '1'}
              )
            </Text>
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
  profileSection: {
    alignItems: 'center',
  },
  heading: {
    fontFamily: 'Inter-Black',
    fontSize: 28,
    color: COLOURS.black,
    textAlign: 'center',
  },
  accountType: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLOURS.black,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: COLOURS.black,
  },
  versionHeading: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLOURS.black,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.gray[700],
    lineHeight: 24,
  },
});
