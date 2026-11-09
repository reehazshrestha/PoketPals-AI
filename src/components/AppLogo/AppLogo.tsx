import React from 'react';
import {Image, type ImageStyle, type StyleProp} from 'react-native';

const logo = require('../../assets/poketpals-icon.png');

export type AppLogoProps = {
  /** Square size in RN points. */
  size?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

/**
 * The PoketPals AI launcher artwork, used anywhere the app shows its own
 * brand mark (splash, welcome, empty states).
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  size = 112,
  style,
  accessibilityLabel = 'PoketPals AI',
}) => (
  <Image
    source={logo}
    style={[{width: size, height: size}, style]}
    resizeMode="contain"
    accessibilityRole="image"
    accessibilityLabel={accessibilityLabel}
  />
);
