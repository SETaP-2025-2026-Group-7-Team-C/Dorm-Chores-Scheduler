/**
 * @file Selector.tsx
 * @description A card-based selection component for choosing between multiple options.
 *              Displays large touchable cards with icons, titles, and subtitles.
 *              Supports single selection with visual highlighting of the selected option.
 *
 * @usage
 * ```tsx
 * import Selector, { SelectorOption } from '@/components/Selector';
 *
 * const options: SelectorOption[] = [
 *   {
 *     id: 'manager',
 *     icon: 'user-shield',
 *     title: 'Manager',
 *     subtitle: 'Create and manage chore schedules',
 *   },
 *   {
 *     id: 'member',
 *     icon: 'user',
 *     title: 'Member',
 *     subtitle: 'View and complete assigned chores',
 *   },
 * ];
 *
 * const [selectedRole, setSelectedRole] = useState<string>();
 *
 * <Selector
 *   options={options}
 *   selectedId={selectedRole}
 *   onSelect={setSelectedRole}
 * />
 * ```
 *
 * @props
 * - options: SelectorOption[] - Array of selectable options
 * - selectedId?: string - ID of the currently selected option
 * - onSelect: (id: string) => void - Callback when an option is selected
 *
 * @types
 * - SelectorOption: { id: string, icon: FontAwesome5 icon name, title: string, subtitle: string }
 */

import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLOURS } from '../constants/colours';

/** Configuration for a single selector option */
export type SelectorOption = {
  id: string;
  icon: keyof typeof FontAwesome5.glyphMap;
  title: string;
  subtitle: string;
};

interface SelectorProps {
  options: SelectorOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

interface SelectorItemProps {
  option: SelectorOption;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * Internal component for rendering a single selector option card.
 * Displays icon, title, and subtitle with selection highlighting.
 */
function SelectorItem({ option, isSelected, onPress }: SelectorItemProps) {
  /**
   * Returns border style based on selection state.
   * Selected items have a thicker, highlighted border.
   */
  const getBorderStyle = () => {
    if (isSelected) {
      return {
        borderWidth: 4,
        borderColor: COLOURS.input.focus,
      };
    }
    return {
      borderWidth: 2,
      borderColor: COLOURS.input.default,
    };
  };

  return (
    // Card container with dynamic border based on selection
    <TouchableOpacity style={[styles.item, getBorderStyle()]} onPress={onPress} activeOpacity={0.8}>
      {/* Icon container with fixed dimensions */}
      <View style={styles.iconContainer}>
        <FontAwesome5 name={option.icon} size={40} color={COLOURS.black} style={styles.icon} />
      </View>
      {/* Horizontal spacer between icon and text */}
      <View style={styles.spacer} />
      {/* Text content area (title and subtitle) */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{option.title}</Text>
        <Text style={styles.subtitle}>{option.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Main Selector component that renders a list of selectable option cards.
 */
export default function Selector({ options, selectedId, onSelect }: SelectorProps) {
  return (
    // Container for all selector items with consistent gap spacing
    <View style={styles.container}>
      {options.map((option) => (
        <SelectorItem
          key={option.id}
          option={option}
          isSelected={selectedId === option.id}
          onPress={() => onSelect(option.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  item: {
    height: 110,
    width: '100%',
    backgroundColor: COLOURS.transparent,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    overflow: 'hidden',
  },
  icon: {
    maxWidth: 48,
    maxHeight: 48,
  },
  spacer: {
    width: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLOURS.black,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: COLOURS.gray[700],
    lineHeight: 18,
    flexWrap: 'wrap',
  },
});
