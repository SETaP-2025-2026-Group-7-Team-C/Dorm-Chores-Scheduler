import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
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
import AvailabilityBadge from '../../../components/AvailabilityBadge';
import BlockButton from '../../../components/BlockButton';
import InfoPanel from '../../../components/InfoPanel';
import InlineButton from '../../../components/InlineButton';
import InlineNotification from '../../../components/InlineNotification';
import ListItem from '../../../components/ListItem';
import NavBar, { NavBarItem } from '../../../components/Navbar';
import ProfilePicture from '../../../components/ProfilePicture';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { getUserCompletionHistory, getWeeklyChoreSummary } from '../../../lib/analytics';
import { getChores } from '../../../lib/chores';
import { getActiveDormId } from '../../../lib/dorms';
import { runDailyChoreRemindersForDorm } from '../../../lib/reminders';
import { getRepairRequestsByReporter } from '../../../lib/repairs';
import { generateWeeklyAssignments } from '../../../lib/scheduler';
import { supabase } from '../../../lib/supabase';

const NAV_ITEMS: NavBarItem[] = [
  {
    key: 'home',
    label: 'Home',
    iconName: 'home',
    onPress: () => router.push('/main/student/home'),
  },
  {
    key: 'chores',
    label: 'Chores',
    iconName: 'broom',
    onPress: () => router.push('/main/student/chores'),
  },
  {
    key: 'repairs',
    label: 'Repairs',
    iconName: 'tools',
    onPress: () => router.push('/main/student/repairs'),
  },
  {
    key: 'dorms',
    label: 'Dorms',
    iconName: 'bed',
    onPress: () => router.push('/main/student/dorms'),
  },
];

const GRADIENT_THRESHOLD = 24;

dayjs.extend(relativeTime);

type IconName = keyof typeof FontAwesome5.glyphMap;

type RepairSummary = {
  id: string;
  title: string;
  subtitle: string;
  iconName: IconName;
  status: {
    label: string;
    backgroundColor: string;
    textColor: string;
  };
};

export type TaskSummary = {
  id: string;
  title: string;
  subtitle: string;
  iconName: IconName;
  overdue: boolean;
};

type WeekChoreStats = {
  total: number;
  completedRate: number;
  overdue: number;
};

export default function Home() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [todayTasks, setTodayTasks] = useState<TaskSummary[]>([]);
  const [openRepairs, setOpenRepairs] = useState<RepairSummary[]>([]);
  const [weekStats, setWeekStats] = useState<WeekChoreStats>({
    total: 0,
    completedRate: 0,
    overdue: 0,
  });
  const [topPerformer, setTopPerformer] = useState<{ name: string; completed: number } | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const [contentOverflows, setContentOverflows] = useState(false);
  const scrollViewHeight = useRef(0);
  const contentHeight = useRef(0);

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;
  const navGradientOpacity = useRef(new Animated.Value(0)).current;

  const toSentenceCase = (value: string, fallback: string) => {
    const normalized = String(value || '')
      .replace(/_/g, ' ')
      .trim()
      .toLowerCase();

    if (!normalized) return fallback;
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const getRepairStatusChip = (status: string) => {
    const normalized = String(status || 'pending').toLowerCase();

    if (normalized === 'in_progress') {
      return {
        label: 'In progress',
        backgroundColor: COLOURS.warning.background,
        textColor: COLOURS.warning.text,
      };
    }

    if (normalized === 'completed' || normalized === 'resolved') {
      return {
        label: 'Resolved',
        backgroundColor: COLOURS.success.background,
        textColor: COLOURS.success.text,
      };
    }

    if (normalized === 'rejected') {
      return {
        label: 'Rejected',
        backgroundColor: COLOURS.error.background,
        textColor: COLOURS.error.text,
      };
    }

    return {
      label: 'Pending',
      backgroundColor: COLOURS.info.background,
      textColor: COLOURS.info.text,
    };
  };

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const activeDormId = await getActiveDormId();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      if (!activeDormId) {
        router.replace('/main/student/dorms');
        return;
      }

      if (currentUserId) {
        await generateWeeklyAssignments(activeDormId, currentUserId).catch((error) =>
          console.warn('Weekly scheduler run failed', error),
        );
        await runDailyChoreRemindersForDorm(activeDormId).catch((error) =>
          console.warn('Daily reminder run failed', error),
        );
      }

      const data = await getChores(activeDormId);
      const weeklySummary = await getWeeklyChoreSummary(activeDormId);
      setWeekStats({
        total: weeklySummary.total,
        completedRate: weeklySummary.completionRate,
        overdue: weeklySummary.pending,
      });
      const completionHistory = await getUserCompletionHistory(activeDormId);
      const best = completionHistory[0];
      setTopPerformer(
        best
          ? {
              name: best.displayName || 'Dorm member',
              completed: best.completedCount,
            }
          : null,
      );

      if (currentUserId) {
        const repairs = (await getRepairRequestsByReporter(currentUserId)) || [];
        const openRepairsForDorm = repairs
          .filter(
            (r: any) =>
              r.dorm_id === activeDormId && String(r.status || '').toLowerCase() !== 'completed',
          )
          .slice(0, 3)
          .map((r: any) => {
            const createdAt = r.created_at ? dayjs(r.created_at) : null;
            const createdAtText = createdAt ? createdAt.fromNow() : 'recently';
            const locationLabel = toSentenceCase(String(r.location || ''), 'Unknown location');

            return {
              id: r.id,
              title: r.title || 'Untitled repair request',
              subtitle: `${locationLabel} - Reported ${createdAtText}`,
              iconName: 'wrench' as IconName,
              status: getRepairStatusChip(String(r.status || 'pending')),
            };
          });

        setOpenRepairs(openRepairsForDorm);
      } else {
        setOpenRepairs([]);
      }

      const mappedData = data
        .filter((c) => c.status !== 'completed')
        .map((c) => {
          const isMe = currentUserId && c.meta?.assignedTo === currentUserId;
          const name = isMe ? 'You' : c.assignedName || 'Unknown User';

          let dueDate = dayjs(c.created_at).add(c.meta?.due_in_days || 7, 'day');

          const text = `${name} - Due ${dueDate.fromNow()}`;

          return {
            id: c.id,
            title: c.title,
            subtitle: text,
            iconName: 'broom' as IconName,
            overdue: false,
          };
        })
        .slice(0, 5);
      setTodayTasks(mappedData);
    } catch (error) {
      console.warn('Failed to load tasks', error);
      setOpenRepairs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, []),
  );

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
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

  const checkOverflow = () => {
    if (!scrollViewHeight.current || !contentHeight.current) return;

    const overflows = contentHeight.current > scrollViewHeight.current + 1;
    setContentOverflows(overflows);

    if (!overflows) {
      navGradientOpacity.setValue(0);
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollY = contentOffset.y;

    const headerValue = Math.min(scrollY / GRADIENT_THRESHOLD, 1);
    headerGradientOpacity.setValue(headerValue);

    if (contentHeight.current > scrollViewHeight.current) {
      const distanceFromBottom = contentSize.height - layoutMeasurement.height - scrollY;
      const value = distanceFromBottom < GRADIENT_THRESHOLD ? 0 : 1;
      navGradientOpacity.setValue(value);
    }
  };

  const items: NavBarItem[] = NAV_ITEMS.map((item) => ({
    ...item,
  }));

  const noChores = todayTasks.length === 0;
  const noRepairs = openRepairs.length === 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />

      {/* Static header */}
      <View style={styles.topBar}>
        <ProfilePicture variant="small" onPress={() => router.push('/main/profile')} />
        <AvailabilityBadge isAvailable={isAvailable} onChange={setIsAvailable} />
      </View>

      {/* Header bottom shadow - fades in once user scrolls */}
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

      {/* Scrollable content */}
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
            <View style={styles.titleRow}>
              <Text style={styles.title}>Today</Text>
              <InlineNotification
                type="info"
                text="Showing top 5 due tasks"
                style={styles.inlineNotification}
              />
            </View>

            <Spacer size="medium" />

            {isLoading ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 50,
                  marginBottom: 50,
                }}
              >
                <ActivityIndicator size="large" color={COLOURS.black} />
              </View>
            ) : noChores ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrapper}>
                  <FontAwesome5 name="check" size={40} color={COLOURS.black} />
                </View>
                <Text style={styles.emptyTitle}>All chores complete</Text>
                <Text style={styles.emptySubtitle}>
                  Something need doing?{' '}
                  <InlineButton
                    title="Create new chore"
                    onPress={() => router.push('/main/student/create-chore')}
                  />
                </Text>
              </View>
            ) : (
              <View>
                {todayTasks.map((task, index) => (
                  <View key={task.id}>
                    <ListItem
                      title={task.title}
                      subtitle={task.subtitle}
                      iconName={task.iconName}
                      onPress={() => router.push(`/main/student/view-chore?id=${task.id}`)}
                      statusChip={
                        task.overdue
                          ? {
                              label: 'Overdue',
                              backgroundColor: '#FFE9EA',
                              textColor: '#B70000',
                            }
                          : undefined
                      }
                    />
                    {index < todayTasks.length - 1 ? <Spacer size="small" /> : null}
                  </View>
                ))}
              </View>
            )}

            <View style={[styles.inlineAction, styles.inlineActionLarge]}>
              <InlineButton
                title="View all chores"
                onPress={() => router.push('/main/student/chores')}
              />
            </View>

            <Spacer size="large" />

            <Text style={styles.title}>This week</Text>
            <Spacer size="small" />
            <View style={styles.infoPanelGrid}>
              <InfoPanel label="Total chores" value={String(weekStats.total)} />
              <InfoPanel label="Completed" value={`${weekStats.completedRate}%`} />
              <InfoPanel label="Overdue" value={String(weekStats.overdue)} />
              <InfoPanel label="Open repairs" value={String(openRepairs.length)} />
            </View>
            {topPerformer ? (
              <>
                <Spacer size="small" />
                <InlineNotification
                  type="tip"
                  text={`Top completion record: ${topPerformer.name} (${topPerformer.completed} completed)`}
                  style={styles.inlineNotification}
                />
              </>
            ) : null}

            <Spacer size="large" />

            <View style={styles.titleRow}>
              <Text style={styles.title}>Open repairs</Text>
              <InlineNotification
                type="info"
                text="Showing max 3"
                style={styles.inlineNotification}
              />
            </View>

            <Spacer size="medium" />

            {noRepairs ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No repairs found</Text>
                <Text style={styles.emptySubtitle}>
                  Something need repaired?{' '}
                  <InlineButton
                    title="Request repair"
                    onPress={() => router.push('/main/student/request-repair')}
                  />
                </Text>
              </View>
            ) : (
              <View>
                {openRepairs.map((repair, index) => (
                  <View key={repair.id}>
                    <ListItem
                      title={repair.title}
                      subtitle={repair.subtitle}
                      iconName={repair.iconName}
                      onPress={() => router.push(`/main/student/view-repair?id=${repair.id}`)}
                      statusChip={repair.status}
                    />
                    {index < openRepairs.length - 1 ? <Spacer size="small" /> : null}
                  </View>
                ))}
              </View>
            )}

            <View style={[styles.inlineAction, styles.inlineActionLarge]}>
              <InlineButton
                title="View all repairs"
                onPress={() => router.push('/main/student/repairs')}
              />
            </View>

            <Spacer size="large" />

            <Text style={styles.title}>Quick actions</Text>
            <Spacer size="small" />
            <View style={styles.quickActionsRow}>
              <BlockButton
                title="Create Chore"
                iconName="plus"
                onPress={() => router.push('/main/student/create-chore')}
              />
              <BlockButton
                title="Request Repair"
                iconName="wrench"
                onPress={() => router.push('/main/student/request-repair')}
              />
            </View>
            <Spacer size="small" />
            <View style={styles.quickActionsRow}>
              <BlockButton
                title="Templates"
                iconName="copy"
                onPress={() => router.push('/main/student/chore-templates')}
              />
              <BlockButton
                title="Opt-Outs"
                iconName="user-times"
                onPress={() => router.push('/main/student/chore-opt-outs')}
              />
            </View>

            <Spacer size="small" />
            <View style={styles.quickActionsRow}>
              <BlockButton
                title="Analytics"
                iconName="chart-bar"
                onPress={() => router.push('/main/student/chore-analytics')}
              />
              {/* AUDIT LOGS BUTTON ADDED HERE */}
              <BlockButton
                title="Audit Logs"
                iconName="history"
                onPress={() => router.push('/main/student/audit-logs')}
              />
            </View>

            <Spacer size="large" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* White panel behind navbar to prevent see-through */}
      <View style={styles.navBarBackground} pointerEvents="none" />

      {/* Navbar top shadow - visible when content overflows, hides at bottom */}
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

      {/* Static navbar */}
      <NavBar
        items={items as [NavBarItem, NavBarItem, ...NavBarItem[]]}
        activeKey={'home'}
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
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLOURS.black,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inlineNotification: {
    flexShrink: 1,
    flexGrow: 0,
  },
  inlineAction: {
    marginTop: 8,
    alignItems: 'center',
  },
  inlineActionLarge: {
    marginTop: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoPanelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIconWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 8,
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLOURS.black,
    textAlign: 'center',
  },
  emptySubtitle: {
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
