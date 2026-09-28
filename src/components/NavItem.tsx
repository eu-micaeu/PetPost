import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type NavItemProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
};

export function NavItem({ label, active, onPress, children }: NavItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.navItem, pressed && { opacity: 0.65 }]}
      onPress={onPress}
      hitSlop={8}
    >
      <View style={[styles.navIconContainer, active && styles.navIconContainerActive]}>
        {children}
      </View>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
      <View style={[styles.navActiveDot, active && styles.navActiveDotVisible]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  navIconContainer: {
    padding: 3,
  },
  navIconContainerActive: {
    transform: [{ scale: 1.05 }],
  },
  navLabel: {
    color: '#7F7784',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  navLabelActive: {
    color: '#E8A2BF',
    fontWeight: '800',
  },
  navActiveDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'transparent',
    marginTop: 1,
  },
  navActiveDotVisible: {
    backgroundColor: '#E8A2BF',
  },
});
