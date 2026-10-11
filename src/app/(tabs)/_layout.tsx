import { Tabs, useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Svg, Path } from 'react-native-svg';
import { FriendsTabIcon, HomeTabIcon, NotificationsTabIcon, UserTabIcon } from '../../components/Icons';
import { NavItem } from '../../components/NavItem';
import { useNotifications } from '../../contexts/NotificationsContext';

export default function TabLayout() {
  const router = useRouter();
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
          title: '',
          tabBarButton: (props) => {
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Publicar momento"
                style={({ pressed }) => [
                  props.style,
                  styles.fabButtonContainer,
                  pressed && styles.publishFabPressed,
                ]}
                onPress={() => router.push('/publish')}
                hitSlop={8}
              >
                <View style={styles.publishFab}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 5V19M5 12H19"
                      stroke="#FFF9FB"
                      strokeWidth={2.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </Pressable>
            );
          },
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
  fabButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C27593',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishFabPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.85,
  },
});
