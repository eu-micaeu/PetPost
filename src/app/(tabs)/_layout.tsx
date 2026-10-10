import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { FriendsTabIcon, HomeTabIcon, NotificationsTabIcon, PetsTabIcon } from '../../components/Icons';

function NavItem({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.navItem}>
      <View style={[styles.navIconContainer, focused && styles.navIconContainerActive]}>
        {children}
      </View>
      <View style={[styles.navActiveDot, focused && styles.navActiveDotVisible]} />
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bottomNav,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavItem focused={focused}>
              <HomeTabIcon active={focused} color={focused ? '#E8A2BF' : '#7F7784'} />
            </NavItem>
          ),
        }}
      />

      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavItem focused={focused}>
              <FriendsTabIcon active={focused} color={focused ? '#E8A2BF' : '#7F7784'} />
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
              <View style={styles.fabContainer}>
                <Pressable
                  style={styles.publishFab}
                  onPress={(e) => {
                    e.preventDefault();
                    router.push('/publish');
                  }}
                >
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 5V19M5 12H19" stroke="#FFF9FB" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
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
            <NavItem focused={focused}>
              <NotificationsTabIcon active={focused} color={focused ? '#E8A2BF' : '#7F7784'} />
            </NavItem>
          ),
        }}
      />

      <Tabs.Screen
        name="pets"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavItem focused={focused}>
              <PetsTabIcon active={focused} color={focused ? '#E8A2BF' : '#7F7784'} />
            </NavItem>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    height: 64,
    backgroundColor: '#111016',
    borderTopWidth: 1,
    borderTopColor: '#25202B',
    paddingHorizontal: 12,
    elevation: 0, // Android
    shadowOpacity: 0, // iOS
  },
  navItem: {
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
  fabContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#B66F8A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B66F8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
