import React, { useEffect, useState } from 'react';
import { Animated, DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';

export function Skeleton({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const [opacity] = useState(() => new Animated.Value(0.3));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width ?? '100%',
          height: height ?? 16,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function FeedCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.headerSkeleton}>
        <Skeleton width={38} height={38} borderRadius={19} />
        <View style={styles.headerTextSkeleton}>
          <Skeleton width={110} height={13} borderRadius={6} />
          <Skeleton width={60} height={10} borderRadius={5} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Skeleton width="100%" height={320} borderRadius={12} />
      <View style={styles.footerSkeleton}>
        <Skeleton width={32} height={16} borderRadius={6} />
      </View>
    </View>
  );
}

export function PetCardSkeleton() {
  return (
    <View style={styles.petSkeleton}>
      <Skeleton width={64} height={64} borderRadius={32} />
      <View style={{ flex: 1, gap: 8, marginLeft: 16 }}>
        <Skeleton width="60%" height={16} borderRadius={6} />
        <Skeleton width="40%" height={12} borderRadius={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#282330',
  },
  cardSkeleton: {
    backgroundColor: '#1B1820',
    borderWidth: 1,
    borderColor: '#37303C',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTextSkeleton: {
    flex: 1,
  },
  footerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  petSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B1820',
    borderWidth: 1,
    borderColor: '#37303C',
    borderRadius: 16,
    padding: 14,
  },
});
