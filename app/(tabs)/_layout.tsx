import { Tabs } from 'expo-router';
import { useColorScheme, StyleSheet, View, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useState, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';

// Global state to track haptic setting
const useHapticSettings = () => {
  const [isHapticsEnabled, setIsHapticsEnabled] = useState(false); // Default to false

  useEffect(() => {
    const loadHapticSetting = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('userSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          // Explicitly check for boolean true
          setIsHapticsEnabled(parsedSettings.haptics === true);
        }
      } catch (error) {
        console.error('Error loading haptic setting:', error);
        // Default to disabled on error
        setIsHapticsEnabled(false);
      }
    };

    loadHapticSetting();

    // Set up a listener for changes to haptic settings
    const subscribeToSettingsChanges = () => {
      const interval = setInterval(async () => {
        try {
          const savedSettings = await AsyncStorage.getItem('userSettings');
          if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            setIsHapticsEnabled(parsedSettings.haptics === true);
          }
        } catch (error) {
          console.error('Error checking for settings changes:', error);
        }
      }, 1000); // Check every second
      
      return () => clearInterval(interval);
    };
    
    const unsubscribe = subscribeToSettingsChanges();
    return unsubscribe;
  }, []);

  return isHapticsEnabled;
};

/**
 * Trigger maximum-intensity haptic feedback
 */
const triggerMaxHaptic = (isEnabled: boolean) => {
  // Only trigger haptics if explicitly enabled
  if (isEnabled === true) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

function TabBarIcon({ name, color, focused }: any) {
  const isHapticsEnabled = useHapticSettings();
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.7)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (focused) {
      // Only trigger haptic when focused changes to true AND haptics are enabled
      if (isHapticsEnabled === true) {
        triggerMaxHaptic(isHapticsEnabled);
      }
      
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      Animated.timing(opacityAnim, {
        toValue: 0.7,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [focused, isHapticsEnabled, opacityAnim, scaleAnim]);
  
  return (
    <Animated.View style={{
      transform: [{ scale: scaleAnim }],
      opacity: opacityAnim
    }}>
      <Ionicons name={name} size={24} color={color} />
    </Animated.View>
  );
}

function MaterialTabBarIcon({ name, color, focused }: any) {
  const isHapticsEnabled = useHapticSettings();
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.7)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (focused) {
      // Only trigger haptic when focused changes to true AND haptics are enabled
      if (isHapticsEnabled === true) {
        triggerMaxHaptic(isHapticsEnabled);
      }
      
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      Animated.timing(opacityAnim, {
        toValue: 0.7,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [focused, isHapticsEnabled, opacityAnim, scaleAnim]);
  
  return (
    <Animated.View style={{
      transform: [{ scale: scaleAnim }],
      opacity: opacityAnim
    }}>
      <MaterialCommunityIcons name={name} size={24} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isHapticsEnabled = useHapticSettings();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        ),
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="timer-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="list" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="companion"
        options={{
          title: 'Companion',
          tabBarIcon: ({ color, focused }) => <MaterialTabBarIcon name="account-heart" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="person" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 80,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderTopWidth: 0,
    paddingBottom: 20,
  },
  tabBarLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
  }
});
