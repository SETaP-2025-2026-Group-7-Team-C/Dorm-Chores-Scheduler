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
import { getRepairRequestsByReporter } from '../../../lib/repairs';
import { supabase } from '../../../lib/supabase';

import { FontAwesome5 } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import ActionPillButton from '../../../components/ActionPillButton';
import AvailabilityBadge from '../../../components/AvailabilityBadge';
import FilterChip from '../../../components/FilterChip';
import InlineButton from '../../../components/InlineButton';
import ListItem from '../../../components/ListItem';
import NavBar, { NavBarItem } from '../../../components/Navbar';
import ProfilePicture from '../../../components/ProfilePicture';
import SortDropdown from '../../../components/SortDropdown';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { getActiveDormId } from '../../../lib/dorms';

const FILTER_OPTIONS = ['All', 'Mine', 'Completed'];
const SORT_OPTIONS = ['Due Date'];

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

type RepairSummary = {
  id: string;
  title: string;
  iconName: keyof typeof FontAwesome5.glyphMap;
  subtitle: string;
};

const REPAIR_REQUESTS: RepairSummary[] = [
  {
    id: '1',
    title: 'Fix broken sink',
    iconName: 'faucet',
    subtitle: 'Created by You - 20/02/2026',
  },
  {
    id: '2',
    title: 'Repair door lock',
    iconName: 'door-closed',
    subtitle: 'Created by Person 2 - 18/02/2026',
  },
];

const GRADIENT_THRESHOLD = 24;

export default function Repairs() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Due Date');
  const [isLoading, setIsLoading] = useState(true);
  const isConnected = true; // Defines whether the user is connected to a manager (i.e. has access to repair requests) or not. Set to false to show the "not connected" state.
  const qrValue = 'dorm-chores-scheduler:manager-connect:sample';

  const [contentOverflows, setContentOverflows] = useState(false);
  const scrollViewHeight = useRef(0);
  const contentHeight = useRef(0);

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;
  const navGradientOpacity = useRef(new Animated.Value(0)).current;

  const loadRepairsState = async () => {
    setIsLoading(true);
    try {
      const activeDormId = await getActiveDormId();

      if (!activeDormId) {
        router.replace('/main/student/dorms');
        return;
      }
    } catch (error) {
      console.warn('Failed to load repairs state', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRepairsState();
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

  const isEmpty = REPAIR_REQUESTS.length === 0;

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
            {isConnected ? (
              <>
                <Text style={styles.title}>Repair requests</Text>

                {isLoading ? (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: 100,
                    }}
                  >
                    <ActivityIndicator size="large" color={COLOURS.black} />
                  </View>
                ) : isEmpty ? (
                  <>
                    <Spacer size="large" />

                    <View style={styles.noneFound}>
                      <View style={styles.iconWrapper}>
                        <FontAwesome5 name="wrench" size={40} color={COLOURS.black} />
                      </View>

                      <Text style={styles.noneFoundTitle}>No repairs found</Text>

                      <Text style={styles.noneFoundSubtitle}>
                        Something need repaired?{' '}
                        <InlineButton
                          title="Request repair"
                          onPress={() => router.push('/main/student/request-repair')}
                        />
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

                    {REPAIR_REQUESTS.map((request, index) => (
                      <View key={request.id}>
                        <ListItem
                          title={request.title}
                          iconName={request.iconName}
                          subtitle={request.subtitle}
                          onPress={() => router.push(`/main/student/view-repair`)}
                        />

                        {index < REPAIR_REQUESTS.length - 1 && <Spacer size="small" />}
                      </View>
                    ))}
                  </>
                )}

                <Spacer size="large" />
              </>
            ) : (
              <View style={styles.notConnected}>
                <Spacer size="large" />
                <View style={styles.qrCode}>
                  <QRCode value={qrValue} size={300} />
                </View>
                <Spacer size="large" />
                <View style={styles.qrIconWrapper}>
                  <FontAwesome5 name="wrench" size={28} color={COLOURS.black} />
                </View>
                <Text style={styles.notConnectedTitle}>Not connected</Text>
                <Text style={styles.notConnectedSubtitle}>
                  To begin sending repair requests, your building manager must scan the above QR
                  code.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {isConnected && (
        <View style={styles.actionButtonWrapper}>
          <ActionPillButton
            title="New Request"
            iconName="plus"
            onPress={() => router.push('/main/student/request-repair')}
          />
        </View>
      )}

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
        activeKey={'repairs'}
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButtonWrapper: {
    position: 'absolute',
    right: 16,
    bottom: 112,
    zIndex: 4,
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
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLOURS.gray[700],
    textAlign: 'center',
  },
  notConnected: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  qrCode: {
    width: 300,
    height: 300,
    backgroundColor: COLOURS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrIconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notConnectedTitle: {
    marginTop: 8,
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLOURS.black,
    textAlign: 'center',
  },
  notConnectedSubtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLOURS.gray[700],
    textAlign: 'center',
  },
});
