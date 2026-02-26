/**
 * @file Spacer.tsx
 * @description A utility component for adding consistent vertical spacing between elements.
 *              Provides predefined size variants (large, medium, small) for design system
 *              consistency, or accepts a custom height value for flexible spacing needs.
 *
 * @usage
 * ```tsx
 * import Spacer from '@/components/Spacer';
 *
 * // Large spacer (48px - default)
 * <Spacer />
 *
 * // Medium spacer (16px)
 * <Spacer size="medium" />
 *
 * // Small spacer (8px)
 * <Spacer size="small" />
 *
 * // Custom height
 * <Spacer height={32} />
 *
 * // With additional styles
 * <Spacer size="medium" style={{ backgroundColor: 'transparent' }} />
 * ```
 *
 * @props
 * - size?: 'large' | 'medium' | 'small' - Predefined size variant (default: 'large')
 * - height?: number - Custom height override (takes precedence over size)
 * - style?: ViewStyle - Custom styles for the spacer element
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';

/** Available spacer size presets */
type SpacerSize = 'large' | 'medium' | 'small';

interface SpacerProps {
  size?: SpacerSize;
  height?: number;
  style?: ViewStyle;
}

export default function Spacer({ size = 'large', height, style }: SpacerProps) {
  /**
   * Returns the height value based on size preset or custom height.
   * Custom height takes precedence if provided.
   */
  const getHeight = () => {
    // Use custom height if provided
    if (height !== undefined) return height;

    // Return predefined height based on size variant
    switch (size) {
      case 'large':
        return 48;
      case 'medium':
        return 16;
      case 'small':
        return 8;
      default:
        return 48;
    }
  };

  // Render an empty View with the calculated height
  return <View style={[{ height: getHeight() }, style]} />;
}
