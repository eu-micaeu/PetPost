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
    paddingVertical: 2,
    minWidth: 50,
  },
  navIconContainer: {
    width: 48,
    height: 38,
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
  badge: {
    position: 'absolute',
    top: -2,
    right: 2,
    backgroundColor: '#E53935',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#131118',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
});
