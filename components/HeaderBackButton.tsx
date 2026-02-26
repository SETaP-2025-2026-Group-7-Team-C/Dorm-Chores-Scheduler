/**
 * @file HeaderBackButton.tsx
 * @description A circular back button component for navigation headers.
 *              Uses FontAwesome5 icons and integrates with expo-router for navigation.
 *              Provides customizable icon, colors, and press behavior.
 *
 * @usage
 * ```tsx
 * import HeaderBackButton from '@/components/HeaderBackButton';
 *
 * // Default back button (navigates back)
 * <HeaderBackButton />
 *
 * // Custom navigation action
 * <HeaderBackButton onPress={() => router.push('/home')} />
 *
 * // Custom icon and colors
 * <HeaderBackButton
 *   iconName="times"
 *   iconColor={COLOURS.white}
 *   backgroundColor={COLOURS.primary}
 * />
 *
 * // With custom styling
 * <HeaderBackButton style={{ marginLeft: 16 }} />
 * ```
 *
 * @props
 * - onPress?: () => void - Callback function triggered on press (default: router.back())
 * - style?: object - Custom styles for the button container
 * - iconColor?: string - Color of the icon (default: COLOURS.black)
 * - backgroundColor?: string - Background color of the button (default: COLOURS.gray[100])
 * - iconName?: keyof FontAwesome5.glyphMap - Icon to display (default: 'chevron-left')
 */

import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLOURS } from '../constants/colours';

interface HeaderBackButtonProps {
  onPress?: () => void;
  style?: object;
  iconColor?: string;
  backgroundColor?: string;
  iconName?: keyof typeof FontAwesome5.glyphMap;
}

export default function HeaderBackButton({
  onPress = () => router.back(),
  style,
  iconColor = COLOURS.black,
  backgroundColor = COLOURS.gray[100],
  iconName = 'chevron-left',
}: HeaderBackButtonProps) {
  return (
    // Circular touchable button with customizable background
    <TouchableOpacity
      style={[styles.headerBackButton, { backgroundColor }, style]}
      onPress={onPress}
    >
      {/* Icon container with slight offset for visual centering */}
      <View style={styles.iconContainer}>
        <FontAwesome5 name={iconName} size={16} color={iconColor} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerBackButton: {
    width: 42,
    height: 42,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  iconContainer: {
    transform: [{ translateX: -1 }],
  },
});
