/**
 * @file InlineButton.tsx
 * @description A text-based inline button component with underline styling.
 *              Designed for inline actions within text content, such as "forgot password"
 *              or "sign up" links. Supports disabled state with muted styling.
 *
 * @usage
 * ```tsx
 * import InlineButton from '@/components/InlineButton';
 *
 * // Basic inline button
 * <InlineButton title="Forgot Password?" onPress={handleForgotPassword} />
 *
 * // Within text content
 * <Text>
 *   Don't have an account? <InlineButton title="Sign Up" onPress={handleSignUp} />
 * </Text>
 *
 * // Disabled state
 * <InlineButton title="Resend Code" onPress={handleResend} disabled />
 *
 * // Custom text styling
 * <InlineButton
 *   title="Learn More"
 *   onPress={handleLearnMore}
 *   style={{ fontSize: 14 }}
 * />
 * ```
 *
 * @props
 * - title: string - The text displayed for the button
 * - onPress: () => void - Callback function triggered on press
 * - style?: TextStyle - Custom styles for the button text
 * - disabled?: boolean - Whether the button is disabled (default: false)
 */

import React from 'react';
import { Text, TextStyle } from 'react-native';
import { COLOURS } from '../constants/colours';

interface InlineButtonProps {
  title: string;
  onPress: () => void;
  style?: TextStyle;
  disabled?: boolean;
}

export default function InlineButton({
  title,
  onPress,
  style,
  disabled = false,
}: InlineButtonProps) {
  return (
    // Text element with built-in press handling for inline button behavior
    <Text
      onPress={disabled ? undefined : onPress}
      style={[
        {
          fontFamily: 'Inter-Bold',
          textDecorationLine: 'underline',
          // Apply disabled color when button is disabled
          color: disabled ? COLOURS.disabled : COLOURS.primary,
        },
        style,
      ]}
    >
      {title}
    </Text>
  );
}
