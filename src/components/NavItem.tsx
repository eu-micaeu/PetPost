import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type NavItemProps = {
  focused: boolean;
  label?: string;
  children: React.ReactNode;
};

export function NavItem({ focused, label, children }: NavItemProps) {
  return (
    <View style={styles.navItem}>
      <View style={[styles.navIconContainer, focused && styles.navIconContainerActive]}>
        {children}
      </View>
      {label ? (
        <Text style={[styles.navLabel, focused && styles.navLabelActive]} numberOfLines={1}>
          {label}
        </Text>
      ) : (
        <View style={[styles.navActiveDot, focused && styles.navActiveDotVisible]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 50,
  },
  navIconContainer: {
    width: 44,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  navIconContainerActive: {
    transform: [{ scale: 1.05 }],
  },
  navLabel: {
    color: '#827989',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  navLabelActive: {
    color: '#F0AEC9',
    fontWeight: '800',
  },
  navActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginTop: 3,
  },
  navActiveDotVisible: {
    backgroundColor: '#E8A2BF',
    shadowColor: '#E8A2BF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 2,
  },
});
