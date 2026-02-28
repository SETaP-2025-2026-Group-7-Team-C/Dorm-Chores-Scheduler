/**
 * @file Input.tsx
 * @description A customizable text input component with focus states, error handling,
 *              and password visibility toggle. Extends React Native's TextInput with
 *              consistent styling and enhanced UX features for form inputs.
 *
 * @usage
 * ```tsx
 * import Input from '@/components/Input';
 *
 * // Basic text input
 * <Input placeholder="Enter your name" value={name} onChangeText={setName} />
 *
 * // Email input
 * <Input
 *   placeholder="Email"
 *   keyboardType="email-address"
 *   autoCapitalize="none"
 *   value={email}
 *   onChangeText={setEmail}
 * />
 *
 * // Password input with visibility toggle
 * <Input
 *   placeholder="Password"
 *   secureTextEntry
 *   value={password}
 *   onChangeText={setPassword}
 * />
 *
 * // Input with error state
 * <Input
 *   placeholder="Username"
 *   value={username}
 *   onChangeText={setUsername}
 *   hasError={!isUsernameValid}
 * />
 * ```
 *
 * @props
 * - hasError?: boolean - Whether to display error styling (default: false)
 * - style?: ViewStyle - Custom styles for the input container
 * - ...TextInputProps - All standard React Native TextInput props (except style)
 */

import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { COLOURS } from '../constants/colours';

/** Input visual state for styling */
type InputState = 'default' | 'focus' | 'error';

interface InputProps extends Omit<TextInputProps, 'style'> {
  hasError?: boolean;
  style?: ViewStyle;
}

export default function Input({ hasError = false, style, ...props }: InputProps) {
  // Track focus state for border styling
  const [isFocused, setIsFocused] = useState(false);
  // Track password visibility toggle state
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  // Maintain internal text value for controlled input behavior
  const [textValue, setTextValue] = useState(props.value || '');

  // Sync internal value with external prop changes
  useEffect(() => {
    if (props.value !== undefined) {
      setTextValue(props.value);
    }
  }, [props.value]);

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

  /** Toggles password visibility between hidden and visible */
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Determine if this is a password field based on secureTextEntry prop
  const isPasswordField = props.secureTextEntry;
  // Show toggle button only for password fields
  const showPasswordToggle = isPasswordField;
  // Check if input has value (for styling purposes)
  const hasValue = textValue && textValue.length > 0;

  /**
   * Handles text changes and propagates to parent component.
   * Maintains internal state for controlled behavior.
   */
  const handleTextChange = (text: string) => {
    setTextValue(text);
    props.onChangeText?.(text);
  };

  return (
    // Input container with dynamic border styling
    <View style={[styles.container, getBorderStyle(), style]}>
      {/* Main text input element */}
      <TextInput
        {...props}
        value={textValue}
        onChangeText={handleTextChange}
        // Toggle secure entry based on password visibility state
        secureTextEntry={isPasswordField && !isPasswordVisible}
        style={[
          styles.input,
          showPasswordToggle && styles.inputWithButton,
          // Apply larger font for hidden password dots
          isPasswordField && !isPasswordVisible && hasValue && styles.secureInput,
        ]}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        placeholderTextColor={COLOURS.input.placeholder}
      />
      {/* Password visibility toggle button */}
      {showPasswordToggle && (
        <TouchableOpacity style={styles.toggleButton} onPress={togglePasswordVisibility}>
          <FontAwesome5
            name={isPasswordVisible ? 'eye-slash' : 'eye'}
            size={16}
            color={COLOURS.black}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 62,
    width: '100%',
    backgroundColor: COLOURS.transparent,
    borderRadius: 16,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Inter',
    color: COLOURS.input.text,
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  inputWithButton: {
    paddingRight: 48,
  },
  secureInput: {
    fontSize: 32,
    lineHeight: 48,
  },
  toggleButton: {
    position: 'absolute',
    right: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
