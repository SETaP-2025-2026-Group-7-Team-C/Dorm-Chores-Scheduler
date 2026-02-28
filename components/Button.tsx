/**
 * @file Button.tsx
 * @description A customizable button component with multiple visual variants and press states.
 *              Supports standard, secondary, tertiary, and danger styles with automatic
 *              border highlighting on press.
 *
 * @usage
 * ```tsx
 * import Button from '@/components/Button';
 *
 * // Standard button
 * <Button title="Submit" onPress={() => console.log('pressed')} />
 *
 * // Secondary variant
 * <Button title="Cancel" onPress={handleCancel} variant="secondary" />
 *
 * // Disabled button
 * <Button title="Loading..." onPress={() => {}} disabled />
 *
 * // Custom styling
 * <Button
 *   title="Custom"
 *   onPress={handlePress}
 *   style={{ marginTop: 16 }}
 *   textStyle={{ fontSize: 18 }}
 * />
 * ```
 *
 * @props
 * - title: string - The text displayed on the button
 * - onPress: () => void - Callback function triggered on button press
 * - variant?: 'standard' | 'secondary' | 'tertiary' | 'danger' - Visual style variant (default: 'standard')
 * - style?: ViewStyle - Custom styles for the button wrapper
 * - textStyle?: TextStyle - Custom styles for the button text
 * - disabled?: boolean - Whether the button is disabled (default: false)
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { COLOURS } from '../constants/colours';

/** Available button style variants */
type ButtonVariant = 'standard' | 'secondary' | 'tertiary' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'standard',
  style,
  textStyle,
  disabled = false,
}: ButtonProps) {
  // Track press state for border highlight effect
  const [isPressed, setIsPressed] = useState(false);

  /**
   * Returns the appropriate background style based on button variant and disabled state
   */
  const getButtonStyle = () => {
    if (disabled) return styles.disabled;

    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'tertiary':
        return styles.tertiary;
      case 'danger':
        return styles.danger;
      case 'standard':
      default:
        return styles.standard;
    }
  };

  /**
   * Returns the text color based on button variant and disabled state
   */
  const getTextColor = () => {
    if (disabled) return COLOURS.disabled;

    switch (variant) {
      case 'secondary':
        return COLOURS.primaryMuted;
      case 'tertiary':
        return COLOURS.primary;
      case 'danger':
        return COLOURS.white;
      case 'standard':
      default:
        return COLOURS.black;
    }
  };

  /**
   * Returns the border color for the press highlight effect
   */
  const getBorderColor = () => {
    if (disabled) return styles.disabled.backgroundColor;
    switch (variant) {
      case 'secondary':
        return styles.secondary.backgroundColor;
      case 'tertiary':
        return styles.tertiary.backgroundColor;
      case 'danger':
        return styles.danger.backgroundColor;
      case 'standard':
      default:
        return styles.standard.backgroundColor;
    }
  };

  return (
    // Outer wrapper for custom styling
    <View style={[styles.wrapper, style]}>
      {/* Border container that shows highlight effect when pressed */}
      <View
        style={[
          styles.borderContainer,
          isPressed &&
            !disabled && {
              borderColor: getBorderColor(),
              borderWidth: 2,
            },
        ]}
      >
        {/* Main touchable button element */}
        <TouchableOpacity
          style={[styles.button, getButtonStyle()]}
          onPress={onPress}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          disabled={disabled}
          activeOpacity={1}
        >
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: -4,
  },
  borderContainer: {
    borderRadius: 100,
    borderColor: COLOURS.transparent,
    borderWidth: 2,
    padding: 2,
  },
  button: {
    height: 48,
    width: '100%',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  text: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  standard: {
    backgroundColor: COLOURS.primaryLight,
  },
  secondary: {
    backgroundColor: COLOURS.primary,
  },
  tertiary: {
    backgroundColor: COLOURS.primarySoft,
  },
  danger: {
    backgroundColor: COLOURS.error.text,
  },
  disabled: {
    backgroundColor: COLOURS.gray[300],
  },
});
