import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

type NotificationType = 'error' | 'warning' | 'info' | 'success' | 'tip';

interface InlineNotificationProps {
  type: NotificationType;
  text: string;
  iconName?: string;
  style?: ViewStyle;
}

export default function InlineNotification({
  type,
  text,
  iconName,
  style,
}: InlineNotificationProps) {
  const getIconName = (): string => {
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
        return 'lightbulb-o';
      default:
        return 'info-circle';
    }
  };

  const getStylesForType = () => {
    switch (type) {
      case 'error':
        return {
          backgroundColor: '#FFE9EA',
          textColor: '#B70000',
          iconColor: '#B70000',
        };
      case 'warning':
        return {
          backgroundColor: '#FFF7D3',
          textColor: 'rgba(0, 0, 0, 0.65)',
          iconColor: '#FFCF00',
        };
      case 'info':
        return {
          backgroundColor: '#F1F1ED',
          textColor: 'rgba(0, 0, 0, 0.65)',
          iconColor: 'rgba(0, 0, 0, 0.65)',
        };
      case 'success':
        return {
          backgroundColor: '#DDF7D2',
          textColor: '#1F5800',
          iconColor: '#1F5800',
        };
      case 'tip':
        return {
          backgroundColor: '#DAF8F7',
          textColor: '#004F4E',
          iconColor: '#004F4E',
        };
      default:
        return {
          backgroundColor: '#F1F1ED',
          textColor: 'rgba(0, 0, 0, 0.65)',
          iconColor: 'rgba(0, 0, 0, 0.65)',
        };
    }
  };

  const typeStyles = getStylesForType();

  return (
    <View style={[styles.container, { backgroundColor: typeStyles.backgroundColor }, style]}>
      <View style={styles.iconContainer}>
        <FontAwesome name={getIconName() as any} size={20} color={typeStyles.iconColor} />
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
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    flex: 1,
  },
});
