import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FriendsTabIcon, HomeTabIcon, NotificationsTabIcon, UserTabIcon } from '../../components/Icons';
import { NavItem } from '../../components/NavItem';
import { useNotifications } from '../../contexts/NotificationsContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 8);
  const tabHeight = 56 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.bottomNav,
          {
            height: tabHeight,
            paddingBottom: bottomInset,
          },
        ],
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavItem focused={focused}>
              <HomeTabIcon active={focused} color={focused ? '#F0AEC9' : '#827989'} />
            </NavItem>
          ),
        }}
      />

      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavItem focused={focused}>
              <FriendsTabIcon active={focused} color={focused ? '#F0AEC9' : '#827989'} />
            </NavItem>
          ),
        }}
      />

      <Tabs.Screen
        name="_publish_button"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavItem focused={focused} badge={unreadCount}>
              <NotificationsTabIcon active={focused} color={focused ? '#F0AEC9' : '#827989'} />
            </NavItem>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavItem focused={focused}>
              <UserTabIcon active={focused} color={focused ? '#F0AEC9' : '#827989'} />
            </NavItem>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    backgroundColor: '#131118',
    borderTopWidth: 1,
    borderTopColor: '#282230',
    paddingHorizontal: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
});
