import 'react-native-gesture-handler';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';

import HomeScreen from './src/screens/HomeScreen';
import ConnectionsScreen from './src/screens/ConnectionsScreen';
import TribeScreen from './src/screens/TribeScreen';
import PactScreen from './src/screens/PactScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import LoginScreen from './src/screens/LoginScreen';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { registerForPushNotifications } from './src/lib/pushNotifications';
import { useNotificationsV2 } from './src/hooks/useNotificationsV2';
import ConnectionMatchModal from './src/components/ConnectionMatchModal';
import { getDisplayName } from './src/lib/displayName';

const Tab = createBottomTabNavigator();

const icons = {
  Home: '🏠',
  Goals: '🎯',
  Connections: '⚡',
  Tribe: '👥',
  Pact: '🔐',
  Notifications: '🔔',
  Profile: '👤',
};

function MainTabs() {
  return (
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
      <Tab.Screen name="Goals" component={GoalsScreen} options={{ title: 'Goals' }} />
      <Tab.Screen name="Connections" component={ConnectionsScreen} />
      <Tab.Screen name="Tribe" component={TribeScreen} options={{ title: 'Tribe' }} />
      <Tab.Screen name="Pact" component={PactScreen} options={{ title: 'The Pact' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthedApp({ userId }) {
  const [matchNotif, setMatchNotif] = useState(null);
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotifications(userId);
  }, [userId]);

  // Tapping a push notification (app backgrounded/closed) -- surface the
  // match modal for connection_accepted the same way the realtime listener
  // does when the app is already open.
  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const title = response.notification.request.content.title;
      if (title === "🎉 It's a Spark!") {
        setMatchNotif({ actor: { first_name: 'Your', last_name: 'partner' } });
      }
    });
    return () => responseListener.current?.remove();
  }, []);

  const handleConnectionAccepted = useRef((notif) => setMatchNotif(notif)).current;
  useNotificationsV2(userId, handleConnectionAccepted);

  return (
    <>
      <MainTabs />
      <ConnectionMatchModal
        visible={!!matchNotif}
        otherName={getDisplayName(matchNotif?.actor, 'your new connection')}
        onMessage={() => setMatchNotif(null)}
        onClose={() => setMatchNotif(null)}
      />
    </>
  );
}

function Root() {
  const { session, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF7A00" />
      </View>
    );
  }
  return session ? <AuthedApp userId={session.user.id} /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Root />
      </NavigationContainer>
    </AuthProvider>
  );
}
