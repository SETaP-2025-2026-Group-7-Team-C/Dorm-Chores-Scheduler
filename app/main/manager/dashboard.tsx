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
import InfoPanel from '../../../components/InfoPanel';
import InlineButton from '../../../components/InlineButton';
import InlineNotification from '../../../components/InlineNotification';
import ListItem from '../../../components/ListItem';
import NavBar, { NavBarItem } from '../../../components/Navbar';
import ProfilePicture from '../../../components/ProfilePicture';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { getCurrentUser } from '../../../lib/auth';
import { getDormsByManager, getManagerOverview } from '../../../lib/dorms';
import { getRepairRequests } from '../../../lib/repairs';

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

type IconName = keyof typeof FontAwesome5.glyphMap;

type RepairStatus = {
  label: string;
  backgroundColor: string;
  textColor: string;
};

type DashboardRepairItem = {
  id: string;
  title: string;
  subtitle: string;
  iconName: IconName;
  status: RepairStatus;
};

export default function Dashboard() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState({
    openRepairs: 0,
    inProgress: 0,
    resolved: 0,
    dormCount: 0,
  });
  const [priorityRepairs, setPriorityRepairs] = useState<DashboardRepairItem[]>([]);
  const [recentRepairs, setRecentRepairs] = useState<DashboardRepairItem[]>([]);

  const [contentOverflows, setContentOverflows] = useState(false);
  const scrollViewHeight = useRef(0);
  const contentHeight = useRef(0);

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;
  const navGradientOpacity = useRef(new Animated.Value(0)).current;

  const mapIcon = (location: string): IconName => {
    const value = String(location || '').toLowerCase();
    if (value.includes('bath')) return 'bath';
    if (value.includes('kitchen')) return 'utensils';
    if (value.includes('door')) return 'door-open';
    if (value.includes('light')) return 'lightbulb';
    return 'wrench';
  };

  const urgencyChip = (urgency: string): RepairStatus => {
    const normalized = String(urgency || 'low').toLowerCase();
    if (normalized === 'high') {
      return {
        label: 'High',
        backgroundColor: COLOURS.error.background,
        textColor: COLOURS.error.text,
      };
    }
    if (normalized === 'medium') {
      return {
        label: 'Medium',
        backgroundColor: COLOURS.warning.background,
        textColor: COLOURS.warning.text,
      };
    }
    return {
      label: 'Low',
      backgroundColor: COLOURS.info.background,
      textColor: COLOURS.info.text,
    };
  };

  const workflowChip = (status: string): RepairStatus => {
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
    return {
      label: 'Pending',
      backgroundColor: COLOURS.info.background,
      textColor: COLOURS.info.text,
    };
  };

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user?.id) {
        setOverview({ openRepairs: 0, inProgress: 0, resolved: 0, dormCount: 0 });
        setPriorityRepairs([]);
        setRecentRepairs([]);
        return;
      }

      const [overviewStats, dorms] = await Promise.all([
        getManagerOverview(user.id),
        getDormsByManager(user.id),
      ]);

      const requestPairs = await Promise.all(
        dorms.map(async (dorm) => ({
          dormName: dorm.name,
          requests: (await getRepairRequests(dorm.id)) || [],
        })),
      );

      const allRequests = requestPairs.flatMap(({ dormName, requests }) =>
        requests.map((request: any) => ({
          ...request,
          dormName,
        })),
      );

      const sortedByDate = [...allRequests].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      );

      const recent = sortedByDate.slice(0, 5).map((request: any) => ({
        id: request.id,
        title: request.title || 'Untitled repair request',
        subtitle: `${request.dormName} - ${request.created_at ? new Date(request.created_at).toLocaleDateString('en-GB') : 'Unknown date'}`,
        iconName: mapIcon(request.location),
        status: workflowChip(request.status),
      }));

      const urgencyRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const priority = [...sortedByDate]
        .sort((a, b) => {
          const rankDiff =
            (urgencyRank[String(b.urgency || 'low').toLowerCase()] || 0) -
            (urgencyRank[String(a.urgency || 'low').toLowerCase()] || 0);
          if (rankDiff !== 0) return rankDiff;
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        })
        .slice(0, 3)
        .map((request: any) => ({
          id: request.id,
          title: request.title || 'Untitled repair request',
          subtitle: `${request.dormName} - ${request.created_at ? new Date(request.created_at).toLocaleDateString('en-GB') : 'Unknown date'}`,
          iconName: mapIcon(request.location),
          status: urgencyChip(request.urgency),
        }));

      setOverview({
        openRepairs: overviewStats.openRepairs,
        inProgress: allRequests.filter((r: any) => r.status === 'in_progress').length,
        resolved: allRequests.filter((r: any) => r.status === 'completed').length,
        dormCount: overviewStats.dormCount,
      });
      setPriorityRepairs(priority);
      setRecentRepairs(recent);
    } catch (error) {
      console.warn('Failed to load manager dashboard data', error);
      setOverview({ openRepairs: 0, inProgress: 0, resolved: 0, dormCount: 0 });
      setPriorityRepairs([]);
      setRecentRepairs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData]),
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

  const items: NavBarItem[] = NAV_ITEMS.map((item) => ({ ...item }));

  const noPriorityRepairs = priorityRepairs.length === 0;
  const noRecentRepairs = recentRepairs.length === 0;

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
            {/* Overview stats */}
            <Text style={styles.title}>Overview</Text>
            <Spacer size="small" />
            <View style={styles.infoPanelGrid}>
              <InfoPanel label="Open requests" value={String(overview.openRepairs)} />
              <InfoPanel label="In progress" value={String(overview.inProgress)} />
              <InfoPanel label="Resolved" value={String(overview.resolved)} />
              <InfoPanel label="Dorms managed" value={String(overview.dormCount)} />
            </View>

            <Spacer size="large" />

            {/* Priority repairs */}
            <View style={styles.titleRow}>
              <Text style={styles.title}>Needs attention</Text>
              <InlineNotification
                type="info"
                text="Showing top 3"
                style={styles.inlineNotification}
              />
            </View>

            <Spacer size="medium" />

            {isLoading ? (
              <View
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 24 }}
              >
                <ActivityIndicator size="large" color={COLOURS.black} />
              </View>
            ) : noPriorityRepairs ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrapper}>
                  <FontAwesome5 name="check" size={40} color={COLOURS.black} />
                </View>
                <Text style={styles.emptyTitle}>All clear</Text>
                <Text style={styles.emptySubtitle}>
                  No high priority repairs waiting for action
                </Text>
              </View>
            ) : (
              <View>
                {priorityRepairs.map((repair, index) => (
                  <View key={repair.id}>
                    <ListItem
                      title={repair.title}
                      subtitle={repair.subtitle}
                      iconName={repair.iconName}
                      onPress={() => router.push(`/main/manager/view-request?id=${repair.id}`)}
                      statusChip={repair.status}
                    />
                    {index < priorityRepairs.length - 1 ? <Spacer size="small" /> : null}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.inlineAction}>
              <InlineButton
                title="View all requests"
                onPress={() => router.push('/main/manager/requests')}
              />
            </View>

            <Spacer size="large" />

            {/* Recent activity */}
            <View style={styles.titleRow}>
              <Text style={styles.title}>Recent</Text>
              <InlineNotification
                type="info"
                text="Showing last 5"
                style={styles.inlineNotification}
              />
            </View>

            <Spacer size="medium" />

            {isLoading ? (
              <View
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 24 }}
              >
                <ActivityIndicator size="large" color={COLOURS.black} />
              </View>
            ) : noRecentRepairs ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No recent activity</Text>
                <Text style={styles.emptySubtitle}>
                  Repair requests from your dorms will appear here
                </Text>
              </View>
            ) : (
              <View>
                {recentRepairs.map((repair, index) => (
                  <View key={repair.id}>
                    <ListItem
                      title={repair.title}
                      subtitle={repair.subtitle}
                      iconName={repair.iconName}
                      onPress={() => router.push(`/main/manager/view-request?id=${repair.id}`)}
                      statusChip={repair.status}
                    />
                    {index < recentRepairs.length - 1 ? <Spacer size="small" /> : null}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.inlineAction}>
              <InlineButton
                title="View all requests"
                onPress={() => router.push('/main/manager/requests')}
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
  infoPanelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  inlineAction: {
    marginTop: 16,
    alignItems: 'center',
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
