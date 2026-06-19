import { Tabs, router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { userRole, unreadNotificationsCount } = useAuth();

  const bottomInset = insets.bottom;
  const isIphoneWithNotch = bottomInset > 0;

  // Calculate dynamic tab bar height and bottom padding to account for safe area / home indicator
  const tabBarHeight = isIphoneWithNotch ? 82 : 64;
  const paddingBottom = isIphoneWithNotch ? 22 : 6;
  const paddingTop = 8;

  return (
    <Tabs
      key={userRole || 'guest'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0084FF',
        tabBarInactiveTintColor: isDark ? '#8E8E93' : '#8E8E93',
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: paddingBottom,
          paddingTop: paddingTop,
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-jobs"
        options={{
          title: userRole === 'employer' ? 'Quản lý ứng viên' : 'Việc của tôi',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={
                userRole === 'employer'
                  ? (focused ? 'people' : 'people-outline')
                  : (focused ? 'briefcase' : 'briefcase-outline')
              } 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="post-job"
        options={
          userRole === 'employer'
            ? {
                title: 'Đăng tin',
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={24} color={color} />
                ),
                tabBarButton: (props) => (
                  <View style={[props.style, { justifyContent: 'center', alignItems: 'center' }]}>
                    <TouchableOpacity
                      onPress={props.onPress}
                      activeOpacity={0.85}
                      style={[
                        styles.fabTabButton,
                        {
                          backgroundColor: '#0060B6',
                          borderColor: isDark ? '#1C1C1E' : '#FFFFFF',
                        }
                      ]}
                    >
                      <Ionicons name="add" size={28} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ),
              }
            : {
                title: 'Đăng tin',
                href: null,
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={24} color={color} />
                ),
              }
        }
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (userRole === 'employer') {
              e.preventDefault();
              router.push({ pathname: '/recruiter/edit-job', params: { id: 'new' } });
            }
          },
        })}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: userRole === 'employer' ? 'Tin tuyển dụng' : 'Cộng đồng',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={
                userRole === 'employer'
                  ? (focused ? 'briefcase' : 'briefcase-outline')
                  : (focused ? 'people' : 'people-outline')
              } 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          href: userRole === 'employer' ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={24} color={color} />
          ),
          tabBarBadge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabTabButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    top: -14,
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 8,
  },
});
