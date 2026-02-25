import React, { useState } from 'react';
import { StyleSheet, TextInput, View, ViewStyle } from 'react-native';

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
  const [isFocused, setIsFocused] = useState(false);

  const getInputState = (): InputState => {
    if (hasError) return 'error';
    if (isFocused) return 'focus';
    return 'default';
  };

  const getBorderStyle = () => {
    const state = getInputState();

    switch (state) {
      case 'error':
        return {
          borderWidth: 2,
          borderColor: '#B70000',
        };
      case 'focus':
        return {
          borderWidth: 2,
          borderColor: '#000000',
        };
      case 'default':
      default:
        return {
          borderWidth: 1,
          borderColor: '#868685',
        };
    }
  };

  const handleTextChange = (text: string) => {
    const numbersOnly = text.replace(/[^0-9]/g, '');
    const limited = numbersOnly.slice(0, 6);

    onChangeText?.(limited);

    if (limited.length === 6) {
      onComplete?.(limited);
    }
  };

  const formatDisplayValue = (code: string) => {
    if (code.length <= 3) {
      return code;
    }
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  };

  return (
    <View style={[styles.container, getBorderStyle(), style]}>
      <TextInput
        value={formatDisplayValue(value)}
        onChangeText={handleTextChange}
        style={styles.input}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#868685"
        placeholder="123-456"
        keyboardType="numeric"
        maxLength={7}
        textAlign="center"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 62,
    width: 110,
    backgroundColor: 'transparent',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '100%',
    textAlign: 'center',
  },
});
