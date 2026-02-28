/**
 * @file InlineNotification.tsx
 * @description A notification banner component for displaying contextual messages.
 *              Supports multiple notification types (error, warning, info, success, tip)
 *              with automatic color theming and icons. Designed for inline form validation,
 *              alerts, and informational messages.
 *
 * @usage
 * ```tsx
 * import InlineNotification from '@/components/InlineNotification';
 *
 * // Error notification
 * <InlineNotification type="error" text="Invalid email address" />
 *
 * // Success notification
 * <InlineNotification type="success" text="Account created successfully!" />
 *
 * // Warning with custom icon
 * <InlineNotification
 *   type="warning"
 *   text="Your session will expire soon"
 *   iconName="clock"
 * />
 *
 * // Info notification with custom styling
 * <InlineNotification
 *   type="info"
 *   text="Updates available"
 *   style={{ marginTop: 16 }}
 * />
 * ```
 *
 * @props
 * - type: 'error' | 'warning' | 'info' | 'success' | 'tip' - Notification type (determines colors and default icon)
 * - text: string - The notification message to display
 * - iconName?: keyof FontAwesome5.glyphMap - Custom icon override (defaults based on type)
 * - style?: ViewStyle - Custom styles for the notification container
 */

import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLOURS } from '../constants/colours';

/** Available notification type variants */
type NotificationType = 'error' | 'warning' | 'info' | 'success' | 'tip';

interface InlineNotificationProps {
  type: NotificationType;
  text: string;
  iconName?: keyof typeof FontAwesome5.glyphMap;
  style?: ViewStyle;
}

export default function InlineNotification({
  type,
  text,
  iconName,
  style,
}: InlineNotificationProps) {
  /**
   * Returns the appropriate FontAwesome5 icon name based on notification type.
   * Custom iconName prop takes precedence if provided.
   */
  const getIconName = (): keyof typeof FontAwesome5.glyphMap => {
    if (iconName) return iconName;

    switch (type) {
      case 'error':
        return 'times-circle';
      case 'warning':
        return 'exclamation-triangle';
      case 'info':
        return 'info-circle';
      case 'success':
        return 'check-circle';
      case 'tip':
        return 'lightbulb';
      default:
        return 'info-circle';
    }
  };

  /**
   * Returns the color scheme (background, text, icon) based on notification type.
   * Each type has a distinct visual theme for clear communication.
   */
  const getStylesForType = () => {
    switch (type) {
      case 'error':
        return {
          backgroundColor: COLOURS.error.background,
          textColor: COLOURS.error.text,
          iconColor: COLOURS.error.text,
        };
      case 'warning':
        return {
          backgroundColor: COLOURS.warning.background,
          textColor: COLOURS.warning.text,
          iconColor: COLOURS.warning.icon,
        };
      case 'info':
        return {
          backgroundColor: COLOURS.info.background,
          textColor: COLOURS.info.text,
          iconColor: COLOURS.info.icon,
        };
      case 'success':
        return {
          backgroundColor: COLOURS.success.background,
          textColor: COLOURS.success.text,
          iconColor: COLOURS.success.icon,
        };
      case 'tip':
        return {
          backgroundColor: COLOURS.tip.background,
          textColor: COLOURS.tip.text,
          iconColor: COLOURS.tip.icon,
        };
      default:
        return {
          backgroundColor: COLOURS.info.background,
          textColor: COLOURS.info.text,
          iconColor: COLOURS.info.icon,
        };
    }
  };

  const typeStyles = getStylesForType();

  return (
    // Main container with type-specific background color
    <View style={[styles.container, { backgroundColor: typeStyles.backgroundColor }, style]}>
      {/* Icon container with fixed width for consistent alignment */}
      <View style={styles.iconContainer}>
        <FontAwesome5
          name={getIconName()}
          size={18}
          color={typeStyles.iconColor}
          style={styles.icon}
        />
      </View>
      <Text style={[styles.text, { color: typeStyles.textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 5,
    paddingTop: 5,
    paddingBottom: 5,
    paddingRight: 5,
    width: '100%',
    borderRadius: 8,
  },
  iconContainer: {
    width: 24,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  icon: {
    maxWidth: 24,
    maxHeight: 20,
  },
  text: {
    fontFamily: 'Inter',
    fontSize: 12,
    flex: 1,
  },
});
