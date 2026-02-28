import { Stack } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import CurvedBanner from '../../components/CurvedBanner';
import HeaderBackButton from '../../components/HeaderBackButton';
import Spacer from '../../components/Spacer';
import { COLOURS } from '../../constants/colours';

export default function CurvedBannerTest() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <HeaderBackButton />
        </View>

        <Spacer size="medium" />

        <View style={styles.content}>
          <Text style={styles.title}>Curved Banner Component</Text>
          <Spacer size="small" />
          <Text style={styles.subtitle}>
            Test curved banner variants and responsive design. Each variant uses exact SVG
            parameters ported from the Figma Prototype.
          </Text>
        </View>

        <Spacer size="large" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Large Variant</Text>
          <Spacer size="small" />
          <Text style={styles.description}>
            229×402px | cx=139.09, cy=67.89, rx=335.64, ry=144.00, rotation=-13.60°
          </Text>
          <Spacer size="small" />
          <View style={styles.bannerContainer}>
            <CurvedBanner variant="large" />
          </View>
        </View>

        <Spacer size="large" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medium Variant</Text>
          <Spacer size="small" />
          <Text style={styles.description}>
            194×402px | cx=134.60, cy=49.34, rx=335.64, ry=124.92, rotation=-13.60°
          </Text>
          <Spacer size="small" />
          <View style={styles.bannerContainer}>
            <CurvedBanner variant="medium" />
          </View>
        </View>

        <Spacer size="large" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Small Variant</Text>
          <Spacer size="small" />
          <Text style={styles.description}>
            114×402px | cx=136.47, cy=16.95, rx=335.64, ry=82.12, rotation=-9.24°
          </Text>
          <Spacer size="small" />
          <View style={styles.bannerContainer}>
            <CurvedBanner variant="small" />
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
  description: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLOURS.gray[700],
    lineHeight: 18,
  },
  bannerContainer: {
    backgroundColor: COLOURS.gray[50],
    borderRadius: 8,
    position: 'relative',
  },
});
