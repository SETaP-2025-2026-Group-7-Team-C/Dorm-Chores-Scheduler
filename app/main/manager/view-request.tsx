import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { getRepairRequestById, updateRepairStatus } from '../../../lib/repairs';

const GRADIENT_THRESHOLD = 24;

function toSentenceCase(value: string | undefined | null, fallback: string): string {
  const normalized = String(value || '')
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase();
  if (!normalized) return fallback;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

type RepairDetail = {
  id: string;
  title: string;
  description: string;
  location: string;
  urgency: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'resolved';
  created_at?: string;
};

export default function ViewRequest() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [repair, setRepair] = useState<RepairDetail | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'in_progress' | 'resolved'>(
    'pending',
  );
  const [notice, setNotice] = useState<{
    type: 'error' | 'success' | 'info' | 'warning' | 'tip';
    text: string;
  } | null>(null);

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadRepair = async () => {
      const requestId = Array.isArray(id) ? id[0] : id;
      if (!requestId) {
        setNotice({ type: 'error', text: 'Repair request ID is missing' });
        setIsLoading(false);
        return;
      }

      try {
        const data = await getRepairRequestById(requestId);
        if (!data) {
          setNotice({ type: 'error', text: 'Repair request not found' });
          setRepair(null);
          return;
        }

        const loaded = data as RepairDetail;
        setRepair(loaded);
        if (
          loaded.status === 'pending' ||
          loaded.status === 'in_progress' ||
          loaded.status === 'completed' ||
          loaded.status === 'resolved'
        ) {
          setCurrentStatus(loaded.status === 'completed' ? 'resolved' : loaded.status);
        }
      } catch (e: any) {
        setNotice({ type: 'error', text: e?.message || 'Failed to load repair request' });
      } finally {
        setIsLoading(false);
      }
    };

    loadRepair();
  }, [id]);

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

  const handleUpdateStatus = useCallback(
    async (newStatus: 'in_progress' | 'resolved') => {
      const requestId = Array.isArray(id) ? id[0] : id;
      if (!requestId) {
        setNotice({ type: 'error', text: 'Repair request ID is missing' });
        return;
      }

      try {
        setNotice(null);
        await updateRepairStatus(requestId, newStatus);
        setCurrentStatus(newStatus);
        setRepair((prev) => (prev ? { ...prev, status: newStatus } : prev));
      } catch (e: any) {
        setNotice({ type: 'error', text: e?.message || 'Failed to update request status' });
      }
    },
    [id],
  );

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
            {isLoading ? (
              <ActivityIndicator size="large" color={COLOURS.black} />
            ) : !repair ? (
              <>
                <Text style={styles.heading}>Repair request</Text>
                <Spacer size="medium" />
                <InlineNotification
                  type="error"
                  text={notice?.text || 'Repair request is unavailable'}
                />
              </>
            ) : (
              <>
                <Text style={styles.heading}>{repair.title}</Text>

                <Spacer size="small" />

                <Text style={styles.subheading}>
                  Reported on{' '}
                  {repair.created_at
                    ? new Date(repair.created_at).toLocaleDateString('en-GB')
                    : 'Unknown date'}
                </Text>

                <Spacer size="large" />

                <Text style={styles.fieldLabel}>Description</Text>
                <Text style={styles.fieldValue}>
                  {repair.description || 'No description provided'}
                </Text>
                <Spacer size="medium" />
                <Spacer size="small" />

                <Text style={styles.fieldLabel}>Location</Text>
                <Text style={styles.fieldValue}>
                  {toSentenceCase(repair.location, 'Unknown location')}
                </Text>

                <Spacer size="medium" />

                <Text style={styles.fieldLabel}>Priority</Text>
                <Text style={styles.fieldValue}>{toSentenceCase(repair.urgency, 'Low')}</Text>

                <Spacer size="medium" />

                <Text style={styles.fieldLabel}>Current Status</Text>
                <Text style={styles.fieldValue}>{toSentenceCase(currentStatus, 'Pending')}</Text>

                <Spacer size="large" />

                <View style={styles.divider} />

                <Spacer size="large" />

                <Text style={styles.inputLabel}>Manage Request</Text>

                <Spacer size="small" />

                <Text style={styles.subheading}>
                  Update the status of this repair request to keep the residents informed of its
                  progress.
                </Text>

                <Spacer size="medium" />

                {currentStatus === 'pending' && (
                  <>
                    <Button
                      title="Mark as In Progress"
                      onPress={() => handleUpdateStatus('in_progress')}
                      variant="secondary"
                    />
                    <Spacer size="medium" />
                  </>
                )}

                {currentStatus !== 'resolved' ? (
                  <Button title="Mark as Resolved" onPress={() => handleUpdateStatus('resolved')} />
                ) : (
                  <InlineNotification type="success" text="This request has been resolved" />
                )}
              </>
            )}

            {notice && (
              <>
                <Spacer size="medium" />
                <InlineNotification type={notice.type} text={notice.text} />
              </>
            )}

            <Spacer size="large" />

            <Text style={styles.centerText}>
              Done here? <InlineButton title="Go back" onPress={() => router.back()} />
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
  fieldLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLOURS.black,
    marginBottom: 4,
  },
  fieldValue: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: COLOURS.gray[700],
    lineHeight: 22,
  },
  inputLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLOURS.black,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLOURS.gray[200],
  },
  centerText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.black,
    textAlign: 'center',
  },
});
