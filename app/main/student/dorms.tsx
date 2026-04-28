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
  TouchableOpacity,
  View,
} from 'react-native';

import { FontAwesome5 } from '@expo/vector-icons';
import ActionPillButton from '../../../components/ActionPillButton';
import AvailabilityBadge from '../../../components/AvailabilityBadge';
import DormCard from '../../../components/DormCard';
import NavBar, { NavBarItem } from '../../../components/Navbar';
import ProfilePicture from '../../../components/ProfilePicture';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { getCurrentUser } from '../../../lib/auth';
import { getActiveDormId, setActiveDormId } from '../../../lib/dorms';
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

type DormSummary = {
  title: string;
  subtitle: string;
  stats: { value: number; label: string }[];
};

type DormListItem = DormSummary & { id: string };

export default function Dorms() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isJoinPressed, setIsJoinPressed] = useState(false);
  const [isCreatePressed, setIsCreatePressed] = useState(false);

  const [currentDorm, setCurrentDorm] = useState<DormListItem | null>(null);
  const [otherDorms, setOtherDorms] = useState<DormListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [contentOverflows, setContentOverflows] = useState(false);
  const scrollViewHeight = useRef(0);
  const contentHeight = useRef(0);

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;
  const navGradientOpacity = useRef(new Animated.Value(0)).current;
  const actionButtonTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  const loadDorms = async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user?.id) return;

      const { data: memberships, error } = await supabase
        .from('dorm_members')
        .select('dorm_id, joined_at, dorms (id, name, created_at, created_by)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) {
        console.warn('Error fetching dorm memberships:', error);
        return;
      }

      if (memberships && memberships.length > 0) {
        const fetchStats = async (dormId: string) => {
          const [membersRes, choresRes] = await Promise.all([
            supabase
              .from('dorm_members')
              .select('*', { count: 'exact', head: true })
              .eq('dorm_id', dormId),
            supabase
              .from('chores')
              .select('*', { count: 'exact', head: true })
              .eq('dorm_id', dormId),
          ]);
          return [
            { value: membersRes.count || 0, label: 'Members' },
            { value: choresRes.count || 0, label: 'Chores' },
            { value: 0, label: 'Repairs' }, // Not fully implemented yet
          ];
        };

        const processDorm = async (m: any) => {
          const d = Array.isArray(m.dorms) ? m.dorms[0] : m.dorms;

          let creatorName = 'Unknown';
          if (d?.created_by) {
            if (user && user.id === d.created_by) {
              creatorName = 'You';
            } else {
              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', d.created_by)
                .maybeSingle();
              if (profile?.display_name) {
                creatorName = profile.display_name;
              }
            }
          }

          let dateStr = 'Unknown';
          if (d?.created_at) {
            const dObj = new Date(d.created_at);
            dateStr = `${dObj.getDate().toString().padStart(2, '0')}/${(dObj.getMonth() + 1).toString().padStart(2, '0')}/${dObj.getFullYear()}`;
          }

          const stats = await fetchStats(d?.id || m.dorm_id);

          return {
            id: d?.id || m.dorm_id,
            title: d?.name || 'Unknown Dorm',
            subtitle: `Created by ${creatorName} - ${dateStr}`,
            stats,
          };
        };

        const all = await Promise.all(memberships.map(processDorm));

        let activeIndex = 0;
        const activeId = await getActiveDormId();
        if (activeId) {
          const idx = all.findIndex((d) => d.id === activeId);
          if (idx !== -1) {
            activeIndex = idx;
          }
        }

        setCurrentDorm(all[activeIndex]);
        setOtherDorms([...all.slice(0, activeIndex), ...all.slice(activeIndex + 1)]);
      } else {
        setCurrentDorm(null);
        setOtherDorms([]);
      }
    } catch (error) {
      console.warn('Failed to load dorms', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDorms();
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

    // FAB Animation
    const isScrollingDown = scrollY > lastScrollY.current && scrollY > 0;
    const isAtBottom = scrollY + layoutMeasurement.height >= contentSize.height - 20;

    if (isAtBottom || !isScrollingDown || scrollY < 50) {
      Animated.timing(actionButtonTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (isScrollingDown && scrollY > 100) {
      Animated.timing(actionButtonTranslateY, {
        toValue: 150, // Move it further down since there are two buttons
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    lastScrollY.current = scrollY;
  };

  const isEmpty = !currentDorm && otherDorms.length === 0;

  const items: NavBarItem[] = (
    isEmpty ? NAV_ITEMS.filter((item) => item.key === 'dorms') : NAV_ITEMS
  ).map((item) => ({
    ...item,
  }));

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
            <Text style={styles.title}>Current dorm</Text>

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
                    <FontAwesome5 name="bed" size={40} color={COLOURS.black} />
                  </View>

                  <Text style={styles.noneFoundTitle}>No dorms found</Text>

                  <Text style={styles.noneFoundSubtitle}>
                    You will need to join a dorm or create one to get started with{' '}
                    <Text style={styles.noneFoundBold}>Dorm Chores Scheduler</Text>.
                  </Text>
                </View>
              </>
            ) : (
              <>
                {currentDorm ? (
                  <View style={styles.table}>
                    <View style={styles.tableRow}>
                      <DormCard
                        title={currentDorm.title}
                        subtitle={currentDorm.subtitle}
                        stats={currentDorm.stats}
                        primaryAction={{
                          label: 'Edit dorm',
                          onPress: () =>
                            router.push(`/main/student/edit-dorm?id=${currentDorm.id}`),
                          variant: 'secondary',
                        }}
                      />
                    </View>
                  </View>
                ) : null}

                <View style={styles.sectionSpacing}>
                  <Text style={styles.title}>Other dorm(s)</Text>
                </View>

                {otherDorms.length > 0 ? (
                  <View style={styles.table}>
                    {otherDorms.map((dorm, index) => (
                      <View key={dorm.id} style={styles.tableRow}>
                        <DormCard
                          title={dorm.title}
                          subtitle={dorm.subtitle}
                          stats={dorm.stats}
                          primaryAction={{
                            label: 'Edit dorm',
                            onPress: () => router.push(`/main/student/edit-dorm?id=${dorm.id}`),
                            variant: 'secondary',
                          }}
                          secondaryAction={{
                            label: 'Switch dorm',
                            onPress: async () => {
                              await setActiveDormId(dorm.id);
                              loadDorms();
                            },
                            variant: 'primary',
                          }}
                        />
                        {index < otherDorms.length - 1 ? <Spacer size="small" /> : null}
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {!isLoading && isEmpty ? (
        <View style={styles.emptyActions}>
          <View style={styles.joinButtonWrapper}>
            <View style={[styles.buttonBorder, isJoinPressed && styles.buttonBorderJoinPressed]}>
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => router.push('/main/student/join-dorm')}
                onPressIn={() => setIsJoinPressed(true)}
                onPressOut={() => setIsJoinPressed(false)}
                activeOpacity={1}
              >
                <Text style={styles.joinButtonText}>Join a dorm</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.orText}>or</Text>

          <View style={styles.createButtonWrapper}>
            <View
              style={[styles.buttonBorder, isCreatePressed && styles.buttonBorderCreatePressed]}
            >
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/main/student/create-dorm')}
                onPressIn={() => setIsCreatePressed(true)}
                onPressOut={() => setIsCreatePressed(false)}
                activeOpacity={1}
              >
                <Text style={styles.createButtonText}>Create a dorm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <Animated.View
          style={[
            styles.pillButtonsWrapper,
            { transform: [{ translateY: actionButtonTranslateY }] },
          ]}
        >
          <ActionPillButton
            title="Join Dorm"
            iconName="sign-in-alt"
            onPress={() => router.push('/main/student/join-dorm')}
            variant="secondary"
          />
          <Spacer size="small" />
          <ActionPillButton
            title="New Dorm"
            iconName="plus"
            onPress={() => router.push('/main/student/create-dorm')}
          />
        </Animated.View>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 240,
  },
  content: {
    marginHorizontal: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLOURS.black,
  },
  sectionSpacing: {
    marginTop: 12,
  },
  cardSpacing: {
    marginTop: 12,
  },
  table: {
    marginTop: 12,
    gap: 12,
  },
  tableRow: {
    width: '100%',
  },
  pillButtonsWrapper: {
    position: 'absolute',
    right: 16,
    bottom: 112,
    zIndex: 4,
    alignItems: 'flex-end',
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
    marginTop: 4,
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLOURS.gray[700],
    textAlign: 'center',
  },
  noneFoundBold: {
    fontFamily: 'Inter-Bold',
    color: COLOURS.gray[700],
  },
  emptyActions: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 112,
    alignItems: 'center',
    zIndex: 4,
  },
  joinButtonWrapper: {
    width: '100%',
  },
  createButtonWrapper: {
    width: '100%',
  },
  buttonBorder: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLOURS.transparent,
    padding: 2,
  },
  buttonBorderJoinPressed: {
    borderColor: COLOURS.primary,
  },
  buttonBorderCreatePressed: {
    borderColor: COLOURS.primaryLight,
  },
  joinButton: {
    height: 56,
    borderRadius: 999,
    backgroundColor: COLOURS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLOURS.primaryMuted,
  },
  orText: {
    marginVertical: 8,
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.black,
  },
  createButton: {
    height: 56,
    borderRadius: 999,
    backgroundColor: COLOURS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLOURS.black,
  },
});
