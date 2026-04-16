import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useFocusEffect } from 'expo-router';
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

import { FontAwesome5 } from '@expo/vector-icons';
import ActionPillButton from '../../../components/ActionPillButton';
import AvailabilityBadge from '../../../components/AvailabilityBadge';
import DormCard from '../../../components/DormCard';
import InlineNotification from '../../../components/InlineNotification';
import NavBar, { NavBarItem } from '../../../components/Navbar';
import ProfilePicture from '../../../components/ProfilePicture';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { getCurrentUser } from '../../../lib/auth';
import { getDormsByManager, leaveDormAsManager } from '../../../lib/dorms';
import { supabase } from '../../../lib/supabase';

const NAV_ITEMS: NavBarItem[] = [
  {
    key: 'home',
    label: 'Home',
    iconName: 'home',
    onPress: () => router.push('/main/manager/dashboard'),
  },
  {
    key: 'requests',
    label: 'Requests',
    iconName: 'wrench',
    onPress: () => router.push('/main/manager/requests'),
  },
  {
    key: 'dorms',
    label: 'Dorms',
    iconName: 'building',
    onPress: () => router.push('/main/manager/dorms'),
  },
];

const GRADIENT_THRESHOLD = 24;

type ManagedDorm = {
  id: string;
  title: string;
  subtitle: string;
  stats: { value: number; label: string }[];
};

export default function ManagerDorms() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [confirmingLeaveId, setConfirmingLeaveId] = useState<string | null>(null);
  const [leavingDormId, setLeavingDormId] = useState<string | null>(null);
  const [managedDorms, setManagedDorms] = useState<ManagedDorm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<{
    type: 'error' | 'success' | 'info' | 'warning' | 'tip';
    text: string;
  } | null>(null);

  const [contentOverflows, setContentOverflows] = useState(false);
  const scrollViewHeight = useRef(0);
  const contentHeight = useRef(0);

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;
  const navGradientOpacity = useRef(new Animated.Value(0)).current;

  const loadManagedDorms = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user?.id) {
        setManagedDorms([]);
        return;
      }

      const dorms = await getDormsByManager(user.id);

      const mapped = await Promise.all(
        dorms.map(async (dorm) => {
          const [openRepairs, closedRepairs] = await Promise.all([
            supabase
              .from('repair_requests')
              .select('id', { count: 'exact', head: true })
              .eq('dorm_id', dorm.id)
              .in('status', ['pending', 'in_progress']),
            supabase
              .from('repair_requests')
              .select('id', { count: 'exact', head: true })
              .eq('dorm_id', dorm.id)
              .in('status', ['completed', 'rejected']),
          ]);

          const created = new Date(dorm.created_at);
          const dateStr = `${created.getDate().toString().padStart(2, '0')}/${(
            created.getMonth() + 1
          )
            .toString()
            .padStart(2, '0')}/${created.getFullYear()}`;

          return {
            id: dorm.id,
            title: dorm.name,
            subtitle: `Linked ${dateStr}`,
            stats: [
              { value: openRepairs.count || 0, label: 'Open repairs' },
              { value: closedRepairs.count || 0, label: 'Closed repairs' },
            ],
          };
        }),
      );

      setManagedDorms(mapped);
    } catch (error) {
      console.warn('Failed to load managed dorms', error);
      setManagedDorms([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadManagedDorms();
    }, [loadManagedDorms]),
  );

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (confirmingLeaveId) {
        setConfirmingLeaveId(null);
        return true;
      }
      return true;
    });
    return () => backHandler.remove();
  }, [confirmingLeaveId]);

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const checkOverflow = () => {
    if (!scrollViewHeight.current || !contentHeight.current) return;
    const overflows = contentHeight.current > scrollViewHeight.current + 1;
    setContentOverflows(overflows);
    if (!overflows) navGradientOpacity.setValue(0);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollY = contentOffset.y;
    const headerValue = Math.min(scrollY / GRADIENT_THRESHOLD, 1);
    headerGradientOpacity.setValue(headerValue);
    if (contentHeight.current > scrollViewHeight.current) {
      const distanceFromBottom = contentSize.height - layoutMeasurement.height - scrollY;
      navGradientOpacity.setValue(distanceFromBottom < GRADIENT_THRESHOLD ? 0 : 1);
    }
  };

  const handleLeaveConfirmed = async (id: string) => {
    if (leavingDormId) return;

    setNotice(null);
    setLeavingDormId(id);
    setConfirmingLeaveId(null);

    try {
      const user = await getCurrentUser();
      if (!user?.id) {
        throw new Error('You must be signed in to leave a dorm');
      }

      await leaveDormAsManager(user.id, id);
      await loadManagedDorms();
      setNotice({ type: 'success', text: 'Dorm left successfully.' });
    } catch (error: any) {
      setNotice({ type: 'error', text: error?.message || 'Failed to leave dorm.' });
    } finally {
      setLeavingDormId(null);
    }
  };

  const items: NavBarItem[] = NAV_ITEMS.map((item) => ({ ...item }));
  const isEmpty = managedDorms.length === 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />

      <View style={styles.topBar}>
        <ProfilePicture variant="small" onPress={() => router.push('/main/profile')} />
        <AvailabilityBadge isAvailable={isAvailable} onChange={setIsAvailable} />
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
          onLayout={(e) => {
            scrollViewHeight.current = e.nativeEvent.layout.height;
            requestAnimationFrame(checkOverflow);
          }}
          onContentSizeChange={(_, h) => {
            contentHeight.current = h;
            requestAnimationFrame(checkOverflow);
          }}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Dorms</Text>
            {notice ? (
              <>
                <Spacer size="small" />
                <InlineNotification type={notice.type} text={notice.text} />
              </>
            ) : null}

            {isLoading ? (
              <View
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}
              >
                <ActivityIndicator size="large" color={COLOURS.black} />
              </View>
            ) : isEmpty ? (
              <>
                <Spacer size="large" />
                <View style={styles.noneFound}>
                  <View style={styles.iconWrapper}>
                    <FontAwesome5 name="building" size={40} color={COLOURS.black} />
                  </View>
                  <Text style={styles.noneFoundTitle}>No dorms yet</Text>
                  <Text style={styles.noneFoundSubtitle}>
                    Dorms will appear here once tenants connect them to your account
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.table}>
                {managedDorms.map((dorm) => {
                  const isConfirming = confirmingLeaveId === dorm.id;
                  const isLeaving = leavingDormId === dorm.id;
                  return (
                    <View key={dorm.id} style={styles.tableRow}>
                      <DormCard
                        title={dorm.title}
                        subtitle={dorm.subtitle}
                        stats={dorm.stats}
                        primaryAction={
                          isConfirming
                            ? {
                                label: isLeaving ? 'Leaving...' : 'Yes, leave dorm',
                                onPress: () => handleLeaveConfirmed(dorm.id),
                                variant: 'danger',
                              }
                            : {
                                label: isLeaving ? 'Leaving...' : 'Leave dorm',
                                onPress: isLeaving
                                  ? () => undefined
                                  : () => {
                                      setNotice(null);
                                      setConfirmingLeaveId(dorm.id);
                                    },
                                variant: 'secondary',
                              }
                        }
                      />
                      {isConfirming && (
                        <>
                          <Spacer size="small" />
                          <Text style={styles.confirmHint}>
                            Are you sure? You will stop receiving repair requests from this dorm
                          </Text>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.pillButtonWrapper}>
        <ActionPillButton
          title="Add Dorm"
          iconName="plus"
          onPress={() => router.push('/main/manager/add-dorm')}
        />
      </View>

      <View style={styles.navBarBackground} pointerEvents="none" />

      {contentOverflows && (
        <Animated.View
          style={[styles.navGradientWrapper, { opacity: navGradientOpacity }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['rgba(102, 102, 102, 0)', 'rgba(134, 134, 133, 0.35)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      <NavBar
        items={items as [NavBarItem, NavBarItem, ...NavBarItem[]]}
        activeKey={'dorms'}
        style={styles.navBar}
      />
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
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    marginHorizontal: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLOURS.black,
  },
  table: {
    marginTop: 12,
    gap: 12,
  },
  tableRow: {
    width: '100%',
  },
  confirmHint: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: COLOURS.gray[500],
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  pillButtonWrapper: {
    position: 'absolute',
    right: 16,
    bottom: 112,
    zIndex: 4,
    alignItems: 'flex-end',
  },
  noneFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 40,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noneFoundTitle: {
    marginTop: 8,
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLOURS.black,
    textAlign: 'center',
  },
  noneFoundSubtitle: {
    marginTop: 4,
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLOURS.gray[700],
    textAlign: 'center',
  },
  navGradientWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 96,
    height: 6,
    zIndex: 3,
  },
  navBarBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 96,
    backgroundColor: COLOURS.white,
    zIndex: 1,
  },
  navBar: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    zIndex: 2,
  },
});
