/**
 * @file ToggleItem.tsx
 * @description A toggleable list item component with optional icon and a custom toggle switch.
 *              Available in two variants: with icon (matches ListItem style) and without icon.
 *              Toggle is 36×18, 8 border radius, primary colour when on, gray[300] when off.
 *
 * @usage
 * ```tsx
 * import ToggleItem from '@/components/ToggleItem';
 *
 * // With icon
 * <ToggleItem
 *   title="Allow notifications"
 *   iconName="bell"
 *   value={enabled}
 *   onValueChange={setEnabled}
 * />
 *
 * // Without icon
 * <ToggleItem
 *   title="Something"
 *   value={enabled}
 *   onValueChange={setEnabled}
 * />
 *
 * // Disabled
 * <ToggleItem
 *   title="Something"
 *   value={false}
 *   onValueChange={setEnabled}
 *   disabled
 * />
 * ```
 *
 * @props
 * - title: string                           - Main label text
 * - iconName?: keyof FontAwesome5.glyphMap  - Optional icon; omit for icon-less variant
 * - value: boolean                          - Current toggle state
 * - onValueChange: (value: boolean) => void - Callback when toggled
 * - iconColor?: string                      - Icon colour (default: COLOURS.black)
 * - disabled?: boolean                      - Disables interaction and dims the item
 * - style?: object                          - Custom styles for the outer container
 */

import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { COLOURS } from '../constants/colours';

// Toggle dimensions
const TOGGLE_WIDTH = 36;
const TOGGLE_HEIGHT = 18;
const TOGGLE_RADIUS = 8;
const CIRCLE_SIZE = TOGGLE_HEIGHT - 6;
const CIRCLE_TRAVEL = TOGGLE_WIDTH - CIRCLE_SIZE - 6;

interface ToggleItemProps {
  title: string;
  iconName?: keyof typeof FontAwesome5.glyphMap;
  value: boolean;
  onValueChange: (value: boolean) => void;
  iconColor?: string;
  disabled?: boolean;
  style?: object;
}

export default function ToggleItem({
  title,
  iconName,
  value,
  onValueChange,
  iconColor = COLOURS.black,
  disabled = false,
  style,
}: ToggleItemProps) {
  const translateX = useRef(new Animated.Value(value ? CIRCLE_TRAVEL : 0)).current;
  const backgroundAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: value ? CIRCLE_TRAVEL : 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 20,
      }),
      Animated.timing(backgroundAnim, {
        toValue: value ? 1 : 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  }, [value, translateX, backgroundAnim]);

  const backgroundColor = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLOURS.gray[300], COLOURS.primaryStrong],
  });

  const hasIcon = !!iconName;

  return (
    <TouchableHighlight
      style={[styles.container, style, disabled && styles.disabled]}
      onPress={() => !disabled && onValueChange(!value)}
      underlayColor={COLOURS.gray[200]}
      activeOpacity={0.9}
      disabled={disabled}
    >
      <View style={styles.innerContainer}>
        {/* Icon circle - only rendered in icon variant */}
        {hasIcon && (
          <View style={styles.iconCircle}>
            <FontAwesome5 name={iconName} size={16} color={iconColor} />
          </View>
        )}

        {/* Title */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Toggle switch */}
        <Pressable
          onPress={() => !disabled && onValueChange(!value)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={disabled}
        >
          <Animated.View style={[styles.track, { backgroundColor }]}>
            <Animated.View
              style={[
                styles.thumb,
                { transform: [{ translateX }] },
                disabled && styles.thumbDisabled,
              ]}
            />
          </Animated.View>
        </Pressable>
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
  track: {
    width: TOGGLE_WIDTH,
    height: TOGGLE_HEIGHT,
    borderRadius: TOGGLE_RADIUS,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  thumb: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: COLOURS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  thumbDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled: {
    opacity: 0.4,
  },
});
