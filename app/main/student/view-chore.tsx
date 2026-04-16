import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Button from '../../../components/Button';
import HeaderBackButton from '../../../components/HeaderBackButton';
import InlineButton from '../../../components/InlineButton';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import {
  Chore,
  getChoreById,
  markChoreComplete,
  updateChoreWorkflowStatus,
} from '../../../lib/chores';
import { supabase } from '../../../lib/supabase';

dayjs.extend(relativeTime);

export default function ViewChore() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [chore, setChore] = useState<Chore | null>(null);
  const [assignedName, setAssignedName] = useState<string>('Unassigned');
  const [loading, setLoading] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Load chore data
  const loadChore = useCallback(async () => {
    const fetchId = Array.isArray(id) ? id[0] : id;
    if (!fetchId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getChoreById(fetchId);
      setChore(data);

      if (data && data.meta?.assignedTo) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', data.meta.assignedTo)
          .single();
        if (error) {
          console.warn('Profile fetch error:', error);
        }
        setAssignedName(profile?.display_name || 'Unknown User');
      } else {
        setAssignedName('Unassigned');
      }
    } catch (e) {
      console.error('Failed to load chore:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadChore();
    }, [loadChore]),
  );

  const handleMarkComplete = async () => {
    if (!chore) return;
    try {
      await markChoreComplete(chore.id);
      Alert.alert('Success', 'Chore marked as completed!');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to complete chore');
    }
  };

  const handleMarkInProgress = async () => {
    if (!chore) return;
    try {
      await updateChoreWorkflowStatus(chore.id, 'in_progress');
      await loadChore();
      Alert.alert('Success', 'Chore is now in progress.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update chore status');
    }
  };

  const handleMarkPending = async () => {
    if (!chore) return;
    try {
      await updateChoreWorkflowStatus(chore.id, 'pending');
      await loadChore();
      Alert.alert('Success', 'Chore moved back to pending.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update chore status');
    }
  };

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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ headerShown: false, gestureEnabled: false, animation: 'slide_from_right' }}
      />

      <View style={styles.topBar}>
        <HeaderBackButton iconName="times" />
      </View>

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
        >
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator size="large" color={COLOURS.primary} />
            ) : chore ? (
              <>
                <Text style={styles.heading}>{chore.title}</Text>

                <Spacer size="small" />

                <Text style={styles.subheading}>
                  Created on {dayjs(chore.created_at).format('DD/MM/YYYY')}
                </Text>

                <Spacer size="large" />

                {chore.description ? (
                  <>
                    <Text style={styles.fieldLabel}>Description</Text>
                    <Text style={styles.fieldValue}>{chore.description}</Text>
                    <Spacer size="medium" />
                  </>
                ) : null}

                <Text style={styles.fieldLabel}>Status</Text>
                <Text style={styles.fieldValue}>
                  {chore.meta?.assignedTo
                    ? chore.status
                      ? chore.status.charAt(0).toUpperCase() + chore.status.slice(1)
                      : 'Pending'
                    : 'Unassigned'}
                </Text>
                <Spacer size="medium" />

                <Text style={styles.fieldLabel}>Assigned To</Text>
                <Text style={styles.fieldValue}>{assignedName}</Text>
                <Spacer size="medium" />
                <Text style={styles.fieldLabel}>Due Date</Text>
                <Text style={styles.fieldValue}>
                  {dayjs(chore.created_at)
                    .add(chore.meta?.due_in_days || 7, 'day')
                    .format('DD/MM/YYYY')}{' '}
                  (
                  {dayjs(chore.created_at)
                    .add(chore.meta?.due_in_days || 7, 'day')
                    .fromNow()}
                  )
                </Text>
                <Spacer size="medium" />
                {chore.meta?.category ? (
                  <>
                    <Text style={styles.fieldLabel}>Category</Text>
                    <Text style={styles.fieldValue}>
                      {chore.meta.category.charAt(0).toUpperCase() + chore.meta.category.slice(1)}
                    </Text>
                    <Spacer size="medium" />
                  </>
                ) : null}

                {chore.meta?.isRecurring ? (
                  <>
                    <Text style={styles.fieldLabel}>Repetition</Text>
                    <Text style={styles.fieldValue}>Recurring {chore.meta.frequency}</Text>
                    <Spacer size="medium" />
                  </>
                ) : null}

                <Spacer size="large" />

                {chore.status === 'pending' && (
                  <>
                    <Button title="Mark as in progress" onPress={handleMarkInProgress} />
                    <Spacer size="small" />
                  </>
                )}

                {chore.status === 'in_progress' && (
                  <>
                    <Button
                      title="Move back to pending"
                      onPress={handleMarkPending}
                      variant="secondary"
                    />
                    <Spacer size="small" />
                  </>
                )}

                {chore.status !== 'completed' && (
                  <>
                    <Button title="Mark as completed" onPress={handleMarkComplete} />
                    <Spacer size="small" />
                  </>
                )}

                <Button
                  title="Edit chore"
                  onPress={() => router.push(`/main/student/edit-chore?id=${chore.id}`)}
                  variant="secondary"
                />

                <Spacer size="large" />

                <Text style={styles.centerText}>
                  Done here? <InlineButton title="Go back" onPress={() => router.back()} />
                </Text>

                <Spacer size="large" />
              </>
            ) : (
              <Text style={styles.errorText}>Chore not found.</Text>
            )}
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
  centerText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.black,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.error.text,
    textAlign: 'center',
    marginTop: 40,
  },
});
