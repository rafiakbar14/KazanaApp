import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/context/AuthContext';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import SessionListScreen from './src/screens/SessionListScreen';
import OpnameDetailScreen from './src/screens/OpnameDetailScreen';
import InboundListScreen from './src/screens/InboundListScreen';
import InboundDetailScreen from './src/screens/InboundDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { BlurView } from 'expo-blur';
import { COLORS, RADIUS, SHADOWS } from './src/constants/Theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any = 'help-circle';
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Opname') iconName = focused ? 'clipboard' : 'clipboard-outline';
          else if (route.name === 'Terima') iconName = focused ? 'cube' : 'cube-outline';
          else if (route.name === 'Profil') iconName = focused ? 'person-circle' : 'person-circle-outline';
          
          return (
            <View style={{
              backgroundColor: focused ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons 
                name={iconName} 
                size={22} 
                color={focused ? COLORS.primary : COLORS.text.light} 
              />
            </View>
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.light,
        tabBarBackground: () => (
          <BlurView 
            intensity={80} 
            tint="light" 
            style={{ 
              position: 'absolute', 
              top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: RADIUS.xl,
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.7)'
            }} 
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 20,
          right: 20,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 12,
          paddingTop: 12,
          borderRadius: RADIUS.xl,
          ...SHADOWS.medium,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginTop: 4
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Opname" component={SessionListScreen} />
      <Tab.Screen name="Terima" component={InboundListScreen} />
      <Tab.Screen name="Profil" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function Navigation() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            {/* Detail Screens completely cover the bottom tabs when active */}
            <Stack.Screen name="OpnameDetail" component={OpnameDetailScreen} />
            <Stack.Screen name="InboundDetail" component={InboundDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Navigation />
    </AuthProvider>
  );
}
