import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Avatar } from '../../components/Avatar';
import { FriendsTabIcon, HomeTabIcon, NotificationsTabIcon, UserTabIcon } from '../../components/Icons';
import { PUBLISH_ROUTE, TabBar } from '../../components/TabBar';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';

export default function TabLayout() {
  const { unreadCount } = useNotifications();
  const { profile } = useAuth();

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused, color }) => <HomeTabIcon active={focused} color={color} />,
        }}
      />

      <Tabs.Screen
        name="friends"
        options={{
          title: 'Amigos',
          tabBarIcon: ({ focused, color }) => <FriendsTabIcon active={focused} color={color} />,
        }}
      />

      {/* Renderizado como botão "+" pelo TabBar; abre /publish em vez de trocar de aba. */}
      <Tabs.Screen name={PUBLISH_ROUTE} options={{ title: 'Publicar momento' }} />

      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notificações',
          tabBarAccessibilityLabel:
            unreadCount > 0 ? `Notificações, ${unreadCount} não lidas` : 'Notificações',
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          tabBarIcon: ({ focused, color }) => (
            <NotificationsTabIcon active={focused} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused, color }) =>
            profile?.avatar_url ? (
              <Avatar
                uri={profile.avatar_url}
                name={profile.nickname}
                size={28}
                style={[styles.tabAvatar, { borderColor: color }]}
              />
            ) : (
              <UserTabIcon active={focused} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabAvatar: {
    borderWidth: 1.5,
  },
});
