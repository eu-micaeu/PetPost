import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Svg, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { FriendsTabIcon, HomeTabIcon, NotificationsTabIcon, UserTabIcon } from '../../components/Icons';
import { NavItem } from '../../components/NavItem';
import { useNotifications } from '../../contexts/NotificationsContext';

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  const floatingBottom = Math.max(insets.bottom + 6, 16);

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          try {
            Haptics.selectionAsync();
          } catch {
            // Silencioso
          }
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.floatingNav,
          {
            bottom: floatingBottom,
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
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
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch {
                    // Silencioso
                  }
                  router.push('/publish');
                }}
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
  floatingNav: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16141D',
    borderWidth: 1,
    borderColor: '#30283A',
    paddingHorizontal: 6,
    paddingBottom: 0,
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  tabBarItem: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
  },
  fabButtonContainer: {
    flex: 1,
    height: 64,
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
