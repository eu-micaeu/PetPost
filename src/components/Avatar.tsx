import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

type AvatarProps = {
  uri?: string | null;
  /** Nome/nickname usado para a inicial quando não há foto. */
  name?: string | null;
  size: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Avatar({ uri, name, size, style, textStyle }: AvatarProps) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = Boolean(uri) && uri !== failedUri;
  const initial = (name?.replace(/^@/, '')[0] || 'P').toUpperCase();

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailedUri(uri ?? null)}
        />
      ) : (
        <Text style={[styles.initial, { fontSize: Math.round(size * 0.4) }, textStyle]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2433',
  },
  initial: {
    color: '#FFF9FB',
    fontWeight: '800',
  },
});
