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
import { getActiveDormId } from '../../../lib/dorms';
import { createRepairRequest } from '../../../lib/repairs';
import { supabase } from '../../../lib/supabase';

const GRADIENT_THRESHOLD = 24;

const CATEGORIES: CategoryOption[] = [
  { key: 'kitchen', label: 'Kitchen', iconName: 'utensils' },
  { key: 'bathroom', label: 'Bathroom', iconName: 'bath' },
  { key: 'corridor', label: 'Corridor', iconName: 'house-user' },
  { key: 'bedroom', label: 'Bedroom', iconName: 'bed' },
  { key: 'exterior', label: 'Exterior', iconName: 'door-open' },
  { key: 'other', label: 'Other', iconName: 'ellipsis-h' },
];

const PRIORITY_OPTIONS: { key: string; label: string }[] = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
];

export default function RequestRepair() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(CATEGORIES[0].key);
  const [selectedPriority, setSelectedPriority] = useState<string | null>('medium');
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

  const handleSubmit = useCallback(async () => {
    setNotice(null);

    if (!title.trim()) {
      setNotice({ type: 'error', text: 'Please enter a title for the repair' });
      return;
    }
    if (!description.trim()) {
      setNotice({ type: 'error', text: 'Please enter a description for the repair' });
      return;
    }
    if (!selectedCategory) {
      setNotice({ type: 'error', text: 'Please select a category' });
      return;
    }
    if (!selectedPriority) {
      setNotice({ type: 'error', text: 'Please select a priority level' });
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not logged in');
      }

      const activeDormId = await getActiveDormId();
      if (!activeDormId) {
        throw new Error('Could not find which dorm you belong to.');
      }

      const urgency = selectedPriority as 'low' | 'medium' | 'high';
      await createRepairRequest(activeDormId, user.id, {
        title,
        description,
        location: selectedCategory,
        urgency,
      });

      router.push('/main/student/repairs');
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Failed to submit repair request' });
    }
  }, [title, description, selectedCategory, selectedPriority]);

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
            <Text style={styles.heading}>New Repair</Text>

            <Spacer size="small" />

            <Text style={styles.subheading}>
              Log something that needs fixing in your dorm. Your landlord or manager will be
              notified
            </Text>

            <Spacer size="large" />

            <Text style={styles.inputLabel}>Title</Text>
            <Input value={title} onChangeText={setTitle} placeholder="e.g. Broken bathroom light" />

            <Spacer size="medium" />

            <Text style={styles.inputLabel}>Description</Text>
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue in more detail..."
              multiline
              numberOfLines={3}
            />

            <Spacer size="medium" />

            <Text style={styles.inputLabel}>Category</Text>

            <Spacer size="small" />

            <CategoryPicker
              options={CATEGORIES}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />

            <Spacer size="medium" />

            <Text style={styles.inputLabel}>Priority</Text>

            <Spacer size="small" />

            <View style={styles.chipRow}>
              {PRIORITY_OPTIONS.map((option) => (
                <FilterChip
                  key={option.key}
                  label={option.label}
                  active={selectedPriority === option.key}
                  onPress={() => setSelectedPriority(option.key)}
                />
              ))}
            </View>

            <Spacer size="large" />

            <Button title="Submit repair" onPress={handleSubmit} variant="standard" />

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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  centerText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.black,
    textAlign: 'center',
  },
});
