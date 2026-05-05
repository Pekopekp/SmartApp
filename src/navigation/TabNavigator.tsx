import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

import DashboardScreen from '../screens/DashboardScreen';
import LogsScreen from '../screens/LogsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors, typography, radius } from '../theme/colors';
import { useApp } from '../context/AppContext';

// ─── Tab param list ───────────────────────────────────────────────────────────
export type TabParamList = {
  Dashboard: undefined;
  Logs: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof TabParamList, { default: TabIconName; focused: TabIconName }> = {
  Dashboard: { default: 'grid-outline', focused: 'grid' },
  Logs: { default: 'bar-chart-outline', focused: 'bar-chart' },
  Settings: { default: 'settings-outline', focused: 'settings' },
};

const TabNavigator: React.FC = () => {
  const { alerts } = useApp();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarBackground: () =>
            Platform.OS === 'ios' ? (
              <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060B18EE' }]} />
            ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ color, focused }) => {
            const icons = TAB_ICONS[route.name as keyof TabParamList];
            return (
              <View style={focused ? styles.activeIconWrapper : styles.inactiveIconWrapper}>
                <Ionicons
                  name={focused ? icons.focused : icons.default}
                  size={focused ? 22 : 20}
                  color={color}
                />
              </View>
            );
          },
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarBadge: alerts.length > 0 ? alerts.length : undefined,
            tabBarBadgeStyle: styles.badge,
          }}
        />
        <Tab.Screen name="Logs" component={LogsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  tabLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  activeIconWrapper: {
    backgroundColor: `${colors.primary}20`,
    borderRadius: radius.md,
    padding: 6,
  },
  inactiveIconWrapper: {
    padding: 6,
  },
  badge: {
    backgroundColor: colors.danger,
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
    minWidth: 16,
    height: 16,
    lineHeight: 16,
  },
});

export default TabNavigator;
