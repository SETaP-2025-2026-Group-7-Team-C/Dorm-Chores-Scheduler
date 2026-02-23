import { Stack } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import HeaderBackButton from '../../components/HeaderBackButton';
import ListItem from '../../components/ListItem';

export default function ListItemTestPage() {
  const handlePress = (itemName: string) => {
    Alert.alert(`${itemName} Pressed!`, `You pressed the ${itemName.toLowerCase()} item`);
  };

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
        <Text style={styles.title}>List Item Component Test</Text>
        <Text style={styles.subtitle}>Testing different list item configurations</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Items</Text>
          <View style={styles.listContainer}>
            <ListItem
              title="Settings"
              subtitle="App preferences and configuration"
              iconName="cog"
              onPress={() => handlePress('Settings')}
            />

            <ListItem
              title="Profile"
              subtitle="Manage your account information"
              iconName="user"
              onPress={() => handlePress('Profile')}
            />

            <ListItem
              title="Notifications"
              subtitle="Configure alerts and messages"
              iconName="bell"
              onPress={() => handlePress('Notifications')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title Only</Text>
          <View style={styles.listContainer}>
            <ListItem title="Home" iconName="home" onPress={() => handlePress('Home')} />

            <ListItem title="Search" iconName="search" onPress={() => handlePress('Search')} />

            <ListItem title="Help" iconName="question-circle" onPress={() => handlePress('Help')} />
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
    marginLeft: 20,
    marginTop: 20,
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'left',
    marginLeft: 20,
    marginBottom: 24,
    color: '#000000',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333333',
  },
  listContainer: {
    gap: 8,
  },
});
