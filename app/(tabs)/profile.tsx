import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// Setting sections
const SETTINGS_SECTIONS = [
  {
    title: 'App Preferences',
    icon: 'settings-outline',
    items: [
      { id: 'theme', title: 'Dark Mode', type: 'toggle', icon: 'moon-outline' },
      { id: 'notifications', title: 'Notifications', type: 'toggle', icon: 'notifications-outline' },
      { id: 'sounds', title: 'Sound Effects', type: 'toggle', icon: 'volume-high-outline' },
      { id: 'haptics', title: 'Haptic Feedback', type: 'toggle', icon: 'phone-portrait-outline' },
    ],
  },
  {
    title: 'Focus Settings',
    icon: 'timer-outline',
    items: [
      { id: 'pomodoro', title: 'Pomodoro Duration', type: 'select', icon: 'time-outline', value: '25 min' },
      { id: 'break', title: 'Break Duration', type: 'select', icon: 'cafe-outline', value: '5 min' },
      { id: 'dnd', title: 'Auto DND Mode', type: 'toggle', icon: 'notifications-off-outline' },
    ],
  },
  {
    title: 'Task Settings',
    icon: 'list-outline',
    items: [
      { id: 'defaultPriority', title: 'Default Priority', type: 'select', icon: 'flag-outline', value: 'Medium' },
      { id: 'reminders', title: 'Task Reminders', type: 'toggle', icon: 'alarm-outline' },
      { id: 'location', title: 'Location Reminders', type: 'toggle', icon: 'location-outline' },
    ],
  },
  {
    title: 'Data & Privacy',
    icon: 'shield-outline',
    items: [
      { id: 'backup', title: 'Backup Data', type: 'action', icon: 'cloud-upload-outline' },
      { id: 'export', title: 'Export Statistics', type: 'action', icon: 'download-outline' },
      { id: 'privacy', title: 'Privacy Settings', type: 'navigate', icon: 'lock-closed-outline' },
    ],
  },
  {
    title: 'About',
    icon: 'information-circle-outline',
    items: [
      { id: 'version', title: 'App Version', type: 'info', icon: 'code-outline', value: '1.0.0' },
      { id: 'feedback', title: 'Send Feedback', type: 'action', icon: 'chatbubble-outline' },
      { id: 'rate', title: 'Rate the App', type: 'action', icon: 'star-outline' },
    ],
  },
];

// Setting item component
const SettingItem = ({ item, toggleSetting, isEnabled, colors }) => {
  const handlePress = () => {
    if (item.type === 'toggle') {
      toggleSetting(item.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (item.type === 'action' || item.type === 'navigate') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Handle navigation or action
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
          {item.description && (
            <Text style={[styles.settingDescription, { color: colors.muted }]}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.settingItemRight}>
        {item.type === 'toggle' && (
          <Switch
            value={isEnabled(item.id)}
            onValueChange={() => toggleSetting(item.id)}
            trackColor={{ false: colors.subtle, true: colors.primary }}
            thumbColor="white"
            ios_backgroundColor={colors.subtle}
          />
        )}
        
        {item.type === 'select' && (
          <View style={styles.selectContainer}>
            <Text style={[styles.selectValue, { color: colors.muted }]}>{item.value}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </View>
        )}
        
        {item.type === 'info' && (
          <Text style={[styles.infoValue, { color: colors.muted }]}>{item.value}</Text>
        )}
        
        {item.type === 'navigate' && (
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        )}
        
        {item.type === 'action' && (
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
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
        {section.items.map((item, index) => (
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [settings, setSettings] = useState({
    theme: colorScheme === 'dark',
    notifications: true,
    sounds: true,
    haptics: true,
    dnd: false,
    reminders: true,
    location: false,
  });
  const [userName, setUserName] = useState('Time Traveler');
  const [userEmail, setUserEmail] = useState('time@warpfocus.app');
  const pageOpacity = useSharedValue(0);
  const profileScale = useSharedValue(0.9);
  
  // Animation effects
  useEffect(() => {
    pageOpacity.value = withTiming(1, { duration: 800 });
    profileScale.value = withSpring(1, { damping: 12 });
    
    // Trigger welcome haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  
  // Animated styles
  const pageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value,
  }));
  
  const profileAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: profileScale.value }],
  }));
  
  // Toggle setting handler
  const toggleSetting = (id) => {
    setSettings(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  
  // Check if setting is enabled
  const isEnabled = (id) => {
    return settings[id] || false;
  };
  
  return (
    <View style={styles.container}>
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
                <View style={styles.profileImageContainer}>
                  <Text style={styles.profileInitials}>TB</Text>
                </View>
                
                <Text style={styles.profileName}>{userName}</Text>
                <Text style={styles.profileEmail}>{userEmail}</Text>
                
                <TouchableOpacity
                  style={styles.editProfileButton}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                >
                  <Text style={styles.editProfileText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
          
          {/* Stats Summary */}
          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>24.5</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Focus Hours</Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>42</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Tasks Done</Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>7</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Day Streak</Text>
            </View>
          </View>
          
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
          
          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.subtle }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>Log Out</Text>
          </TouchableOpacity>
          
          <Text style={[styles.versionText, { color: colors.muted }]}>
            TimeWarp Focus v1.0.0
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
    fontFamily: 'Poppins-Bold',
    color: 'white',
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  editProfileButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  editProfileText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: 'white',
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
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
    fontFamily: 'Poppins-SemiBold',
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
    fontFamily: 'Poppins-Medium',
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginRight: 5,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginBottom: 20,
  },
}); 