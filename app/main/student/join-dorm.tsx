import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  TouchableOpacity,
  View,
} from 'react-native';

import { FontAwesome5 } from '@expo/vector-icons';
import Button from '../../../components/Button';
import HeaderBackButton from '../../../components/HeaderBackButton';
import InlineButton from '../../../components/InlineButton';
import InlineNotification from '../../../components/InlineNotification';
import Input from '../../../components/Input';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { joinDorm, setActiveDormId } from '../../../lib/dorms';
import { supabase } from '../../../lib/supabase';

const GRADIENT_THRESHOLD = 24;

type DormPreview = {
  id: string;
  name: string;
  memberCount: number;
  maxMembers: number;
};

export default function JoinDorm() {
  const [inviteCode, setInviteCode] = useState('');
  const [isCodeDropdownOpen, setIsCodeDropdownOpen] = useState(false);
  const [dormPreview, setDormPreview] = useState<DormPreview | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [notice, setNotice] = useState<{
    type: 'error' | 'success' | 'info' | 'warning' | 'tip';
    text: string;
  } | null>(null);

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;

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

  const handleLookUp = useCallback(async () => {
    setNotice(null);
    setDormPreview(null);

    const codeTrimmed = inviteCode.trim();

    if (!codeTrimmed) {
      setNotice({ type: 'error', text: 'Please enter an invite code.' });
      return;
    }
    if (codeTrimmed.length !== 6) {
      setNotice({ type: 'error', text: 'Join code must be exactly 6 characters.' });
      return;
    }

    setIsLookingUp(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error('User not authenticated.');

      // Look up dorm without joining to preview first.
      const { data: dorm, error: dormError } = await supabase
        .from('dorms')
        .select('*')
        .eq('join_code', codeTrimmed.toUpperCase())
        .maybeSingle();

      if (dormError || !dorm) {
        throw new Error('Invalid join code or dorm not found.');
      }

      setDormPreview({
        id: dorm.id,
        name: dorm.name,
        memberCount: 0,
        maxMembers: 10,
      });
      setNotice({ type: 'success', text: `Found ${dorm.name}! Click Join to enter.` });
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err.message || 'Failed to find dorm. Please check your code.',
      });
    } finally {
      setIsLookingUp(false);
    }
  }, [inviteCode]);

  const handleJoin = useCallback(async () => {
    if (!dormPreview) return;
    setNotice(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error('Not authenticated.');

      // We use the invite code we verified earlier to join
      const joined = await joinDorm(userData.user.id, inviteCode);
      await setActiveDormId(joined.dorm_id);

      router.push('/main/student/dorms');
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to join dorm' });
    }
  }, [dormPreview, inviteCode]);

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
            <Text style={styles.heading}>Join a Dorm</Text>

            <Spacer size="small" />

            <Text style={styles.subheading}>
              Ask a dorm member for the invite code, then enter it below
            </Text>

            <Spacer size="large" />

            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownHeader}
                onPress={() => setIsCodeDropdownOpen((prev) => !prev)}
                activeOpacity={0.85}
              >
                <Text style={styles.dropdownHeaderText}>Enter invite code</Text>
                <FontAwesome5
                  name={isCodeDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={COLOURS.black}
                />
              </TouchableOpacity>

              {isCodeDropdownOpen ? (
                <View style={styles.dropdownContent}>
                  <Text style={styles.inputLabel}>Invite code</Text>
                  <Input
                    value={inviteCode}
                    onChangeText={(text) => {
                      setInviteCode(text.toUpperCase());
                      setDormPreview(null);
                      setNotice(null);
                    }}
                    placeholder="e.g. AB12CD"
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />

                  <Spacer size="large" />

                  <Button
                    title={isLookingUp ? 'Looking up...' : 'Look up dorm'}
                    onPress={handleLookUp}
                    variant="secondary"
                    disabled={isLookingUp}
                  />
                </View>
              ) : (
                <Text style={styles.dropdownHint}>Closed by default for a cleaner view</Text>
              )}
            </View>

            {dormPreview && (
              <>
                <Spacer size="large" />

                <View style={styles.previewCard}>
                  <Text style={styles.previewName}>{dormPreview.name}</Text>

                  <Spacer size="small" />

                  <Text style={styles.previewMembers}>
                    {dormPreview.memberCount} of {dormPreview.maxMembers} members
                  </Text>
                </View>

                <Spacer size="large" />

                <Button title="Join this dorm" onPress={handleJoin} variant="standard" />
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
              Changed your mind? <InlineButton title="Go back" onPress={() => router.back()} />
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
  inputLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLOURS.black,
    marginBottom: 8,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: COLOURS.gray[200],
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLOURS.white,
  },
  dropdownHeader: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownHeaderText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLOURS.black,
  },
  dropdownContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: COLOURS.gray[200],
  },
  dropdownHint: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: COLOURS.gray[500],
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  previewCard: {
    borderWidth: 1,
    borderColor: COLOURS.gray[200],
    borderRadius: 12,
    padding: 16,
  },
  previewName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLOURS.black,
  },
  previewMembers: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLOURS.gray[500],
  },
  centerText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.black,
    textAlign: 'center',
  },
});
