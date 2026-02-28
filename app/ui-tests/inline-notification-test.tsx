import { Stack } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import HeaderBackButton from '../../components/HeaderBackButton';
import InlineNotification from '../../components/InlineNotification';
import Spacer from '../../components/Spacer';
import { COLOURS } from '../../constants/colours';

export default function InlineNotificationTest() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <HeaderBackButton />
        </View>

        <Spacer size="medium" />

        <View style={styles.content}>
          <Text style={styles.title}>Inline Notification Component</Text>
          <Spacer size="small" />
          <Text style={styles.subtitle}>Test all notification types and customizations</Text>
        </View>

        <Spacer size="large" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error Notifications</Text>
          <Spacer size="small" />
          <InlineNotification
            type="error"
            text="This is an error message with default icon."
            style={styles.notificationSpacing}
          />
          <Spacer size="small" />
          <InlineNotification
            type="error"
            text="This is an error message with a custom icon."
            iconName="ban"
            style={styles.notificationSpacing}
          />
        </View>

        <Spacer size="large" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warning Notifications</Text>
          <Spacer size="small" />
          <InlineNotification
            type="warning"
            text="This is a warning message with default icon."
            style={styles.notificationSpacing}
          />
          <Spacer size="small" />
          <InlineNotification
            type="warning"
            text="This is a warning with a custom icon."
            iconName="flag-checkered"
            style={styles.notificationSpacing}
          />
        </View>

        <Spacer size="large" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Info Notifications</Text>
          <Spacer size="small" />
          <InlineNotification
            type="info"
            text="This is an informational message with default icon."
            style={styles.notificationSpacing}
          />
          <Spacer size="small" />
          <InlineNotification
            type="info"
            text="This is an info message with a custom icon."
            iconName="question-circle"
            style={styles.notificationSpacing}
          />
        </View>

        <Spacer size="large" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Success Notifications</Text>
          <Spacer size="small" />
          <InlineNotification
            type="success"
            text="This is a success message with default icon."
            style={styles.notificationSpacing}
          />
          <Spacer size="small" />
          <InlineNotification
            type="success"
            text="This is a success with a custom icon."
            iconName="thumbs-up"
            style={styles.notificationSpacing}
          />
        </View>

        <Spacer size="large" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tip Notifications</Text>
          <Spacer size="small" />
          <InlineNotification
            type="tip"
            text="This is a tip message with default icon."
            style={styles.notificationSpacing}
          />
          <Spacer size="small" />
          <InlineNotification
            type="tip"
            text="This is a tip with a custom icon."
            iconName="star"
            style={styles.notificationSpacing}
          />
        </View>

        <Spacer size="large" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Long Text Examples</Text>
          <Spacer size="small" />
          <InlineNotification
            type="error"
            text="This is a much longer error message that demonstrates how the component handles text wrapping when the content spans multiple lines. The layout should expand vertically to accommodate all the text."
            style={styles.notificationSpacing}
          />
          <Spacer size="small" />
          <InlineNotification
            type="success"
            text="This is a longer success message that shows how the component adapts to different text lengths while maintaining proper spacing and alignment of the icon and text."
            style={styles.notificationSpacing}
          />
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
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: COLOURS.black,
  },
  section: {
    marginHorizontal: 20,
  },
  notificationSpacing: {},
});
