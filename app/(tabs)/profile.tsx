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

// Define interfaces for our components
interface SettingItemProps {
  icon: string;
  iconColor?: string;
  label: string;
  value?: boolean | string;
  type: 'toggle' | 'action' | 'info';
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  showChevron?: boolean;
  hapticsEnabled?: boolean;
}

interface SettingSectionProps {
  section: {
    title: string;
    icon: string;
    items: Array<{
      id: string;
      title: string;
      type: 'toggle' | 'action' | 'info';
      icon: string;
      value?: string;
      onPress?: () => void;
    }>
  };
  toggleSetting: (id: string) => void;
  isEnabled: (id: string) => boolean;
  hapticsEnabled: boolean;
}

// Simplified settings sections with only functional items
const SETTINGS_SECTIONS = [
  {
    title: 'App Preferences',
    icon: 'settings-outline',
    items: [
      { id: 'theme', title: 'Dark Mode', type: 'toggle', icon: 'moon-outline' },
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

/**
 * Trigger haptic feedback with the specified impact style
 */
const triggerHaptic = (
  impact: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium,
  isHapticsEnabled?: boolean
) => {
  // Only trigger if haptics are explicitly enabled (strictly true)
  if (isHapticsEnabled === true) {
    Haptics.impactAsync(impact);
  }
};

// SettingItem component that renders a single setting item with appropriate interaction
const SettingItem = ({
  icon,
  iconColor = Colors.primary,
  label,
  value,
  type,
  onToggle,
  onPress,
  showChevron = false,
  hapticsEnabled = false,
}: SettingItemProps) => {
  const [isEnabled, setIsEnabled] = useState(value === true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Update the isEnabled state when value prop changes
  useEffect(() => {
    setIsEnabled(value === true);
  }, [value]);

  // Handle press on the setting item
  const handlePress = () => {
    if (type === 'toggle') {
      const newValue = !isEnabled;
      setIsEnabled(newValue);
      onToggle?.(newValue);
      // Only trigger haptic feedback if haptics are enabled
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light, hapticsEnabled);
    } else if (type === 'action' && onPress) {
      onPress();
      // Only trigger haptic feedback if haptics are enabled
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light, hapticsEnabled);
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
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{label}</Text>
        </View>
      </View>
      
      <View style={styles.settingItemRight}>
        {type === 'toggle' && (
          <Switch
            value={isEnabled}
            onValueChange={() => {
              const newValue = !isEnabled;
              setIsEnabled(newValue);
              onToggle?.(newValue);
              // Only trigger haptic feedback if haptics are enabled
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light, hapticsEnabled);
            }}
            trackColor={{ false: colors.subtle, true: colors.primary }}
            thumbColor="white"
            ios_backgroundColor={colors.subtle}
          />
        )}
        
        {type === 'info' && (
          <Text style={[styles.infoValue, { color: colors.muted }]}>{value}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Setting section component
const SettingSection = ({ section, toggleSetting, isEnabled, hapticsEnabled }: SettingSectionProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
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
            icon={item.icon}
            label={item.title}
            value={item.type === 'info' ? item.value : isEnabled(item.id)}
            type={item.type}
            onToggle={(newValue) => toggleSetting(item.id)}
            onPress={item.type === 'action' ? item.onPress : undefined}
            showChevron={item.type === 'action'}
            hapticsEnabled={hapticsEnabled}
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
    haptics: false, // Default to false for safety
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
          setSettings({
            ...parsedSettings,
            // Ensure strict boolean values
            theme: parsedSettings.theme === true,
            haptics: parsedSettings.haptics === true
          });
          
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
    triggerHaptic(Haptics.NotificationFeedbackType.Success, settings.haptics);
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
    return settings[id] === true; // Ensure strict boolean comparison
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
                    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy, settings.haptics);
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
              hapticsEnabled={settings.haptics}
            />
          ))}
          
          {/* Reset Button */}
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.subtle }]}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy, settings.haptics);
              Alert.alert(
                'Reset Settings',
                'Are you sure you want to reset all settings to default?',
                [
                  { 
                    text: 'Cancel', 
                    style: 'cancel',
                    onPress: () => triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy, settings.haptics)
                  },
                  { 
                    text: 'Reset', 
                    style: 'destructive',
                    onPress: async () => {
                      triggerHaptic(Haptics.NotificationFeedbackType.Warning, settings.haptics);
                      const defaultSettings = {
                        theme: false,
                        haptics: false, // Always default to disabled for safety
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