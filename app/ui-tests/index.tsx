import { Stack, router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import HeaderBackButton from '../../components/HeaderBackButton';
import ListItem from '../../components/ListItem';
import Spacer from '../../components/Spacer';
import { COLOURS } from '../../constants/colours';

export default function UITestHub() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <HeaderBackButton iconName="times" />
        </View>

        <Spacer size="medium" />

        <View style={styles.content}>
          <Text style={styles.title}>UI Test Page</Text>
          <Spacer size="small" />
          <Text style={styles.subtitle}>Navigate to individual component test pages</Text>
        </View>

        <Spacer size="large" />

        <View style={styles.linksContainer}>
          <ListItem
            title="Button Component"
            subtitle="Test all button variants and states"
            iconName="square"
            onPress={() => router.push('/ui-tests/button-test')}
          />
          <Spacer size="small" />
          <ListItem
            title="List Item Component"
            subtitle="Test list item layouts and interactions"
            iconName="list"
            onPress={() => router.push('/ui-tests/list-item-test')}
          />
          <Spacer size="small" />
          <ListItem
            title="Inline Notification Component"
            subtitle="Test all notification types and customizations"
            iconName="bell"
            onPress={() => router.push('/ui-tests/inline-notification-test')}
          />
          <Spacer size="small" />
          <ListItem
            title="Input Component"
            subtitle="Test input states, styling and interactions"
            iconName="pencil-alt"
            onPress={() => router.push('/ui-tests/input-test')}
          />
          <Spacer size="small" />
          <ListItem
            title="Selector Component"
            subtitle="Test selector options and selection states"
            iconName="check-square"
            onPress={() => router.push('/ui-tests/selector-test')}
          />
          <Spacer size="small" />
          <ListItem
            title="Curved Banner Component"
            subtitle="Test curved banner variants and responsive design"
            iconName="image"
            onPress={() => router.push('/ui-tests/curved-banner-test')}
          />
        </View>

        <Spacer size="large" />
      </View>
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
  linksContainer: {
    marginHorizontal: 20,
  },
});
