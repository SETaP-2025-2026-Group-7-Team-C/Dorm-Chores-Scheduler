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
import FilterChip from '../../../components/FilterChip';
import ListItem from '../../../components/ListItem';
import NavBar, { NavBarItem } from '../../../components/Navbar';
import ProfilePicture from '../../../components/ProfilePicture';
import SortDropdown from '../../../components/SortDropdown';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { getCurrentUser } from '../../../lib/auth';
import { getDormsByManager } from '../../../lib/dorms';
import { getRepairRequests } from '../../../lib/repairs';

const FILTER_OPTIONS = ['All', 'Important', 'In Progress', 'Pending', 'Completed'];
const SORT_OPTIONS = ['Date Reported', 'Dorm', 'Priority'];

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

type IconName = keyof typeof FontAwesome5.glyphMap;

type RepairStatus = {
  label: string;
  backgroundColor: string;
  textColor: string;
};

type RepairRequest = {
  id: string;
  title: string;
  subtitle: string;
  iconName: IconName;
  status: RepairStatus;
  workflowStatus: string;
  urgency: string;
};

const GRADIENT_THRESHOLD = 24;

export default function Requests() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Date Reported');
  const [isLoading, setIsLoading] = useState(true);
  const [allRepairs, setAllRepairs] = useState<RepairRequest[]>([]);

  const [contentOverflows, setContentOverflows] = useState(false);
  const scrollViewHeight = useRef(0);
  const contentHeight = useRef(0);

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;
  const navGradientOpacity = useRef(new Animated.Value(0)).current;

  const loadManagerRepairs = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user?.id) {
        setAllRepairs([]);
        return;
      }

      const dorms = await getDormsByManager(user.id);
      const dormRequestPairs = await Promise.all(
        dorms.map(async (dorm) => ({
          dormName: dorm.name,
          requests: await getRepairRequests(dorm.id),
        })),
      );

      const mapped: RepairRequest[] = dormRequestPairs.flatMap(({ dormName, requests }) =>
        (requests || []).map((request: any) => {
          const date = request.created_at ? new Date(request.created_at) : null;
          const dateStr = date
            ? `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}/${date.getFullYear()}`
            : 'Unknown date';

          const urgency = String(request.urgency || 'low');
          const workflowStatus = String(request.status || 'pending').toLowerCase();
          const statusMap: Record<string, RepairStatus> = {
            high: {
              label: 'High',
              backgroundColor: COLOURS.error.background,
              textColor: COLOURS.error.text,
            },
            medium: {
              label: 'Medium',
              backgroundColor: COLOURS.warning.background,
              textColor: COLOURS.warning.text,
            },
            low: {
              label: 'Low',
              backgroundColor: COLOURS.info.background,
              textColor: COLOURS.info.text,
            },
          };

          return {
            id: request.id,
            title: request.title || 'Untitled repair request',
            subtitle: `${dormName} - Reported ${dateStr}`,
            iconName: 'wrench',
            status: statusMap[urgency] || statusMap.low,
            workflowStatus,
            urgency,
          };
        }),
      );

      setAllRepairs(mapped);
    } catch (error) {
      console.warn('Failed to load manager repair requests', error);
      setAllRepairs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadManagerRepairs();
    }, [loadManagerRepairs]),
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

  let displayRepairs = allRepairs;
  if (activeFilter === 'Completed') {
    displayRepairs = displayRepairs.filter(
      (request) => request.workflowStatus === 'completed' || request.workflowStatus === 'resolved',
    );
  } else if (activeFilter === 'In Progress') {
    displayRepairs = displayRepairs.filter((request) => request.workflowStatus === 'in_progress');
  } else if (activeFilter === 'Pending') {
    displayRepairs = displayRepairs.filter((request) => request.workflowStatus === 'pending');
  } else if (activeFilter === 'Important') {
    displayRepairs = displayRepairs.filter(
      (request) =>
        request.urgency === 'high' &&
        request.workflowStatus !== 'completed' &&
        request.workflowStatus !== 'resolved',
    );
  } else {
    displayRepairs = displayRepairs.filter(
      (request) => request.workflowStatus !== 'completed' && request.workflowStatus !== 'resolved',
    );
  }

  const isEmpty = displayRepairs.length === 0;

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
            <Text style={styles.title}>All Requests</Text>

            {isLoading ? (
              <View
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}
              >
                <ActivityIndicator size="large" color={COLOURS.black} />
              </View>
            ) : (
              <>
                <Spacer size="medium" />

                <View style={styles.chipRow}>
                  {FILTER_OPTIONS.map((option) => (
                    <FilterChip
                      key={option}
                      label={option}
                      active={activeFilter === option}
                      onPress={() => setActiveFilter(option)}
                    />
                  ))}
                </View>

                <Spacer size="small" />

                <View style={styles.chipRow}>
                  <SortDropdown options={SORT_OPTIONS} selected={sortBy} onSelect={setSortBy} />
                </View>

                <Spacer size="medium" />

                {isEmpty ? (
                  <View style={styles.noneFound}>
                    <View style={styles.iconWrapper}>
                      <FontAwesome5 name="check-circle" size={40} color={COLOURS.black} />
                    </View>
                    <Text style={styles.noneFoundTitle}>
                      {activeFilter === 'Completed' ? 'No completed' : 'All caught up'}
                    </Text>
                    <Text style={styles.noneFoundSubtitle}>
                      {activeFilter === 'Completed'
                        ? 'There are no completed repair requests in this tab.'
                        : 'There are currently no repair requests in this tab.'}
                    </Text>
                  </View>
                ) : (
                  displayRepairs.map((request, index) => (
                    <View key={request.id}>
                      <ListItem
                        title={request.title}
                        iconName={request.iconName}
                        subtitle={request.subtitle}
                        statusChip={request.status}
                        onPress={() => router.push(`/main/manager/view-request?id=${request.id}`)}
                      />
                      {index < displayRepairs.length - 1 && <Spacer size="small" />}
                    </View>
                  ))
                )}
              </>
            )}

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
        activeKey={'requests'}
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    marginTop: 8,
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLOURS.gray[700],
    textAlign: 'center',
  },
});
