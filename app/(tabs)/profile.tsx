import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Simplified settings sections with only functional items
const SETTINGS_SECTIONS = [
  {
    title: 'App Preferences',
    icon: 'settings-outline',
    items: [
      { id: 'theme', title: 'Dark Mode', type: 'toggle', icon: 'moon-outline' },
      { id: 'sounds', title: 'Sound Effects', type: 'toggle', icon: 'volume-high-outline' },
      { id: 'haptics', title: 'Haptic Feedback', type: 'toggle', icon: 'phone-portrait-outline' },
    ],
  },
  {
    title: 'About',
    icon: 'information-circle-outline',
    items: [
      { id: 'version', title: 'App Version', type: 'info', icon: 'code-outline', value: '1.0.0' },
    ],
  },
];

// Haptic feedback utility function
const triggerHaptic = (isHapticsEnabled, style = Haptics.ImpactFeedbackStyle.Light) => {
  if (isHapticsEnabled) {
    Haptics.impactAsync(style);
  }
};

// Setting item component
const SettingItem = ({ item, toggleSetting, isEnabled, colors }) => {
  const handlePress = () => {
    if (item.type === 'toggle') {
      toggleSetting(item.id);
      triggerHaptic(isEnabled('haptics'));
    } else {
      // For non-toggle items, still trigger haptic if enabled
      triggerHaptic(isEnabled('haptics'));
    }
  };
  
  return (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.settingIconContainer, { backgroundColor: colors.subtle }]}>
          <Ionicons name={item.icon} size={18} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
        </View>
      </View>
      
      <View style={styles.settingItemRight}>
        {item.type === 'toggle' && (
          <Switch
            value={isEnabled(item.id)}
            onValueChange={() => {
              toggleSetting(item.id);
              triggerHaptic(isEnabled('haptics'));
            }}
            trackColor={{ false: colors.subtle, true: colors.primary }}
            thumbColor="white"
            ios_backgroundColor={colors.subtle}
          />
        )}
        
        {item.type === 'info' && (
          <Text style={[styles.infoValue, { color: colors.muted }]}>{item.value}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Setting section component
const SettingSection = ({ section, toggleSetting, isEnabled, colors }) => {
  return (
    <View style={styles.settingSection}>
      <View style={styles.sectionHeader}>
        <Ionicons name={section.icon} size={18} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
      </View>
      
      <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
        {section.items.map((item) => (
          <SettingItem
            key={item.id}
            item={item}
            toggleSetting={toggleSetting}
            isEnabled={isEnabled}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
};

export default function ProfileScreen() {
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState(systemColorScheme);
  const colors = Colors[colorScheme ?? 'light'];
  
  const [settings, setSettings] = useState({
    theme: colorScheme === 'dark',
    sounds: true,
    haptics: true,
  });
  
  const pageOpacity = useSharedValue(0);
  const profileScale = useSharedValue(0.9);
  
  // Load settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('userSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(parsedSettings);
          
          // Apply theme setting
          if (parsedSettings.theme !== undefined) {
            setColorScheme(parsedSettings.theme ? 'dark' : 'light');
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Animation effects
  useEffect(() => {
    pageOpacity.value = withTiming(1, { duration: 800 });
    profileScale.value = withSpring(1, { damping: 12 });
    
    // Trigger welcome haptic if enabled
    triggerHaptic(settings.haptics, Haptics.NotificationFeedbackType.Success);
  }, []);
  
  // Animated styles
  const pageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value,
  }));
  
  const profileAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: profileScale.value }],
  }));
  
  // Toggle setting handler with AsyncStorage persistence
  const toggleSetting = async (id) => {
    try {
      const newSettings = {
        ...settings,
        [id]: !settings[id],
      };
      
      setSettings(newSettings);
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
      
      // Handle theme toggle
      if (id === 'theme') {
        setColorScheme(newSettings.theme ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };
  
  // Check if setting is enabled
  const isEnabled = (id) => {
    return settings[id] || false;
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <Animated.View style={[styles.content, pageAnimatedStyle]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Header */}
          <Animated.View style={[styles.profileHeader, profileAnimatedStyle]}>
            <LinearGradient
              colors={colors.gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileGradient}
            >
              <View style={styles.profileContent}>
                <TouchableOpacity 
                  style={styles.profileImageContainer}
                  onPress={() => {
                    triggerHaptic(settings.haptics, Haptics.ImpactFeedbackStyle.Medium);
                    // Could eventually handle profile image change functionality
                  }}
                >
                  <Text style={styles.profileInitials}>TW</Text>
                </TouchableOpacity>
                
                <Text style={styles.profileName}>TimeWarp User</Text>
                <Text style={styles.profileEmail}>user@timewarp.app</Text>
              </View>
            </LinearGradient>
          </Animated.View>
          
          {/* Settings */}
          {SETTINGS_SECTIONS.map((section) => (
            <SettingSection
              key={section.title}
              section={section}
              toggleSetting={toggleSetting}
              isEnabled={isEnabled}
              colors={colors}
            />
          ))}
          
          {/* Reset Button */}
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.subtle }]}
            onPress={() => {
              triggerHaptic(settings.haptics, Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert(
                'Reset Settings',
                'Are you sure you want to reset all settings to default?',
                [
                  { 
                    text: 'Cancel', 
                    style: 'cancel',
                    onPress: () => triggerHaptic(settings.haptics, Haptics.ImpactFeedbackStyle.Light)
                  },
                  { 
                    text: 'Reset', 
                    style: 'destructive',
                    onPress: async () => {
                      triggerHaptic(settings.haptics, Haptics.NotificationFeedbackType.Warning);
                      const defaultSettings = {
                        theme: false,
                        sounds: true,
                        haptics: true,
                      };
                      setSettings(defaultSettings);
                      setColorScheme('light');
                      await AsyncStorage.setItem('userSettings', JSON.stringify(defaultSettings));
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="refresh-outline" size={18} color={colors.warning} />
            <Text style={[styles.resetText, { color: colors.warning }]}>Reset Settings</Text>
          </TouchableOpacity>
          
          <Text style={[styles.versionText, { color: colors.muted }]}>
            TimeWarp Focus v1.0.0
          </Text>
          
          <Text style={[styles.disclaimerText, { color: colors.muted }]}>
            Note: This is a simplified profile screen with only working features enabled.
          </Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    marginBottom: 20,
  },
  profileGradient: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  profileContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  profileInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  settingSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionContent: {
    borderRadius: 20,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 14,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  resetText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 10,
  },
  disclaimerText: {
    textAlign: 'center',
    fontSize: 12,
    marginHorizontal: 40,
    marginBottom: 20,
    fontStyle: 'italic',
  },
}); 