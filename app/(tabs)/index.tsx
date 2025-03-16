import React, { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  ImageBackground,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withSequence, 
  withTiming, 
  interpolate,
  Easing
} from 'react-native-reanimated';
import { Link, useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [userName, setUserName] = useState('Time Traveler');
  const [focusTime, setFocusTime] = useState('2:45');
  const router = useRouter();

  // Animated values
  const welcomeOpacity = useSharedValue(0);
  const dashboardScale = useSharedValue(0.95);
  const focusRotation = useSharedValue(0);
  const monsterSize = useSharedValue(1);

  // Animation effects
  useEffect(() => {
    welcomeOpacity.value = withTiming(1, { duration: 800 });
    dashboardScale.value = withSpring(1, { damping: 12 });
    focusRotation.value = withRepeat(withSequence(
      withTiming(-0.02, { duration: 1000 }),
      withTiming(0.02, { duration: 1000 })
    ), -1, true);
    
    // Simulate procrastination monster breathing
    monsterSize.value = withRepeat(
      withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Trigger welcome haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // Animated styles
  const welcomeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
    transform: [
      { translateY: interpolate(welcomeOpacity.value, [0, 1], [20, 0]) }
    ]
  }));

  const dashboardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: dashboardScale.value }
    ]
  }));

  const focusDialAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${focusRotation.value}rad` }
    ]
  }));

  const monsterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: monsterSize.value }
    ]
  }));

  const handleFocusPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to the focus tab
    router.push('/focus');
  };

  return (
    <View style={styles.container}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header Section */}
      <Animated.View style={[styles.headerContainer, welcomeAnimatedStyle]}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>Good afternoon,</Text>
          <Text style={[styles.username, { color: colors.text }]}>{userName}</Text>
        </View>
        <LinearGradient
          colors={colors.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileButton}>
          <Text style={styles.profileButtonText}>TB</Text>
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.dashboardContainer, dashboardAnimatedStyle]}>
          {/* Focus Session Card */}
          <TouchableOpacity onPress={handleFocusPress} activeOpacity={0.9}>
            <LinearGradient
              colors={colors.gradient.focus}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.focusCard}>
              <View style={styles.focusCardContent}>
                <View>
                  <Text style={styles.focusCardTitle}>Today's Focus</Text>
                  <Text style={styles.focusCardSubtitle}>Resume where you left off</Text>
                </View>
                <Animated.View style={[styles.focusDial, focusDialAnimatedStyle]}>
                  <View style={styles.focusDialInner}>
                    <Text style={styles.focusDialText}>{focusTime}</Text>
                    <Text style={styles.focusDialUnit}>hours</Text>
                  </View>
                </Animated.View>
              </View>
              <View style={styles.focusCardFooter}>
                <Text style={styles.focusCardFooterText}>Continue Session</Text>
                <View style={styles.focusCardIcon}>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Stats Cards Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: colors.card }]}
              activeOpacity={0.8}>
              <View style={[styles.statIconBg, { backgroundColor: colors.subtle }]}>
                <Ionicons name="flame" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>5</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Day Streak</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: colors.card }]}
              activeOpacity={0.8}>
              <View style={[styles.statIconBg, { backgroundColor: colors.subtle }]}>
                <Ionicons name="checkmark-done" size={20} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>12</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Tasks Done</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: colors.card }]}
              activeOpacity={0.8}>
              <View style={[styles.statIconBg, { backgroundColor: colors.subtle }]}>
                <Ionicons name="timer-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>8.2</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Focus Hours</Text>
            </TouchableOpacity>
          </View>

          {/* Procrastination Monster Card */}
          <View style={[styles.monsterCard, { backgroundColor: colors.card }]}>
            <View style={styles.monsterContent}>
              <View>
                <Text style={[styles.monsterTitle, { color: colors.text }]}>
                  Procrastination Monster
                </Text>
                <Text style={[styles.monsterSubtitle, { color: colors.muted }]}>
                  It's shrinking! Keep up the good work.
                </Text>
              </View>
              <Animated.View style={[styles.monsterContainer, monsterAnimatedStyle]}>
                <View style={[styles.monster, { backgroundColor: colors.warning }]}>
                  <Text style={styles.monsterEmoji}>👾</Text>
                </View>
              </Animated.View>
            </View>
            <View style={[styles.monsterProgress, { backgroundColor: colors.subtle }]}>
              <View style={[styles.monsterProgressFill, { width: '30%', backgroundColor: colors.warning }]} />
            </View>
            <Text style={[styles.monsterProgressText, { color: colors.muted }]}>
              30% smaller than yesterday
            </Text>
          </View>

          {/* Tasks Due Today */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Due Today</Text>
            <Link href="/tasks" asChild>
              <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={[styles.taskCard, { backgroundColor: colors.card }]}>
            <View style={[styles.taskPriority, { backgroundColor: colors.danger }]} />
            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, { color: colors.text }]}>
                Finish TimeWarp Focus App
              </Text>
              <Text style={[styles.taskTime, { color: colors.muted }]}>
                Due in 2 hours
              </Text>
            </View>
            <TouchableOpacity style={styles.taskAction}>
              <MaterialCommunityIcons name="clock-fast" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.taskCard, { backgroundColor: colors.card }]}>
            <View style={[styles.taskPriority, { backgroundColor: colors.warning }]} />
            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, { color: colors.text }]}>
                Add 3D visualization effects
              </Text>
              <Text style={[styles.taskTime, { color: colors.muted }]}>
                Due in 5 hours
              </Text>
            </View>
            <TouchableOpacity style={styles.taskAction}>
              <MaterialCommunityIcons name="clock-fast" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  username: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginTop: -5,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  dashboardContainer: {
    paddingHorizontal: 20,
  },
  focusCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  focusCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  focusCardTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 4,
  },
  focusCardSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  focusDial: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusDialInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusDialText: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: 'white',
  },
  focusDialUnit: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: -5,
  },
  focusCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  focusCardFooterText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: 'white',
  },
  focusCardIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  monsterCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  monsterContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monsterTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  monsterSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    maxWidth: '80%',
  },
  monsterContainer: {
    marginLeft: 10,
  },
  monster: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monsterEmoji: {
    fontSize: 28,
  },
  monsterProgress: {
    height: 6,
    borderRadius: 3,
    marginTop: 15,
    marginBottom: 5,
    overflow: 'hidden',
  },
  monsterProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  monsterProgressText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  taskCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskPriority: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
  },
  taskAction: {
    alignSelf: 'center',
    padding: 8,
  },
});
