import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../../components/Button';
import HeaderBackButton from '../../../components/HeaderBackButton';
import InlineNotification from '../../../components/InlineNotification';
import Input from '../../../components/Input';
import SortDropdown from '../../../components/SortDropdown';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { getCurrentUser } from '../../../lib/auth';
import { getActiveDormId } from '../../../lib/dorms';
import {
  ChoreOptOut,
  createChoreOptOut,
  deleteChoreOptOut,
  getChoreOptOuts,
  getDormChoreOptOuts,
} from '../../../lib/optOuts';

const CATEGORY_OPTIONS = [
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'bathroom', label: 'Bathroom' },
  { key: 'corridor', label: 'Corridor' },
  { key: 'bins', label: 'Bins' },
  { key: 'floors', label: 'Floors' },
  { key: 'other', label: 'Other' },
];

export default function ChoreOptOutScreen() {
  const [ownOptOuts, setOwnOptOuts] = useState<ChoreOptOut[]>([]);
  const [dormOptOuts, setDormOptOuts] = useState<ChoreOptOut[]>([]);
  const [category, setCategory] = useState('');
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState<{
    type: 'error' | 'success' | 'info' | 'warning' | 'tip';
    text: string;
  } | null>(null);

  const loadOptOuts = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      const dormId = await getActiveDormId();
      if (!user?.id || !dormId) return;
      const [ownRows, dormRows] = await Promise.all([
        getChoreOptOuts(user.id, dormId),
        getDormChoreOptOuts(dormId),
      ]);
      setOwnOptOuts(ownRows);
      setDormOptOuts(dormRows);
    } catch (error: any) {
      setNotice({ type: 'error', text: error?.message || 'Failed to load opt-outs' });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOptOuts();
    }, [loadOptOuts]),
  );

  const handleCreate = async () => {
    try {
      const user = await getCurrentUser();
      const dormId = await getActiveDormId();
      if (!user?.id || !dormId) throw new Error('You need an active dorm and account');

      await createChoreOptOut(user.id, dormId, {
        category: category.trim() || null,
        reason: reason.trim() || null,
      });
      setCategory('');
      setReason('');
      setNotice({ type: 'success', text: 'Opt-out saved.' });
      await loadOptOuts();
    } catch (error: any) {
      setNotice({ type: 'error', text: error?.message || 'Failed to save opt-out' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChoreOptOut(id);
      setNotice({ type: 'success', text: 'Opt-out removed.' });
      await loadOptOuts();
    } catch (error: any) {
      setNotice({ type: 'error', text: error?.message || 'Failed to delete opt-out' });
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <View style={styles.topBar}>
        <HeaderBackButton iconName="times" />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.heading}>Opt-outs</Text>
          <Spacer size="small" />
          <Text style={styles.subheading}>Provide a category to opt out for specific chores.</Text>
          <Spacer size="small" />
          {notice ? <InlineNotification type={notice.type} text={notice.text} /> : null}

          <Spacer size="medium" />
          <Text style={styles.sectionTitle}>Category</Text>
          <Spacer size="small" />
          <SortDropdown
            options={CATEGORY_OPTIONS.map((c) => c.label)}
            selected={
              CATEGORY_OPTIONS.find((c) => c.key === category)?.label || CATEGORY_OPTIONS[0].label
            }
            onSelect={(selectedLabel) => {
              const option = CATEGORY_OPTIONS.find((c) => c.label === selectedLabel);
              setCategory(option?.key || '');
            }}
          />
          <Spacer size="small" />
          <Input value={reason} onChangeText={setReason} placeholder="Reason (optional)" />
          <Spacer size="small" />
          <Button title="Save opt-out" onPress={handleCreate} />

          <Spacer size="large" />
          <Text style={styles.sectionTitle}>Your opt-outs</Text>
          <Spacer size="small" />
          {ownOptOuts.length === 0 ? (
            <Text style={styles.empty}>No opt-outs set.</Text>
          ) : (
            ownOptOuts.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.category || 'All categories'}</Text>
                {item.reason ? <Text style={styles.cardText}>Reason: {item.reason}</Text> : null}
                <Spacer size="small" />
                <Button title="Delete" variant="danger" onPress={() => handleDelete(item.id)} />
              </View>
            ))
          )}

          <Spacer size="medium" />
          <Text style={styles.sectionTitle}>Dorm opt-outs (shared)</Text>
          <Spacer size="small" />
          {dormOptOuts.length === 0 ? (
            <Text style={styles.empty}>No dorm opt-outs available.</Text>
          ) : (
            dormOptOuts.map((item) => (
              <View key={item.id} style={styles.cardShared}>
                <Text style={styles.cardTitle}>
                  {item.user_name || 'Dorm member'} - {item.category || 'All categories'}
                </Text>
                {item.reason ? <Text style={styles.cardText}>Reason: {item.reason}</Text> : null}
              </View>
            ))
          )}

          <Spacer size="large" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOURS.white },
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLOURS.white,
  },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 100 },
  content: { marginHorizontal: 20 },
  heading: { fontFamily: 'Inter-Bold', fontSize: 28, color: COLOURS.black },
  subheading: { fontFamily: 'Inter', fontSize: 15, color: COLOURS.gray[500], lineHeight: 22 },
  sectionTitle: { fontFamily: 'Inter-Bold', fontSize: 16, color: COLOURS.black },
  empty: { fontFamily: 'Inter', fontSize: 14, color: COLOURS.gray[700] },
  card: {
    backgroundColor: COLOURS.gray[100],
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  cardShared: {
    backgroundColor: COLOURS.primarySoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  cardTitle: { fontFamily: 'Inter-Bold', fontSize: 14, color: COLOURS.black },
  cardText: { fontFamily: 'Inter', fontSize: 13, color: COLOURS.black, marginTop: 2 },
});
