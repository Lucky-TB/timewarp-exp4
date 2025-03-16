import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
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
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Sample focus session data
const FOCUS_SESSIONS = {
  'deep': {
    id: 'deep',
    name: 'Deep Focus',
    description: 'Intense concentration for challenging tasks',
    duration: 25,
    color: 'primary',
    icon: 'brain',
    benefits: [
      'Ideal for complex problem solving',
      'Minimizes context switching',
      'Maximizes cognitive resources',
    ],
    tips: [
      'Find a quiet environment',
      'Turn off all notifications',
      'Set a clear goal before starting',
    ],
  },
  'flow': {
    id: 'flow',
    name: 'Flow State',
    description: 'Extended period of optimal performance',
    duration: 50,
    color: 'secondary',
    icon: 'water',
    benefits: [
      'Heightened creativity',
      'Time distortion (feels shorter)',
      'Intrinsic motivation boost',
    ],
    tips: [
      'Choose tasks with clear goals',
      'Work at the edge of your abilities',
      'Eliminate all distractions',
    ],
  },
  'light': {
    id: 'light',
    name: 'Light Focus',
    description: 'Gentle concentration for easier tasks',
    duration: 15,
    color: 'accent',
    icon: 'sunny',
    benefits: [
      'Good for routine tasks',
      'Less mentally taxing',
      'Easier to maintain consistently',
    ],
    tips: [
      'Use for administrative tasks',
      'Good for warming up your focus',
      'Combine with music if helpful',
    ],
  },
  'custom': {
    id: 'custom',
    name: 'Custom Focus',
    description: 'Personalized focus session',
    duration: 30,
    color: 'info',
    icon: 'options',
    benefits: [
      'Tailored to your specific needs',
      'Adaptable to your energy levels',
      'Flexible for different task types',
    ],
    tips: [
      'Experiment with different durations',
      'Adjust based on your energy level',
      'Track which settings work best',
    ],
  },
};

export default function FocusSessionDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [session, setSession] = useState(null);
  
  // Animation values
  const pageOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.95);
  
  // Load session data
  useEffect(() => {
    if (id && FOCUS_SESSIONS[id]) {
      setSession(FOCUS_SESSIONS[id]);
      
      // Animations
      pageOpacity.value = withTiming(1, { duration: 400 });
      cardScale.value = withSpring(1, { damping: 12 });
      
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [id]);
  
  // Animated styles
  const pageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value,
  }));
  
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));
  
  // Handle close
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Exit animations
    pageOpacity.value = withTiming(0, { duration: 300 }, () => {
      router.back();
    });
  };
  
  // Handle start session
  const handleStartSession = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Navigate to focus screen with session data
    router.push({
      pathname: '/(tabs)/focus',
      params: { sessionId: id },
    });
  };
  
  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Session not found</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <Animated.View style={[styles.content, pageAnimatedStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.subtle }]}
            onPress={handleClose}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Session Card */}
          <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
            <LinearGradient
              colors={colors.gradient[session.color]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={session.icon} size={40} color="white" />
              </View>
              
              <Text style={styles.sessionName}>{session.name}</Text>
              <Text style={styles.sessionDescription}>{session.description}</Text>
              
              <View style={styles.durationContainer}>
                <Ionicons name="time-outline" size={18} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.durationText}>{session.duration} minutes</Text>
              </View>
            </LinearGradient>
          </Animated.View>
          
          {/* Benefits Section */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy-outline" size={22} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Benefits</Text>
            </View>
            
            <View style={styles.listContainer}>
              {session.benefits.map((benefit, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={[styles.bulletPoint, { backgroundColor: colors[session.color] }]} />
                  <Text style={[styles.listText, { color: colors.text }]}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Tips Section */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb-outline" size={22} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Tips for Success</Text>
            </View>
            
            <View style={styles.listContainer}>
              {session.tips.map((tip, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={[styles.bulletPoint, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.listText, { color: colors.text }]}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Stats Section */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart-outline" size={22} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Stats</Text>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>12</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Sessions Completed
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>5.2</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Hours Focused
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>85%</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Completion Rate
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Start Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors[session.color] }]}
            onPress={handleStartSession}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Start Session</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  cardContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  sessionName: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 8,
  },
  sessionDescription: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 15,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  durationText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: 'white',
    marginLeft: 5,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
  },
  listContainer: {
    marginLeft: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  listText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 15,
    backgroundColor: 'transparent',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    marginRight: 8,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    marginTop: 100,
  },
}); 