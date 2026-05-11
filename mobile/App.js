import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import ConnectionsScreen from './src/screens/ConnectionsScreen';
import TribeScreen from './src/screens/TribeScreen';
import PactScreen from './src/screens/PactScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const icons = {
  Home: '🏠',
  Connections: '⚡',
  Tribe: '👥',
  Pact: '🔐',
  Profile: '👤',
};

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>{icons[route.name]}</Text>,
          tabBarActiveTintColor: '#667eea',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#e5e7eb',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          headerStyle: { backgroundColor: '#fff', shadowColor: 'transparent', elevation: 0, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
          headerTitleStyle: { fontWeight: 'bold', fontSize: 20, color: '#667eea' },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'GoalTracker' }} />
        <Tab.Screen name="Connections" component={ConnectionsScreen} />
        <Tab.Screen name="Tribe" component={TribeScreen} options={{ title: 'Tribe' }} />
        <Tab.Screen name="Pact" component={PactScreen} options={{ title: 'The Pact' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
