/**
 * @file CurvedBanner.tsx
 * @description A decorative curved banner component that displays a rotated ellipse.
 *              Provides predefined size variants (large, medium, small) for consistent
 *              header styling across the application.
 *
 * @usage
 * ```tsx
 * import CurvedBanner from '@/components/CurvedBanner';
 *
 * // Large banner (default)
 * <CurvedBanner />
 *
 * // Medium banner
 * <CurvedBanner variant="medium" />
 *
 * // Custom height override
 * <CurvedBanner variant="small" height={150} />
 *
 * // With custom styling
 * <CurvedBanner style={{ marginBottom: 20 }} />
 * ```
 *
 * @props
 * - variant?: 'large' | 'medium' | 'small' - Size variant (default: 'large')
 * - height?: number - Custom height override for the banner container
 * - style?: ViewStyle - Custom styles for the banner container
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { COLOURS } from '../constants/colours';

/** Available banner size variants */
type BannerVariant = 'large' | 'medium' | 'small';

interface CurvedBannerProps {
  variant?: BannerVariant;
  height?: number;
  style?: ViewStyle;
}

export default function CurvedBanner({ variant = 'large', height, style }: CurvedBannerProps) {
  /**
   * Returns the ellipse specifications based on the selected variant.
   * Each variant defines the position, size, and rotation of the ellipse.
   */
  const getBannerSpecs = () => {
    switch (variant) {
      case 'large':
        return {
          height: 229,
          width: 402,
          cx: 139.09, // Center X position
          cy: 67.8876, // Center Y position
          rx: 335.64, // X radius
          ry: 144.003, // Y radius
          rotation: -13.5999,
        };
      case 'medium':
        return {
          height: 194,
          width: 402,
          cx: 134.604,
          cy: 49.3414,
          rx: 335.64,
          ry: 124.922,
          rotation: -13.5999,
        };
      case 'small':
        return {
          height: 114,
          width: 402,
          cx: 136.472,
          cy: 16.9491,
          rx: 335.64,
          ry: 82.1249,
          rotation: -9.23928,
        };
      default:
        return {
          height: 229,
          width: 402,
          cx: 139.09,
          cy: 67.8876,
          rx: 335.64,
          ry: 144.003,
          rotation: -13.5999,
        };
    }
  };

  const specs = getBannerSpecs();
  // Use custom height if provided, otherwise use variant default
  const containerHeight = height || specs.height;

  // Calculate ellipse dimensions using CSS transforms
  // We create a circle and scale it to achieve the ellipse shape
  const maxRadius = Math.max(specs.rx, specs.ry);
  const scaleX = specs.rx / maxRadius;
  const scaleY = specs.ry / maxRadius;

  // Position the ellipse relative to the container
  const left = specs.cx - maxRadius;
  const top = specs.cy - maxRadius;

  // Dynamic ellipse styling with position, size, and rotation
  const ellipseStyle = {
    position: 'absolute' as const,
    width: maxRadius * 2,
    height: maxRadius * 2,
    backgroundColor: COLOURS.primary,
    left: left,
    top: top,
    borderRadius: maxRadius,
    transform: [{ scaleX: scaleX }, { scaleY: scaleY }, { rotate: `${specs.rotation}deg` }],
  };

  return (
    // Container clips the ellipse to create the curved banner effect
    <View style={[styles.container, { height: containerHeight }, style]}>
      <View style={ellipseStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLOURS.transparent,
  },
});
