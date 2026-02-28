import { Stack } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import HeaderBackButton from '../../components/HeaderBackButton';
import ListItem from '../../components/ListItem';
import Spacer from '../../components/Spacer';
import { COLOURS } from '../../constants/colours';

export default function ListItemTestPage() {
  const handlePress = (itemName: string) => {
    Alert.alert(`${itemName} Pressed!`, `You pressed the ${itemName.toLowerCase()} item`);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <HeaderBackButton />
        </View>

        <Spacer size="medium" />

        <View style={styles.content}>
          <Text style={styles.title}>List Item Component Test</Text>
          <Spacer size="small" />
          <Text style={styles.subtitle}>Test list item layouts and interactions</Text>
        </View>

        <Spacer size="large" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Items</Text>
          <Spacer size="small" />
          <View style={styles.listContainer}>
            <ListItem
              title="Settings"
              subtitle="App preferences and configuration"
              iconName="cog"
              onPress={() => handlePress('Settings')}
            />
            <Spacer size="small" />
            <ListItem
              title="Profile"
              subtitle="Manage your account information"
              iconName="user"
              onPress={() => handlePress('Profile')}
            />
            <Spacer size="small" />
            <ListItem
              title="Notifications"
              subtitle="Configure alerts and messages"
              iconName="bell"
              onPress={() => handlePress('Notifications')}
            />
          </View>
        </View>

        <Spacer size="large" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title Only</Text>
          <Spacer size="small" />
          <View style={styles.listContainer}>
            <ListItem title="Home" iconName="home" onPress={() => handlePress('Home')} />
            <Spacer size="small" />
            <ListItem title="Search" iconName="search" onPress={() => handlePress('Search')} />
            <Spacer size="small" />
            <ListItem title="Help" iconName="question-circle" onPress={() => handlePress('Help')} />
          </View>
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
  listContainer: {},
});
