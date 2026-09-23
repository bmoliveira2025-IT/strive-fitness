import Palette from '../../constants/palette.json';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Control, FontFamily } from '../../constants/theme';
import { TAB_BAR_CONTENT_HEIGHT, tabBarBottomPadding } from '../../constants/tabLayout';

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  primaryColor: string;
  isDark: boolean;
};

const TabIcon = ({ name, focused, color, primaryColor, isDark }: TabIconProps) => (
  <View
    accessible={false}
    style={{
      width: Control.preferredTouchSize,
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
  // Keep the system navigation area below the labels on Android and iOS.
  const bottomPadding = tabBarBottomPadding(Platform.OS, insets.bottom);
  const tabHeight = TAB_BAR_CONTENT_HEIGHT + bottomPadding;
  const isDark = theme.mode === 'dark';
  const primaryColor = theme.colors.primary;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
        sceneStyle: { backgroundColor: theme.colors.background },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'relative',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.background,
          borderTopColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.07)' : theme.colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
          paddingTop: 4,
          paddingBottom: bottomPadding,
          height: tabHeight,
          shadowColor: Palette.ink,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: theme.mode === 'dark' ? 0.05 : 0.04,
          shadowRadius: 6,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: FontFamily.sansSemiBold,
          fontSize: 10,
          letterSpacing: 0,
          marginTop: 1,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          paddingTop: 0,
          minHeight: Control.preferredTouchSize,
        },
        // Keep five navigation labels legible on narrow phones and large system fonts.
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
          title: 'Comunidade',
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
