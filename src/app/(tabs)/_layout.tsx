import { Tabs, useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Svg, Path } from 'react-native-svg';
import { FriendsTabIcon, HomeTabIcon, NotificationsTabIcon, PetsTabIcon } from '../../components/Icons';
import { NavItem } from '../../components/NavItem';

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
            paddingBottom: bottomInset > 0 ? bottomInset - 4 : 4,
          },
        ],
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavItem focused={focused} label="Início">
              <HomeTabIcon active={focused} color={focused ? '#F0AEC9' : '#827989'} />
            </NavItem>
          ),
        }}
      />

      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavItem focused={focused} label="Amigos">
              <FriendsTabIcon active={focused} color={focused ? '#F0AEC9' : '#827989'} />
            </NavItem>
          ),
        }}
      />

      <Tabs.Screen
        name="_publish_button"
        options={{
          title: '',
          tabBarButton: () => {
            return (
              <View style={styles.fabWrapper}>
                <Pressable
                  style={({ pressed }) => [
                    styles.publishFab,
                    pressed && styles.publishFabPressed,
                  ]}
                  onPress={(e) => {
                    e.preventDefault();
                    router.push('/publish');
                  }}
                  hitSlop={8}
                >
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 5V19M5 12H19"
                      stroke="#FFF9FB"
                      strokeWidth={2.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </Pressable>
              </View>
            );
          },
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavItem focused={focused} label="Avisos">
              <NotificationsTabIcon active={focused} color={focused ? '#F0AEC9' : '#827989'} />
            </NavItem>
          ),
        }}
      />

      <Tabs.Screen
        name="pets"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavItem focused={focused} label="Pets">
              <PetsTabIcon active={focused} color={focused ? '#F0AEC9' : '#827989'} />
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
    paddingTop: 6,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  fabWrapper: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -16,
  },
  publishFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#C27593',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#131118',
    shadowColor: '#C27593',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  publishFabPressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: '#AD6381',
  },
});
