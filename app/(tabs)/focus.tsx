import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Switch,
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
  interpolate,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  withDelay,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Link, router } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Sample focus modes
const FOCUS_MODES = [
  { id: 'deep', name: 'Deep Focus', duration: 25, color: 'primary' },
  { id: 'flow', name: 'Flow State', duration: 50, color: 'secondary' },
  { id: 'light', name: 'Light Focus', duration: 15, color: 'accent' },
  { id: 'custom', name: 'Custom', duration: 30, color: 'info' },
];

export default function FocusScreen() {
  const [selectedMode, setSelectedMode] = useState(FOCUS_MODES[0]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(FOCUS_MODES[0].duration * 60);
  const [distractions, setDistractions] = useState(0);
  const [isDndEnabled, setIsDndEnabled] = useState(false);
  
  const theme = useColorScheme();
  const colors = Colors[theme ?? 'light'];
  
  // Animation values
  const headerOpacity = useSharedValue(1);
  const focusRingScale = useSharedValue(1);
  const pageOpacity = useSharedValue(0);
  const statsScale = useSharedValue(0.95);
  
  // New animation values for the shader replacement
  const backgroundAnimation = useSharedValue(0);
  const progressValue = useSharedValue(0);
  
  // Timer ref for cleanup
  const timerRef = useRef(null);
  
  useEffect(() => {
    // Start page fade-in animation
    pageOpacity.value = withTiming(1, { duration: 800 });
    
    // Start background animation
    backgroundAnimation.value = withRepeat(
      withTiming(1, { duration: 10000 }),
      -1, // infinite loop
      true // reverse
    );
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      cancelAnimation(backgroundAnimation);
    };
  }, []);
  
  // Updated to show progress with Reanimated
  useEffect(() => {
    if (isTimerRunning && !isPaused) {
      // Set the progress value based on time remaining
      const totalTime = selectedMode.duration * 60;
      const progress = 1 - (timeRemaining / totalTime);
      progressValue.value = withTiming(progress, { duration: 500 });
      
      // Update backgroundAnimation to pulse faster when timer is running
      cancelAnimation(backgroundAnimation);
      backgroundAnimation.value = withRepeat(
        withTiming(1, { duration: isTimerRunning ? 5000 : 10000 }),
        -1,
        true
      );
    }
  }, [isTimerRunning, isPaused, timeRemaining]);
  
  // Timer controls
  const startTimer = () => {
    if (!isTimerRunning) {
      // Start the timer
      setIsTimerRunning(true);
      setIsPaused(false);
      
      // Pulse animation when timer starts
      focusRingScale.value = withSequence(
        withTiming(1.1, { duration: 300, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) })
      );
      
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Set up interval
      timerRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            completeTimer();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (isPaused) {
      // Resume the timer
      setIsPaused(false);
      
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Set up interval again
      timerRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            completeTimer();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
  };
  
  const pauseTimer = () => {
    if (isTimerRunning && !isPaused) {
      clearInterval(timerRef.current);
      setIsPaused(true);
      
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const resetTimer = () => {
    clearInterval(timerRef.current);
    setIsTimerRunning(false);
    setIsPaused(false);
    setTimeRemaining(selectedMode.duration * 60);
    progressValue.value = withTiming(0, { duration: 500 });
    
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };
  
  // Format time to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Complete timer function
  const completeTimer = () => {
    clearInterval(timerRef.current);
    setIsTimerRunning(false);
    setIsPaused(false);
    
    // Celebration animation
    focusRingScale.value = withSequence(
      withTiming(1.2, { duration: 300 }),
      withTiming(1, { duration: 300 })
    );
    
    // Haptic success feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Would log the completed session to stats here
  };
  
  // Handle selecting a focus mode
  const selectMode = (mode) => {
    if (mode.id !== selectedMode.id) {
      setSelectedMode(mode);
      setTimeRemaining(mode.duration * 60);
      progressValue.value = withTiming(0, { duration: 300 });
      
      // Haptic feedback
      Haptics.selectionAsync();
    }
  };
  
  // Handle recording a distraction
  const recordDistraction = () => {
    if (isTimerRunning) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDistractions(prev => prev + 1);
      
      // Visual effect for distraction
      focusRingScale.value = withSequence(
        withTiming(0.95, { duration: 200 }),
        withTiming(1, { duration: 300 })
      );
    }
  };
  
  // Animated styles
  const timerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusRingScale.value }]
  }));
  
  const pageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value
  }));
  
  // Get mode color
  const getModeColor = (modeColor) => {
    return colors.gradient[modeColor] || colors.gradient.primary;
  };
  
  // Animated styles for the background effect
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: 0.8,
      transform: [
        { scale: interpolate(backgroundAnimation.value, [0, 1], [1, 1.1]) },
      ],
    };
  });
  
  // Animated styles for the progress ring
  const progressRingStyle = useAnimatedStyle(() => {
    const rotation = interpolate(progressValue.value, [0, 1], [0, 360]);
    return {
      transform: [
        { rotateZ: `${rotation}deg` },
      ],
      width: 220,
      height: 220,
      borderRadius: 110,
      borderWidth: 10,
      borderColor: 'transparent',
      borderTopColor: selectedMode ? getModeColor(selectedMode.color)[0] : colors.primary,
      position: 'absolute',
    };
  });
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Animated.View style={[styles.shaderContainer, { position: 'absolute', width, height }]}>
        <Animated.View style={[styles.animatedBackground, animatedBackgroundStyle]}>
          <LinearGradient
            colors={isTimerRunning 
              ? ['rgba(102, 76, 229, 0.8)', 'rgba(51, 126, 232, 0.8)']
              : ['rgba(76, 76, 102, 0.6)', 'rgba(51, 51, 77, 0.6)']}
            style={{ width: width * 1.2, height: height * 1.2, position: 'absolute' }}
          />
        </Animated.View>
      </Animated.View>
      
      <BlurView intensity={30} tint={theme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      
      <Animated.View style={[styles.content, pageAnimatedStyle]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Focus Session</Text>
            <TouchableOpacity 
              style={[styles.dndToggle, { backgroundColor: isDndEnabled ? colors.primary : colors.subtle }]}
              onPress={() => {
                Haptics.selectionAsync();
                setIsDndEnabled(prev => !prev);
              }}>
              <Ionicons 
                name={isDndEnabled ? "notifications-off" : "notifications-outline"} 
                size={16} 
                color={isDndEnabled ? "white" : colors.muted} 
              />
              <Text style={[styles.dndText, { color: isDndEnabled ? "white" : colors.muted }]}>
                {isDndEnabled ? "DND On" : "DND Off"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Focus Modes */}
          <View style={styles.modeContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Focus Mode</Text>
            <View style={styles.modeList}>
              {FOCUS_MODES.map((mode) => (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modeCard,
                    { 
                      backgroundColor: selectedMode.id === mode.id 
                        ? colors[mode.color] 
                        : colors.card,
                      borderColor: colors[mode.color],
                      borderWidth: selectedMode.id === mode.id ? 0 : 1,
                    }
                  ]}
                  onPress={() => selectMode(mode)}
                >
                  <Text 
                    style={[
                      styles.modeName, 
                      { 
                        color: selectedMode.id === mode.id 
                          ? 'white' 
                          : colors.text
                      }
                    ]}
                  >
                    {mode.name}
                  </Text>
                  <Text 
                    style={[
                      styles.modeDuration, 
                      { 
                        color: selectedMode.id === mode.id 
                          ? 'rgba(255, 255, 255, 0.8)' 
                          : colors.muted 
                      }
                    ]}
                  >
                    {mode.duration} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Timer Circle */}
          <View style={styles.timerContainer}>
            <Animated.View style={[styles.timerCircle, timerAnimatedStyle]}>
              <View style={styles.timerInnerCircle}>
                <Animated.View style={progressRingStyle} />
                <LinearGradient
                  colors={getModeColor(selectedMode.color)}
                  style={styles.timerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Animated.View style={styles.timerContent}>
                    <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                    <Text style={styles.timerLabel}>
                      {isTimerRunning 
                        ? (isPaused ? "Paused" : "Focus in progress") 
                        : "Ready to focus"}
                    </Text>
                  </Animated.View>
                </LinearGradient>
              </View>
            </Animated.View>
            
            {/* Timer Controls */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={resetTimer}
              >
                <Ionicons name="refresh" size={24} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.controlButton, 
                  styles.controlButtonPrimary,
                  { backgroundColor: isTimerRunning && !isPaused ? 'rgba(255,50,50,0.3)' : 'rgba(50,205,50,0.3)' }
                ]}
                onPress={isTimerRunning && !isPaused ? pauseTimer : startTimer}
              >
                <Ionicons 
                  name={isTimerRunning && !isPaused ? "pause" : "play"} 
                  size={32} 
                  color="white" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={recordDistraction}
              >
                <Ionicons name="alert-circle-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{distractions}</Text>
                <Text style={styles.statLabel}>Distractions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {Math.floor((selectedMode.duration * 60 - timeRemaining) / 60)}
                </Text>
                <Text style={styles.statLabel}>Minutes Focused</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  shaderContainer: {
    zIndex: 0,
    overflow: 'hidden',
  },
  animatedBackground: {
    position: 'absolute',
    width: width * 1.2,
    height: height * 1.2,
    left: -width * 0.1,
    top: -height * 0.1,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  dndToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dndText: {
    marginLeft: 5,
    fontSize: 12,
    color: 'white',
  },
  modeContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
    marginTop: 10,
  },
  modeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modeCard: {
    width: (width - 50) / 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  modeCardActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  modeName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 5,
  },
  modeDuration: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  timerInnerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timerGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  timerLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  controlButtonPrimary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
}); 