import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import HeaderBackButton from '../../components/HeaderBackButton';
import Selector, { SelectorOption } from '../../components/Selector';
import Spacer from '../../components/Spacer';
import { COLOURS } from '../../constants/colours';

export default function SelectorTestPage() {
  const [selectedAccountType, setSelectedAccountType] = useState<string>('student');

  const accountTypeOptions: SelectorOption[] = [
    {
      id: 'student',
      icon: 'user-alt',
      title: 'Student',
      subtitle: 'Create and track chores within your student accommodation',
    },
    {
      id: 'manager',
      icon: 'user-tie',
      title: 'Manager',
      subtitle: 'Accept and manage maintenance requests directly from students',
    },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <HeaderBackButton />
        </View>

        <Spacer size="medium" />

        <View style={styles.content}>
          <Text style={styles.title}>Selector Component Test</Text>
          <Spacer size="small" />
          <Text style={styles.subtitle}>
            Test the selector component with different configurations
          </Text>
        </View>

        <Spacer size="large" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Type Selection</Text>
          <Spacer size="small" />
          <Text style={styles.description}>
            Select your account type. Student is selected by default.
          </Text>
          <Spacer size="medium" />
          <Selector
            options={accountTypeOptions}
            selectedId={selectedAccountType}
            onSelect={setSelectedAccountType}
          />
          <Spacer size="medium" />
          <Text style={styles.selectedText}>
            Selected: {accountTypeOptions.find((opt) => opt.id === selectedAccountType)?.title}
          </Text>
        </View>

        <Spacer size="large" />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOURS.white,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  content: {
    marginHorizontal: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLOURS.black,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.gray[700],
    lineHeight: 22,
  },
  section: {
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: COLOURS.black,
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLOURS.gray[700],
    lineHeight: 18,
  },
  selectedText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLOURS.gray[700],
    fontStyle: 'italic',
  },
});
