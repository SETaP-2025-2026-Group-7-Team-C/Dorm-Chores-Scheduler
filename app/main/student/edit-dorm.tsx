import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import Button from '../../../components/Button';
import HeaderBackButton from '../../../components/HeaderBackButton';
import InlineButton from '../../../components/InlineButton';
import InlineNotification from '../../../components/InlineNotification';
import Input from '../../../components/Input';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { getCurrentUser } from '../../../lib/auth';
import {
  Dorm,
  deleteDorm,
  generateInviteCode,
  getDormById,
  leaveDorm,
  updateDorm,
} from '../../../lib/dorms';
import { supabase } from '../../../lib/supabase';

const GRADIENT_THRESHOLD = 24;

type DormMemberView = {
  id: string;
  name: string;
  isHost: boolean;
  availability: 'available' | 'unavailable' | 'unknown';
};

export default function EditDorm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [dorm, setDorm] = useState<Dorm | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [members, setMembers] = useState<DormMemberView[]>([]);

  const [name, setName] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [notice, setNotice] = useState<{
    type: 'error' | 'success' | 'info' | 'warning' | 'tip';
    text: string;
  } | null>(null);

  const headerGradientOpacity = useRef(new Animated.Value(0)).current;

  const loadDorm = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      const dormData = await getDormById(id);
      if (dormData) {
        setDorm(dormData);
        setName(dormData.name);
        if (user && dormData.created_by === user.id) {
          setIsCreator(true);
        } else {
          setIsCreator(false);
        }

        const { data: memberRows, error: membersError } = await supabase
          .from('dorm_members')
          .select('user_id, profiles (display_name, availability_status)')
          .eq('dorm_id', id)
          .order('joined_at', { ascending: true });

        if (membersError) {
          throw membersError;
        }

        const mappedMembers: DormMemberView[] = (memberRows || []).map((row: any) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          const availability =
            profile?.availability_status === 'available' ||
            profile?.availability_status === 'unavailable'
              ? profile.availability_status
              : 'unknown';

          return {
            id: row.user_id,
            name:
              user?.id === row.user_id
                ? 'You'
                : String(profile?.display_name || '').trim() || 'Unknown member',
            isHost: row.user_id === dormData.created_by,
            availability,
          };
        });

        setMembers(mappedMembers);
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message || 'Failed to load dorm' });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadDorm();
    }, [loadDorm]),
  );

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (confirmingDelete || confirmingLeave) {
        setConfirmingDelete(false);
        setConfirmingLeave(false);
        return true;
      }
      router.back();
      return true;
    });
    return () => backHandler.remove();
  }, [confirmingDelete, confirmingLeave]);

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

  const handleSave = useCallback(async () => {
    setNotice(null);
    if (!id) return;

    const nameTrimmed = name.trim();

    if (!nameTrimmed) {
      setNotice({ type: 'error', text: 'Please enter a dorm name' });
      return;
    }
    if (nameTrimmed.length < 3 || nameTrimmed.length > 50) {
      setNotice({ type: 'error', text: 'Dorm name must be between 3 and 50 characters' });
      return;
    }

    try {
      await updateDorm(id, { name: nameTrimmed });
      router.push('/main/student/dorms');
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message || 'Failed to update dorm' });
    }
  }, [name, id]);

  const handleRegenerateInvite = useCallback(async () => {
    setNotice(null);
    if (!id || !isCreator) return;

    try {
      const newCode = await generateInviteCode();
      await updateDorm(id, { name: dorm?.name || '', join_code: newCode });
      setDorm((prev) => (prev ? { ...prev, join_code: newCode } : null));
      setNotice({ type: 'success', text: `Invite code regenerated: ${newCode}` });
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message || 'Failed to regenerate invite code' });
    }
  }, [id, isCreator, dorm]);

  const handleDeleteConfirmed = useCallback(async () => {
    if (!id) return;
    try {
      await deleteDorm(id);
      router.push('/main/student/dorms');
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message || 'Failed to delete dorm' });
    }
  }, [id]);

  const handleLeaveConfirmed = useCallback(async () => {
    if (!id) return;
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not logged in');
      await leaveDorm(user.id, id);
      router.push('/main/student/dorms');
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message || 'Failed to leave dorm' });
    }
  }, [id]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLOURS.black} />
      </View>
    );
  }

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
            <Text style={styles.heading}>{isCreator ? 'Edit Dorm' : 'Dorm Info'}</Text>

            <Spacer size="small" />

            <Text style={styles.subheading}>
              {isCreator
                ? 'Changes you make here will be visible to all members of the dorm'
                : 'Only the creator can edit dorm details.'}
            </Text>

            <Spacer size="large" />

            <Text style={styles.inputLabel}>Dorm name</Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g. Maple House"
              editable={isCreator}
            />

            {isCreator && (
              <>
                <Spacer size="medium" />
                <Button title="Save changes" onPress={handleSave} variant="standard" />
              </>
            )}

            <Spacer size="large" />

            {dorm && (
              <>
                <Text style={styles.inputLabel}>Invite code</Text>
                <View style={styles.inviteCodeRow}>
                  <Text style={styles.inviteCodeText}>{dorm.join_code}</Text>
                  {isCreator && (
                    <InlineButton title="Regenerate" onPress={handleRegenerateInvite} />
                  )}
                </View>
                <Spacer size="large" />
              </>
            )}

            <Text style={styles.inputLabel}>Members</Text>
            <View style={styles.membersList}>
              {members.length === 0 ? (
                <Text style={styles.memberEmptyText}>No members found</Text>
              ) : (
                members.map((member) => (
                  <View key={member.id} style={styles.memberRow}>
                    <View style={styles.memberLeft}>
                      <View style={styles.memberIconCircle}>
                        <FontAwesome5 name="user" size={13} color={COLOURS.black} />
                      </View>
                      <Text style={styles.memberName}>{member.name}</Text>
                    </View>
                    <View style={styles.memberRight}>
                      {member.isHost ? (
                        <View style={[styles.memberChip, styles.hostChip]}>
                          <Text style={[styles.memberChipText, styles.hostChipText]}>Host</Text>
                        </View>
                      ) : null}
                      <View
                        style={[
                          styles.memberChip,
                          member.availability === 'available'
                            ? styles.availableChip
                            : member.availability === 'unavailable'
                              ? styles.unavailableChip
                              : styles.unknownChip,
                        ]}
                      >
                        <Text
                          style={[
                            styles.memberChipText,
                            member.availability === 'available'
                              ? styles.availableChipText
                              : member.availability === 'unavailable'
                                ? styles.unavailableChipText
                                : styles.unknownChipText,
                          ]}
                        >
                          {member.availability === 'available'
                            ? 'Available'
                            : member.availability === 'unavailable'
                              ? 'Unavailable'
                              : 'Unknown'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            <Spacer size="medium" />

            {notice && (
              <>
                <InlineNotification type={notice.type} text={notice.text} />
                <Spacer size="medium" />
              </>
            )}

            <Spacer size="medium" />

            <View style={styles.divider} />

            <Spacer size="large" />

            <Text style={styles.dangerLabel}>{isCreator ? 'Delete dorm' : 'Leave dorm'}</Text>

            <Spacer size="small" />

            <Text style={styles.subheading}>
              {isCreator
                ? 'This is permanent and cannot be undone. All chores and repairs will also be removed.'
                : 'You will lose access to the chores and repairs for this dorm.'}
            </Text>

            <Spacer size="medium" />

            {isCreator ? (
              confirmingDelete ? (
                <>
                  <Text style={styles.confirmLabel}>Are you sure?</Text>
                  <Spacer size="small" />
                  <Text style={styles.subheading}>
                    This action cannot be reversed once confirmed
                  </Text>
                  <Spacer size="medium" />
                  <Button
                    title="Yes, delete dorm"
                    onPress={handleDeleteConfirmed}
                    variant="danger"
                  />
                </>
              ) : (
                <Button
                  title="Delete dorm"
                  onPress={() => setConfirmingDelete(true)}
                  variant="danger"
                />
              )
            ) : confirmingLeave ? (
              <>
                <Text style={styles.confirmLabel}>Are you sure?</Text>
                <Spacer size="small" />
                <Text style={styles.subheading}>You will need an invite code to rejoin</Text>
                <Spacer size="medium" />
                <Button title="Yes, leave dorm" onPress={handleLeaveConfirmed} variant="danger" />
              </>
            ) : (
              <Button
                title="Leave dorm"
                onPress={() => setConfirmingLeave(true)}
                variant="danger"
              />
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
  dangerLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLOURS.black,
    marginBottom: 0,
  },
  confirmLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLOURS.black,
    marginBottom: 0,
  },
  divider: {
    height: 1,
    backgroundColor: COLOURS.gray[200],
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLOURS.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  inviteCodeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: COLOURS.black,
    letterSpacing: 1,
  },
  membersList: {
    borderWidth: 1,
    borderColor: COLOURS.gray[200],
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLOURS.white,
  },
  memberRow: {
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLOURS.gray[200],
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 8,
  },
  memberIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLOURS.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  memberName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLOURS.black,
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberChip: {
    minHeight: 22,
    paddingHorizontal: 8,
    borderRadius: 999,
    justifyContent: 'center',
  },
  memberChipText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  hostChip: {
    backgroundColor: COLOURS.gray[100],
  },
  hostChipText: {
    color: COLOURS.black,
  },
  availableChip: {
    backgroundColor: COLOURS.success.background,
  },
  availableChipText: {
    color: COLOURS.success.text,
  },
  unavailableChip: {
    backgroundColor: COLOURS.error.background,
  },
  unavailableChipText: {
    color: COLOURS.error.text,
  },
  unknownChip: {
    backgroundColor: COLOURS.info.background,
  },
  unknownChipText: {
    color: COLOURS.info.text,
  },
  memberEmptyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLOURS.gray[500],
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  centerText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.black,
    textAlign: 'center',
  },
});
