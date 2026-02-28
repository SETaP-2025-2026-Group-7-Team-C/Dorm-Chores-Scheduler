/**
 * @file InputCode.tsx
 * @description A specialized input component for 6-digit verification codes.
 *              Automatically formats input with a hyphen (XXX-XXX format),
 *              accepts only numeric input, and provides an onComplete callback
 *              when all 6 digits are entered.
 *
 * @usage
 * ```tsx
 * import InputCode from '@/components/InputCode';
 *
 * // Basic code input
 * const [code, setCode] = useState('');
 * <InputCode value={code} onChangeText={setCode} />
 *
 * // With completion callback
 * <InputCode
 *   value={code}
 *   onChangeText={setCode}
 *   onComplete={(fullCode) => verifyCode(fullCode)}
 * />
 *
 * // With error state
 * <InputCode
 *   value={code}
 *   onChangeText={setCode}
 *   hasError={isInvalidCode}
 * />
 *
 * // Custom styling
 * <InputCode
 *   value={code}
 *   onChangeText={setCode}
 *   style={{ marginTop: 16 }}
 * />
 * ```
 *
 * @props
 * - value?: string - The current code value (numbers only, max 6 digits)
 * - onChangeText?: (text: string) => void - Callback when code changes (receives raw digits)
 * - hasError?: boolean - Whether to display error styling (default: false)
 * - style?: ViewStyle - Custom styles for the input container
 * - onComplete?: (code: string) => void - Callback when all 6 digits are entered
 */

import React, { useState } from 'react';
import { StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import { COLOURS } from '../constants/colours';

/** Input visual state for styling */
type InputState = 'default' | 'focus' | 'error';

interface InputCodeProps {
  value?: string;
  onChangeText?: (text: string) => void;
  hasError?: boolean;
  style?: ViewStyle;
  onComplete?: (code: string) => void;
}

export default function InputCode({
  value = '',
  onChangeText,
  hasError = false,
  style,
  onComplete,
}: InputCodeProps) {
  // Track focus state for border styling
  const [isFocused, setIsFocused] = useState(false);

  /**
   * Determines the current input state based on error and focus conditions.
   * Error state takes precedence over focus state.
   */
  const getInputState = (): InputState => {
    if (hasError) return 'error';
    if (isFocused) return 'focus';
    return 'default';
  };

  /**
   * Returns the border style based on the current input state.
   * - Error: red border (2px)
   * - Focus: primary color border (2px)
   * - Default: gray border (1px)
   */
  const getBorderStyle = () => {
    const state = getInputState();

    switch (state) {
      case 'error':
        return {
          borderWidth: 2,
          borderColor: COLOURS.input.error,
        };
      case 'focus':
        return {
          borderWidth: 2,
          borderColor: COLOURS.input.focus,
        };
      case 'default':
      default:
        return {
          borderWidth: 1,
          borderColor: COLOURS.input.default,
        };
    }
  };

  /**
   * Handles text input: filters to numbers only, limits to 6 digits,
   * and triggers onComplete callback when full code is entered.
   */
  const handleTextChange = (text: string) => {
    // Strip all non-numeric characters
    const numbersOnly = text.replace(/[^0-9]/g, '');
    // Limit to 6 digits maximum
    const limited = numbersOnly.slice(0, 6);

    onChangeText?.(limited);

    // Trigger completion callback when all 6 digits entered
    if (limited.length === 6) {
      onComplete?.(limited);
    }
  };

  /**
   * Formats the code value for display with hyphen separator.
   * Converts "123456" to "123-456" for better readability.
   */
  const formatDisplayValue = (code: string) => {
    if (code.length <= 3) {
      return code;
    }
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  };

  return (
    // Input container with dynamic border styling
    <View style={[styles.container, getBorderStyle(), style]}>
      {/* Numeric input with centered text and formatted display */}
      <TextInput
        value={formatDisplayValue(value)}
        onChangeText={handleTextChange}
        style={styles.input}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor={COLOURS.input.placeholder}
        placeholder="123-456"
        keyboardType="numeric"
        maxLength={7} // 6 digits + 1 hyphen
        textAlign="center"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 62,
    width: 110,
    backgroundColor: COLOURS.transparent,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    fontFamily: 'Inter',
    fontSize: 18,
    lineHeight: 24,
    color: COLOURS.input.text,
    paddingHorizontal: 8,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '100%',
    textAlign: 'center',
  },
});
