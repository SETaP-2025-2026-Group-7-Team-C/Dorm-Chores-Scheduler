import { Stack } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import HeaderBackButton from '../../components/HeaderBackButton';
import InlineButton from '../../components/InlineButton';
import Spacer from '../../components/Spacer';
import { COLOURS } from '../../constants/colours';

export default function ButtonTestPage() {
  const handleStandardPress = () => {
    Alert.alert('Standard Button Pressed!', 'You pressed the standard button');
  };

  const handleSecondaryPress = () => {
    Alert.alert('Secondary Button Pressed!', 'You pressed the secondary button');
  };

  const handleTertiaryPress = () => {
    Alert.alert('Tertiary Button Pressed!', 'You pressed the tertiary button');
  };

  const handleDangerPress = () => {
    Alert.alert('Danger Button Pressed!', 'You pressed the danger button');
  };

  const handleInlinePress = () => {
    Alert.alert('Inline Button Pressed!', 'You pressed an inline button');
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
          <Text style={styles.title}>Button Component</Text>
          <Spacer size="small" />
          <Text style={styles.subtitle}>Testing different button variants and states</Text>
        </View>

        <Spacer size="large" />
        <View style={styles.content}>
          <Button title="Standard Button" onPress={handleStandardPress} variant="standard" />

          <Spacer size="medium" />

          <Button title="Secondary Button" onPress={handleSecondaryPress} variant="secondary" />

          <Spacer size="medium" />

          <Button title="Tertiary Button" onPress={handleTertiaryPress} variant="tertiary" />

          <Spacer size="medium" />

          <Button title="Danger Button" onPress={handleDangerPress} variant="danger" />

          <Spacer size="medium" />

          <Button title="Disabled Button" onPress={() => {}} disabled={true} />
        </View>

        <Spacer size="large" />

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Inline Button Component</Text>
          <Spacer size="small" />
          <Text style={styles.subtitle}>
            Testing inline buttons that inherit text size from their context
          </Text>
        </View>

        <Spacer size="medium" />

        <View style={styles.content}>
          <Text style={styles.bodyText}>
            Here is some body text with an{' '}
            <InlineButton title="inline link" onPress={handleInlinePress} /> that inherits the text
            size.
          </Text>

          <Spacer size="medium" />

          <Text style={styles.largeText}>
            Large text with <InlineButton title="inline button" onPress={handleInlinePress} /> that
            inherits the text size.
          </Text>

          <Spacer size="medium" />

          <Text style={styles.smallText}>
            Small text with <InlineButton title="inline link" onPress={handleInlinePress} /> that
            inherits the text size.
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
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: COLOURS.black,
  },
  bodyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.black,
    lineHeight: 24,
  },
  largeText: {
    fontFamily: 'Inter',
    fontSize: 20,
    color: COLOURS.black,
    lineHeight: 28,
  },
  smallText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: COLOURS.black,
    lineHeight: 18,
  },
});
