import Palette from '../../constants/palette.json';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FontFamily } from '../../constants/theme';

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  primaryColor: string;
  isDark: boolean;
};

const TabIcon = ({ name, focused, color, primaryColor, isDark }: TabIconProps) => (
  <View
    style={{
      width: 36,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused ? (isDark ? Palette.dark.accentMuted : Palette.light.accentMuted) : 'transparent',
    }}
  >
    <Ionicons
      name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
      size={20}
      color={focused ? primaryColor : color}
    />
  </View>
);

export default function TabLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  // Safe clearance for Android 3-button navigation (anchored items on top)
  const bottomPadding = Platform.OS === 'android'
    ? Math.max(insets.bottom, 50) + 22
    : Math.max(insets.bottom, 16);
  const tabHeight = 52 + bottomPadding;
  const isDark = theme.mode === 'dark';
  const primaryColor = theme.colors.primary;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: false,
        sceneStyle: { backgroundColor: theme.colors.background },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.tabBarBackground,
          borderTopColor: theme.colors.tabBarBorder,
          borderTopWidth: 1,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
          paddingTop: 6,
          paddingBottom: bottomPadding,
          height: tabHeight,
          shadowColor: Palette.ink,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: theme.mode === 'dark' ? 0.1 : 0.08,
          shadowRadius: 8,
          elevation: 24,
        },
        tabBarLabelStyle: {
          fontFamily: FontFamily.sansSemiBold,
          fontSize: 10,
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          justifyContent: 'flex-start',
          paddingTop: 6,
          height: 48,
        },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" focused={focused} color={color} primaryColor={primaryColor} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chatbubbles" focused={focused} color={color} primaryColor={primaryColor} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Treino',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="barbell" focused={focused} color={color} primaryColor={primaryColor} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progresso',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="stats-chart" focused={focused} color={color} primaryColor={primaryColor} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" focused={focused} color={color} primaryColor={primaryColor} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
