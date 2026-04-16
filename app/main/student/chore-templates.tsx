import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../../components/Button';
import CategoryPicker, { CategoryOption } from '../../../components/CategoryPicker';
import HeaderBackButton from '../../../components/HeaderBackButton';
import InlineNotification from '../../../components/InlineNotification';
import Input from '../../../components/Input';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { getCurrentUser } from '../../../lib/auth';
import {
  ChoreTemplate,
  createChoreTemplate,
  deleteChoreTemplate,
  getChoreTemplates,
  updateChoreTemplate,
} from '../../../lib/choreTemplates';
import { getActiveDormId } from '../../../lib/dorms';

const CATEGORIES: CategoryOption[] = [
  { key: 'kitchen', label: 'Kitchen', iconName: 'utensils' },
  { key: 'bathroom', label: 'Bathroom', iconName: 'bath' },
  { key: 'corridor', label: 'Corridor', iconName: 'house-user' },
  { key: 'bins', label: 'Bins', iconName: 'trash' },
  { key: 'floors', label: 'Floors', iconName: 'broom' },
  { key: 'other', label: 'Other', iconName: 'ellipsis-h' },
];

const capitalize = (str: string | null) => {
  if (!str) return 'Other';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function ChoreTemplatesScreen() {
  const [templates, setTemplates] = useState<ChoreTemplate[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDays, setDueDays] = useState('7');
  const [category, setCategory] = useState<string | null>(CATEGORIES[0].key);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    type: 'error' | 'success' | 'info' | 'warning' | 'tip';
    text: string;
  } | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      const dormId = await getActiveDormId();
      if (!dormId) {
        setTemplates([]);
        return;
      }
      const rows = await getChoreTemplates(dormId, true);
      setTemplates(rows);
    } catch (error: any) {
      setNotice({ type: 'error', text: error?.message || 'Failed to load templates' });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTemplates();
    }, [loadTemplates]),
  );

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDays('7');
    setCategory(CATEGORIES[0].key);
    setEditingId(null);
  };

  const handleSave = async () => {
    setNotice(null);
    const titleTrimmed = title.trim();
    const due = parseInt(dueDays, 10);
    if (!titleTrimmed) {
      setNotice({ type: 'error', text: 'Template title is required.' });
      return;
    }
    if (Number.isNaN(due) || due < 1 || due > 365) {
      setNotice({ type: 'error', text: 'Due days must be between 1 and 365.' });
      return;
    }

    try {
      const dormId = await getActiveDormId();
      const user = await getCurrentUser();
      if (!dormId || !user?.id) throw new Error('You need to be signed in with an active dorm.');

      if (editingId) {
        await updateChoreTemplate(editingId, {
          title: titleTrimmed,
          description,
          category,
          default_due_in_days: due,
        });
        setNotice({ type: 'success', text: 'Template updated.' });
      } else {
        await createChoreTemplate(dormId, user.id, {
          title: titleTrimmed,
          description,
          category,
          default_due_in_days: due,
        });
        setNotice({ type: 'success', text: 'Template created.' });
      }
      resetForm();
      await loadTemplates();
    } catch (error: any) {
      setNotice({ type: 'error', text: error?.message || 'Failed to save template' });
    }
  };

  const handleEdit = (template: ChoreTemplate) => {
    setEditingId(template.id);
    setTitle(template.title);
    setDescription(template.description || '');
    setDueDays(String(template.default_due_in_days || 7));
    setCategory(template.category || CATEGORIES[0].key);
    setNotice(null);
  };

  const handleDelete = async (templateId: string) => {
    try {
      await deleteChoreTemplate(templateId);
      if (editingId === templateId) resetForm();
      await loadTemplates();
      setNotice({ type: 'success', text: 'Template deleted.' });
    } catch (error: any) {
      setNotice({ type: 'error', text: error?.message || 'Failed to delete template' });
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
          <Text style={styles.heading}>Chore Templates</Text>
          <Spacer size="small" />
          <Text style={styles.subheading}>
            Shared templates for your dorm&apos;s weekly planning.
          </Text>

          <Spacer size="medium" />
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>{editingId ? 'Edit template' : 'New template'}</Text>
            <Input value={title} onChangeText={setTitle} placeholder="Template title" />
            <Spacer size="medium" />
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description"
              multiline
              numberOfLines={3}
            />
            <Spacer size="medium" />
            <Input
              value={dueDays}
              onChangeText={setDueDays}
              placeholder="Due in days"
              keyboardType="number-pad"
            />
            <Spacer size="medium" />
            <CategoryPicker options={CATEGORIES} selected={category} onSelect={setCategory} />
            <Spacer size="large" />
            <Button
              title={editingId ? 'Update template' : 'Create template'}
              onPress={handleSave}
            />
            {editingId ? (
              <>
                <Spacer size="small" />
                <Button title="Cancel editing" variant="secondary" onPress={resetForm} />
              </>
            ) : null}
          </View>

          {notice ? (
            <>
              <Spacer size="medium" />
              <InlineNotification type={notice.type} text={notice.text} />
            </>
          ) : null}

          <Spacer size="large" />
          <Text style={styles.inputLabel}>Current templates</Text>
          <Spacer size="small" />
          {templates.length === 0 ? (
            <Text style={styles.empty}>No templates yet.</Text>
          ) : (
            templates.map((template) => (
              <View key={template.id} style={styles.templateCard}>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.templateMeta}>
                  {capitalize(template.category)} | Due in {template.default_due_in_days} day(s)
                </Text>
                {template.description ? (
                  <>
                    <Spacer size="small" />
                    <Text style={styles.templateDescription}>{template.description}</Text>
                  </>
                ) : null}
                <Spacer size="medium" />
                <View style={styles.cardActions}>
                  <View style={styles.actionButton}>
                    <Button title="Edit" variant="secondary" onPress={() => handleEdit(template)} />
                  </View>
                  <View style={styles.actionButton}>
                    <Button
                      title="Delete"
                      variant="danger"
                      onPress={() => handleDelete(template.id)}
                    />
                  </View>
                </View>
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
    paddingBottom: 16,
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
  formContainer: {
    paddingVertical: 8,
  },
  inputLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLOURS.black,
    marginBottom: 12,
  },
  empty: { fontFamily: 'Inter', fontSize: 14, color: COLOURS.gray[700] },
  templateCard: {
    backgroundColor: COLOURS.gray[100],
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  templateTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: COLOURS.black },
  templateMeta: { fontFamily: 'Inter', fontSize: 14, color: COLOURS.gray[700], marginTop: 4 },
  templateDescription: { fontFamily: 'Inter', fontSize: 14, color: COLOURS.black, lineHeight: 20 },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
