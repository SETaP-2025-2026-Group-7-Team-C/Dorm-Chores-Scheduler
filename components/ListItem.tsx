/**
 * @file ListItem.tsx
 * @description A pressable list item component with icon, title, subtitle, and chevron.
 *              Designed for navigation menus, settings screens, and action lists.
 *              Includes touch highlight feedback for better user interaction.
 *
 * @usage
 * ```tsx
 * import ListItem from '@/components/ListItem';
 *
 * // Basic list item
 * <ListItem
 *   title="Profile"
 *   iconName="user"
 *   onPress={() => router.push('/profile')}
 * />
 *
 * // With subtitle
 * <ListItem
 *   title="Notifications"
 *   subtitle="Manage your alerts"
 *   iconName="bell"
 *   onPress={handleNotifications}
 * />
 *
 * // Custom icon color
 * <ListItem
 *   title="Settings"
 *   iconName="cog"
 *   iconColor={COLOURS.primary}
 *   onPress={handleSettings}
 * />
 *
 * // With custom styling
 * <ListItem
 *   title="Help"
 *   iconName="question-circle"
 *   onPress={handleHelp}
 *   style={{ marginVertical: 8 }}
 * />
 * ```
 *
 * @props
 * - title: string - The main text displayed in the list item
 * - subtitle?: string - Optional secondary text below the title
 * - iconName: keyof FontAwesome5.glyphMap - FontAwesome5 icon to display
 * - onPress: () => void - Callback function triggered on press
 * - iconColor?: string - Color of the icon (default: COLOURS.black)
 * - style?: object - Custom styles for the list item container
 */

import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { COLOURS } from '../constants/colours';

interface ListItemProps {
  title: string;
  subtitle?: string;
  iconName: keyof typeof FontAwesome5.glyphMap;
  onPress: () => void;
  iconColor?: string;
  style?: object;
}

export default function ListItem({
  title,
  subtitle,
  iconName,
  onPress,
  iconColor = COLOURS.black,
  style,
}: ListItemProps) {
  return (
    // TouchableHighlight provides press feedback with underlay color
    <TouchableHighlight
      style={[styles.container, style]}
      onPress={onPress}
      underlayColor={COLOURS.gray[200]}
      activeOpacity={0.9}
    >
      <View style={styles.innerContainer}>
        {/* Circular icon container */}
        <View style={styles.iconCircle}>
          <FontAwesome5 name={iconName} size={16} color={iconColor} />
        </View>

        {/* Text content area (title and optional subtitle) */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {/* Navigation chevron indicator */}
        <FontAwesome5 name="chevron-right" size={16} color={COLOURS.black} />
      </View>
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    paddingVertical: 4,
    marginHorizontal: -4,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: 4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    backgroundColor: COLOURS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLOURS.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: COLOURS.black,
    lineHeight: 16,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: COLOURS.black,
    lineHeight: 14,
    marginTop: 2,
  },
});
