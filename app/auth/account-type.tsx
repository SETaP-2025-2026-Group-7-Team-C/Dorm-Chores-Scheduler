import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import CurvedBanner from '../../components/CurvedBanner';
import InlineButton from '../../components/InlineButton';
import Selector, { SelectorOption } from '../../components/Selector';
import Spacer from '../../components/Spacer';
import { COLOURS } from '../../constants/colours';

export default function AccountSelector() {
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
        <CurvedBanner variant="medium" />

        <Spacer size="small" />

        {/* Title */}
        <View style={styles.content}>
          <Text style={styles.title}>ACCOUNT TYPE</Text>
          <Text style={styles.subtitle}>Choose your account type</Text>
        </View>

        <Spacer size="large" />

        {/* Selector Section */}
        <View style={styles.content}>
          <Text style={styles.selectedText}>Account Type</Text>

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

        {/* Select Button */}
        <View style={styles.content}>
          <Button title="Select" onPress={() => router.push('/auth/signup')} />
        </View>

        <Spacer size="medium" />

        {/* Sign In Link */}
        <Text style={[styles.bodyText, styles.centerText]}>
          Already have an account?{' '}
          <InlineButton title="Sign in" onPress={() => router.push('/auth/signin')} />
        </Text>

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
  content: {
    marginHorizontal: 24,
  },
  title: {
    fontFamily: 'Inter-Black',
    fontSize: 56,
    color: COLOURS.primary,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.primary,
  },
  selectedText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLOURS.primary,
  },
  bodyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.black,
  },
  centerText: {
    textAlign: 'center',
  },
});
