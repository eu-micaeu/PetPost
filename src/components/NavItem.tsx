import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type NavItemProps = {
  focused: boolean;
  label?: string;
  badge?: number | null;
  children: React.ReactNode;
};

export function NavItem({ focused, label, badge, children }: NavItemProps) {
  const showBadge = typeof badge === 'number' && badge > 0;

  return (
    <View style={styles.navItem}>
      <View style={[styles.navIconContainer, focused && styles.navIconContainerActive]}>
        {children}
        {showBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <View style={[styles.activeDot, { opacity: focused ? 1 : 0 }]} />
      {label ? (
        <Text style={[styles.navLabel, focused && styles.navLabelActive]} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    minWidth: 48,
  },
  navIconContainer: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  navIconContainerActive: {
    transform: [{ scale: 1.04 }],
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F0AEC9',
    marginTop: 3,
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
  badge: {
    position: 'absolute',
    top: -2,
    right: 2,
    backgroundColor: '#E53935',
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3.5,
    borderWidth: 1.5,
    borderColor: '#16141D',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
    lineHeight: 10,
  },
});
