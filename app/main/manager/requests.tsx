import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
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
import { getRepairRequests } from '../../../lib/repairs';
import { getActiveDormId } from '../../../lib/dorms';

import { FontAwesome5 } from '@expo/vector-icons';
import AvailabilityBadge from '../../../components/AvailabilityBadge';
import FilterChip from '../../../components/FilterChip';
import ListItem from '../../../components/ListItem';
import NavBar, { NavBarItem } from '../../../components/Navbar';
import ProfilePicture from '../../../components/ProfilePicture';
import SortDropdown from '../../../components/SortDropdown';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';

const FILTER_OPTIONS = ['All', 'Important', 'In Progress', 'Pending'];
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
};

// Mock data combining priority and recent repairs
const ALL_REPAIRS: RepairRequest[] = [
  {
    id: '1',
    title: 'Broken bathroom light',
    subtitle: 'Maple House - Reported by Person 1 - 20/03/2026',
    iconName: 'lightbulb',
    status: {
      label: 'High',
      backgroundColor: COLOURS.error.background,
      textColor: COLOURS.error.text,
    },
  },
  {
    id: '2',
    title: 'Leaking kitchen tap',
    subtitle: 'Oak Lodge - Reported by Person 2 - 18/03/2026',
    iconName: 'faucet',
    status: {
      label: 'In progress',
      backgroundColor: COLOURS.warning.background,
      textColor: COLOURS.warning.text,
    },
  },
  {
    id: '3',
    title: 'Broken door hinge',
    subtitle: 'Maple House - Reported by Person 3 - 15/03/2026',
    iconName: 'door-open',
    status: {
      label: 'Pending',
      backgroundColor: COLOURS.info.background,
      textColor: COLOURS.info.text,
    },
  },
  {
    id: '4',
    title: 'Fix broken sink',
    subtitle: 'Oak Lodge - Reported by Person 4 - 14/03/2026',
    iconName: 'faucet',
    status: {
      label: 'In progress',
      backgroundColor: COLOURS.warning.background,
      textColor: COLOURS.warning.text,
    },
  },
];

const GRADIENT_THRESHOLD = 24;

export default function Requests() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Date Reported');

  const [contentOverflows, setContentOverflows] = useState(false);
  const scrollViewHeight = useRef(0);
  const contentHeight = useRef(0);

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;
  const navGradientOpacity = useRef(new Animated.Value(0)).current;

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
  const isEmpty = ALL_REPAIRS.length === 0;

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

            {isEmpty ? (
              <>
                <Spacer size="large" />
                <View style={styles.noneFound}>
                  <View style={styles.iconWrapper}>
                    <FontAwesome5 name="check-circle" size={40} color={COLOURS.black} />
                  </View>
                  <Text style={styles.noneFoundTitle}>All caught up</Text>
                  <Text style={styles.noneFoundSubtitle}>
                    There are currently no open repair requests across your managed dorms.
                  </Text>
                </View>
              </>
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

                {ALL_REPAIRS.map((request, index) => (
                  <View key={request.id}>
                    <ListItem
                      title={request.title}
                      iconName={request.iconName}
                      subtitle={request.subtitle}
                      statusChip={request.status}
                      onPress={() => router.push(`/main/manager/view-request`)}
                    />
                    {index < ALL_REPAIRS.length - 1 && <Spacer size="small" />}
                  </View>
                ))}
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
