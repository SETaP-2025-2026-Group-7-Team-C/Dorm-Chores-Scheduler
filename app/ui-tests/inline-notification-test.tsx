import { Stack } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import HeaderBackButton from '../../components/HeaderBackButton';
import InlineNotification from '../../components/InlineNotification';

export default function InlineNotificationTest() {
  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Inline Notification Component</Text>
        <Text style={styles.subtitle}>Test all notification types and customizations</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error Notifications</Text>
          <InlineNotification
            type="error"
            text="This is an error message with default icon."
            style={styles.notificationSpacing}
          />
          <InlineNotification
            type="error"
            text="This is an error message with a custom icon."
            iconName="ban"
            style={styles.notificationSpacing}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warning Notifications</Text>
          <InlineNotification
            type="warning"
            text="This is a warning message with default icon."
            style={styles.notificationSpacing}
          />
          <InlineNotification
            type="warning"
            text="This is a warning with a custom icon."
            iconName="warning"
            style={styles.notificationSpacing}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Info Notifications</Text>
          <InlineNotification
            type="info"
            text="This is an informational message with default icon."
            style={styles.notificationSpacing}
          />
          <InlineNotification
            type="info"
            text="This is an info message with a custom icon."
            iconName="question-circle"
            style={styles.notificationSpacing}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Success Notifications</Text>
          <InlineNotification
            type="success"
            text="This is a success message with default icon."
            style={styles.notificationSpacing}
          />
          <InlineNotification
            type="success"
            text="This is a success with a custom icon."
            iconName="thumbs-up"
            style={styles.notificationSpacing}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tip Notifications</Text>
          <InlineNotification
            type="tip"
            text="This is a tip message with default icon."
            style={styles.notificationSpacing}
          />
          <InlineNotification
            type="tip"
            text="This is a tip with a custom icon."
            iconName="star"
            style={styles.notificationSpacing}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Long Text Examples</Text>
          <InlineNotification
            type="error"
            text="This is a much longer error message that demonstrates how the component handles text wrapping when the content spans multiple lines. The layout should expand vertically to accommodate all the text."
            style={styles.notificationSpacing}
          />
          <InlineNotification
            type="success"
            text="This is a longer success message that shows how the component adapts to different text lengths while maintaining proper spacing and alignment of the icon and text."
            style={styles.notificationSpacing}
          />
        </View>
        <View style={{ height: 50 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'left',
    marginBottom: 24,
    color: '#666666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  notificationSpacing: {
    marginBottom: 8,
  },
});
