import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
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

import { getCurrentUser } from '../../../lib/auth';
import { getNotificationSettings, updateNotificationSettings } from '../../../lib/notifications';

import HeaderBackButton from '../../../components/HeaderBackButton';
import Spacer from '../../../components/Spacer';
import ToggleItem from '../../../components/ToggleItem';

import { COLOURS } from '../../../constants/colours';
import type { PreferenceKey } from '../../../lib/inAppNotifications';

const GRADIENT_THRESHOLD = 24;
const ALL_NOTIFICATIONS_KEY = 'all_notifications';

type NotificationItem = {
  id: PreferenceKey;
  label: string;
  iconName: keyof typeof FontAwesome5.glyphMap;
};

export default function Notifications() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;

  const STUDENT_NOTIFICATIONS: NotificationItem[] = [
    { id: 'new_chore_assignment', label: 'New chore assignment', iconName: 'clipboard-list' },
    { id: 'chore_due_soon', label: 'Chore due soon', iconName: 'clock' },
    { id: 'chore_overdue', label: 'Chore overdue', iconName: 'exclamation-circle' },
    { id: 'chore_completed', label: 'Chore completed', iconName: 'check-circle' },
    { id: 'repair_status_updated', label: 'Repair request status updated', iconName: 'tools' },
    { id: 'repair_comment', label: 'New comment on repair request', iconName: 'comment-alt' },
    { id: 'daily_chore_reminder', label: 'Daily chore reminder', iconName: 'bell' },
    {
      id: 'weekly_schedule_generated',
      label: 'Weekly chore schedule generated',
      iconName: 'calendar-alt',
    },
    { id: 'system_announcement', label: 'System announcement', iconName: 'bullhorn' },
    { id: 'account_activity_update', label: 'Account activity update', iconName: 'user-circle' },
  ];

  const MANAGER_NOTIFICATIONS: NotificationItem[] = [
    { id: 'new_repair_request', label: 'New repair request submitted', iconName: 'tools' },
    { id: 'repair_status_updated', label: 'Repair request status updated', iconName: 'sync-alt' },
    { id: 'repair_comment', label: 'New comment on repair request', iconName: 'comment-alt' },
    { id: 'chore_completed', label: 'Chore completed', iconName: 'check-circle' },
    { id: 'system_announcement', label: 'System announcement', iconName: 'bullhorn' },
    { id: 'account_activity_update', label: 'Account activity update', iconName: 'user-circle' },
  ];

  const notificationsToShow = isManager ? MANAGER_NOTIFICATIONS : STUDENT_NOTIFICATIONS;
  const allEnabled = toggleStates[ALL_NOTIFICATIONS_KEY] ?? true;

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await getCurrentUser();

        if (!user) {
          return;
        }

        setUserId(user.id);
        setIsManager(user.role === 'manager');

        const preferences = await getNotificationSettings(user.id);

        setToggleStates({
          [ALL_NOTIFICATIONS_KEY]: preferences[ALL_NOTIFICATIONS_KEY] ?? true,
          ...preferences,
        });
      } catch (error) {
        console.log('Error loading notification settings:', error);
      }
    };

    loadData();
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
    const scrollY = e.nativeEvent.contentOffset.y;
    const headerValue = Math.min(scrollY / GRADIENT_THRESHOLD, 1);
    headerGradientOpacity.setValue(headerValue);
  };

  const toggleAllNotifications = async () => {
    const updated = {
      ...toggleStates,
      [ALL_NOTIFICATIONS_KEY]: !allEnabled,
    };

    setToggleStates(updated);

    if (!userId) return;

    try {
      await updateNotificationSettings(userId, updated);
    } catch (err) {
      console.log('Error saving global notification preference:', err);
    }
  };

  const toggleNotification = async (key: PreferenceKey) => {
    const updated = {
      ...toggleStates,
      [key]: !(toggleStates[key] ?? true),
    };

    setToggleStates(updated);

    if (!userId) return;

    try {
      await updateNotificationSettings(userId, updated);
    } catch (err) {
      console.log('Error saving notification preferences:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

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
            <Text style={styles.heading}>Notifications</Text>

            <Spacer size="small" />

            <Text style={styles.body}>Manage how and when you receive notifications.</Text>

            <Spacer size="large" />

            <ToggleItem
              title="Allow all notifications"
              iconName="bell"
              value={allEnabled}
              onValueChange={toggleAllNotifications}
            />

            <Spacer size="medium" />

            {notificationsToShow.map((item, index) => (
              <View key={item.id}>
                <ToggleItem
                  title={item.label}
                  iconName={item.iconName}
                  value={toggleStates[item.id] ?? true}
                  onValueChange={() => toggleNotification(item.id)}
                  disabled={!allEnabled}
                />
                {index < notificationsToShow.length - 1 ? <Spacer size="small" /> : null}
              </View>
            ))}

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
});
