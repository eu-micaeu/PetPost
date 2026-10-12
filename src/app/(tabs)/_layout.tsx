import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Svg, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { FriendsTabIcon, HomeTabIcon, NotificationsTabIcon, UserTabIcon } from '../../components/Icons';
import { NavItem } from '../../components/NavItem';
import { useNotifications } from '../../contexts/NotificationsContext';

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  const floatingBottom = Math.max(insets.bottom + 8, 18);

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
        tabBarBackground: () => (
          <BlurView
            intensity={85}
            tint="dark"
            style={[StyleSheet.absoluteFill, styles.blurOverlay]}
          />
        ),
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
              <HomeTabIcon active={focused} color={focused ? '#F7C1D7' : '#827989'} />
            </NavItem>
          ),
        }}
      />

      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavItem focused={focused}>
              <FriendsTabIcon active={focused} color={focused ? '#F7C1D7' : '#827989'} />
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
              <NotificationsTabIcon active={focused} color={focused ? '#F7C1D7' : '#827989'} />
            </NavItem>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavItem focused={focused}>
              <UserTabIcon active={focused} color={focused ? '#F7C1D7' : '#827989'} />
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
    height: 66,
    borderRadius: 33,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    paddingHorizontal: 8,
    paddingBottom: 0,
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    overflow: 'hidden',
  },
  blurOverlay: {
    backgroundColor: 'rgba(20, 17, 26, 0.78)',
  },
  tabBarItem: {
    height: 66,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
  },
  fabButtonContainer: {
    flex: 1,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C77997',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C77997',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  publishFabPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.88,
  },
});
