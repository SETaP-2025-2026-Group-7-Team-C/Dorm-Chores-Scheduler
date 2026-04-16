import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useFocusEffect } from 'expo-router';
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
  View,
} from 'react-native';

import Button from '../../../components/Button';
import CategoryPicker, { CategoryOption } from '../../../components/CategoryPicker';
import FilterChip from '../../../components/FilterChip';
import HeaderBackButton from '../../../components/HeaderBackButton';
import InlineButton from '../../../components/InlineButton';
import InlineNotification from '../../../components/InlineNotification';
import Input from '../../../components/Input';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { createChore } from '../../../lib/chores';
import { getChoreTemplates } from '../../../lib/choreTemplates';
import { getActiveDormId } from '../../../lib/dorms';
import { supabase } from '../../../lib/supabase';

const GRADIENT_THRESHOLD = 24;

const CATEGORIES: CategoryOption[] = [
  { key: 'kitchen', label: 'Kitchen', iconName: 'utensils' },
  { key: 'bathroom', label: 'Bathroom', iconName: 'bath' },
  { key: 'corridor', label: 'Corridor', iconName: 'house-user' },
  { key: 'bins', label: 'Bins', iconName: 'trash' },
  { key: 'floors', label: 'Floors', iconName: 'broom' },
  { key: 'other', label: 'Other', iconName: 'ellipsis-h' },
];

const FREQUENCY_OPTIONS: { key: string; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'fortnightly', label: 'Fortnightly' },
  { key: 'monthly', label: 'Monthly' },
];

type ChorePreset = {
  key: string;
  label: string;
  title: string;
  description: string;
  category: string;
  dueWithinDays: string;
};

const DEFAULT_CHORE_PRESETS: ChorePreset[] = [
  {
    key: 'bins',
    label: 'Take bins out',
    title: 'Take out the bins',
    description: 'Empty kitchen and bathroom bins and replace liners.',
    category: 'bins',
    dueWithinDays: '2',
  },
  {
    key: 'kitchen',
    label: 'Clean kitchen',
    title: 'Clean kitchen surfaces',
    description: 'Wipe counters and hob, clean sink, and tidy shared kitchen area.',
    category: 'kitchen',
    dueWithinDays: '3',
  },
  {
    key: 'bathroom',
    label: 'Clean bathroom',
    title: 'Clean shared bathroom',
    description: 'Clean sink, mirror, toilet, and shower area.',
    category: 'bathroom',
    dueWithinDays: '3',
  },
  {
    key: 'floors',
    label: 'Vacuum floors',
    title: 'Vacuum shared floors',
    description: 'Vacuum corridor and shared rooms.',
    category: 'floors',
    dueWithinDays: '7',
  },
  {
    key: 'corridor',
    label: 'Tidy corridor',
    title: 'Tidy shared corridor',
    description: 'Clear clutter and wipe surfaces in the corridor.',
    category: 'corridor',
    dueWithinDays: '7',
  },
];

export default function CreateChore() {
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [dueWithinDays, setDueWithinDays] = useState('7');
  const [dueWithinError, setDueWithinError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(CATEGORIES[0].key);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);
  const [quickStartPresets, setQuickStartPresets] = useState<ChorePreset[]>(DEFAULT_CHORE_PRESETS);
  const [isRecurring, setIsRecurring] = useState<boolean | null>(false);
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null);
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

  const loadTemplates = useCallback(async () => {
    try {
      const dormId = await getActiveDormId();
      if (!dormId) {
        setQuickStartPresets(DEFAULT_CHORE_PRESETS);
        return;
      }

      const templates = await getChoreTemplates(dormId, false);
      if (!templates.length) {
        setQuickStartPresets(DEFAULT_CHORE_PRESETS);
        return;
      }

      setQuickStartPresets(
        templates.map((t) => ({
          key: t.id,
          label: t.title,
          title: t.title,
          description: t.description || '',
          category: t.category || CATEGORIES[0].key,
          dueWithinDays: String(t.default_due_in_days || 7),
        })),
      );
    } catch (error) {
      console.warn('Failed to load chore templates, using defaults', error);
      setQuickStartPresets(DEFAULT_CHORE_PRESETS);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTemplates();
    }, [loadTemplates]),
  );

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

  const handleRecurringToggle = (value: boolean) => {
    setIsRecurring(value);
    if (!value) setSelectedFrequency(null);
  };

  const applyPreset = (preset: ChorePreset) => {
    setSelectedPresetKey(preset.key);
    setTitle(preset.title);
    setDescription(preset.description);
    setSelectedCategory(preset.category);
    setDueWithinDays(preset.dueWithinDays);
    setTitleError(null);
    setDescriptionError(null);
    setDueWithinError(null);
    setNotice(null);
  };

  const handleCreate = useCallback(async () => {
    setNotice(null);
    setTitleError(null);
    setDescriptionError(null);
    setDueWithinError(null);

    const titleTrimmed = title.trim();
    const descriptionTrimmed = description.trim();
    let hasError = false;

    if (!titleTrimmed) {
      setTitleError('Please enter a chore title.');
      hasError = true;
    } else if (titleTrimmed.length < 3 || titleTrimmed.length > 50) {
      setTitleError('Chore title must be between 3 and 50 characters.');
      hasError = true;
    }

    if (descriptionTrimmed.length > 200) {
      setDescriptionError('Description must be under 200 characters.');
      hasError = true;
    }

    const dwdParsed = parseInt(dueWithinDays, 10);
    if (isNaN(dwdParsed) || dwdParsed <= 0 || dwdParsed > 365) {
      setDueWithinError('Due within days must be between 1 and 365.');
      hasError = true;
    }

    if (hasError) return;

    try {
      // 1. Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      // 2. We need the user's active dorm
      const activeDormId = await getActiveDormId();
      if (!activeDormId) {
        throw new Error('Could not find which dorm you belong to.');
      }

      // 3. Create the chore
      await createChore(activeDormId, {
        title: titleTrimmed,
        description: descriptionTrimmed,
        status: 'pending',
        meta: {
          category: selectedCategory,
          isRecurring: isRecurring || false,
          frequency: selectedFrequency,
          due_in_days: dwdParsed,
        },
      });

      router.push('/main/student/chores');
    } catch (e: any) {
      setNotice({ type: 'error', text: e.message || 'Failed to create chore' });
    }
  }, [title, description, dueWithinDays, isRecurring, selectedCategory, selectedFrequency]);

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
            <Text style={styles.heading}>New Chore</Text>

            <Spacer size="medium" />

            <Text style={styles.inputLabel}>Quick start</Text>
            <Text style={styles.manageText}>
              Need to edit this list?{' '}
              <InlineButton
                title="Manage templates"
                onPress={() => router.push('/main/student/chore-templates')}
              />
            </Text>
            <Spacer size="small" />
            <View style={styles.chipRow}>
              {quickStartPresets.map((preset) => (
                <FilterChip
                  key={preset.key}
                  label={preset.label}
                  active={selectedPresetKey === preset.key}
                  onPress={() => applyPreset(preset)}
                />
              ))}
            </View>

            <Spacer size="medium" />

            <Text style={styles.inputLabel}>Title</Text>
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Take out the bins"
              hasError={!!titleError}
              onBlur={() => setTitleError(null)}
            />
            {titleError && (
              <InlineNotification type="error" text={titleError} style={{ marginTop: 4 }} />
            )}

            <Spacer size="medium" />

            <Text style={styles.inputLabel}>
              Description <Text style={styles.optional}>(optional)</Text>
            </Text>

            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Any extra details..."
              multiline
              numberOfLines={3}
              hasError={!!descriptionError}
              onBlur={() => setDescriptionError(null)}
            />
            {descriptionError && (
              <InlineNotification type="error" text={descriptionError} style={{ marginTop: 4 }} />
            )}

            <Spacer size="medium" />

            <Text style={styles.inputLabel}>Due Within (Days)</Text>
            <Input
              value={dueWithinDays}
              onChangeText={setDueWithinDays}
              placeholder="e.g. 7"
              keyboardType="number-pad"
              hasError={!!dueWithinError}
              onBlur={() => setDueWithinError(null)}
            />
            {dueWithinError && (
              <InlineNotification type="error" text={dueWithinError} style={{ marginTop: 4 }} />
            )}
            <Spacer size="medium" />

            <Text style={styles.inputLabel}>Category</Text>

            <Spacer size="small" />

            <CategoryPicker
              options={CATEGORIES}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />

            <Spacer size="medium" />

            <Text style={styles.inputLabel}>Does this chore repeat?</Text>

            <Spacer size="small" />

            <View style={styles.chipRow}>
              <FilterChip
                label="Yes"
                active={isRecurring === true}
                onPress={() => handleRecurringToggle(true)}
              />
              <FilterChip
                label="No"
                active={isRecurring === false}
                onPress={() => handleRecurringToggle(false)}
              />
            </View>

            {isRecurring && (
              <>
                <Spacer size="medium" />
                <Text style={styles.inputLabel}>How often?</Text>
                <Spacer size="small" />
                <View style={styles.chipRow}>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.key}
                      label={option.label}
                      active={selectedFrequency === option.key}
                      onPress={() => setSelectedFrequency(option.key)}
                    />
                  ))}
                </View>
              </>
            )}

            <Spacer size="large" />

            <Button title="Create chore" onPress={handleCreate} variant="standard" />

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
  inputLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLOURS.black,
    marginBottom: 8,
  },
  optional: {
    fontFamily: 'Inter',
    fontWeight: 'normal',
    color: COLOURS.gray[500],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  manageText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: COLOURS.gray[700],
  },
  centerText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.black,
    textAlign: 'center',
  },
});
