import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

type InputState = 'default' | 'focus' | 'error';

interface InputProps extends Omit<TextInputProps, 'style'> {
  hasError?: boolean;
  style?: ViewStyle;
}

export default function Input({ hasError = false, style, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [textValue, setTextValue] = useState(props.value || '');

  useEffect(() => {
    if (props.value !== undefined) {
      setTextValue(props.value);
    }
  }, [props.value]);

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

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const isPasswordField = props.secureTextEntry;
  const showPasswordToggle = isPasswordField;
  const hasValue = textValue && textValue.length > 0;

  const handleTextChange = (text: string) => {
    setTextValue(text);
    props.onChangeText?.(text);
  };

  return (
    <View style={[styles.container, getBorderStyle(), style]}>
      <TextInput
        {...props}
        value={textValue}
        onChangeText={handleTextChange}
        secureTextEntry={isPasswordField && !isPasswordVisible}
        style={[
          styles.input,
          showPasswordToggle && styles.inputWithButton,
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
        placeholderTextColor="#868685"
      />
      {showPasswordToggle && (
        <TouchableOpacity style={styles.toggleButton} onPress={togglePasswordVisibility}>
          <FontAwesome name={isPasswordVisible ? 'eye-slash' : 'eye'} size={16} color="#000000" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 62,
    width: '100%',
    backgroundColor: 'transparent',
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
    color: '#000000',
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
