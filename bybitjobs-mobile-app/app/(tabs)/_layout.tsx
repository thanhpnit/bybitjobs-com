import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0084FF',
        tabBarInactiveTintColor: isDark ? '#8E8E93' : '#8E8E93',
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
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
          title: 'Việc của tôi',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post-job"
        options={{
          title: 'Đăng tin',
          tabBarButton: (props) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={props.onPress}
              style={styles.customButtonContainer}
            >
              <View style={[styles.customButton, { borderColor: isDark ? '#1C1C1E' : '#F4F5F7' }]}>
                <Ionicons name="add" size={32} color="#FFF" />
              </View>
              <Text
                style={[
                  styles.customButtonLabel,
                  { color: props.accessibilityState?.selected ? '#0084FF' : '#8E8E93' }
                ]}
              >
                Đăng tin
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Cộng đồng',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
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
  customButtonContainer: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
  },
  customButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    elevation: 6,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  customButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
