import { Stack, router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import HeaderBackButton from '../../components/HeaderBackButton';
import ListItem from '../../components/ListItem';

export default function UITestHub() {
  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => <HeaderBackButton iconName="close" />,
        }}
      />
      <View style={styles.container}>
        <Text style={styles.title}>UI Test Page</Text>
        <Text style={styles.subtitle}>Navigate to individual component test pages</Text>

        <View style={styles.linksContainer}>
          <ListItem
            title="Button Component"
            subtitle="Test all button variants and states"
            iconName="square"
            onPress={() => router.push('/ui-tests/button-test')}
          />

          <ListItem
            title="List Item Component"
            subtitle="Test list item layouts and interactions"
            iconName="list"
            onPress={() => router.push('/ui-tests/list-item-test')}
          />

          <ListItem
            title="Inline Notification Component"
            subtitle="Test all notification types and customizations"
            iconName="bell"
            onPress={() => router.push('/ui-tests/inline-notification-test')}
          />

          <ListItem
            title="Input Component"
            subtitle="Test input states, styling and interactions"
            iconName="pencil"
            onPress={() => router.push('/ui-tests/input-test')}
          />
        </View>
      </View>
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
    color: '#000000',
  },
  linksContainer: {
    gap: 8,
  },
});
