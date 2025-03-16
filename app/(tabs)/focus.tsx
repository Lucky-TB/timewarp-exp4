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
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
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
  SlideInRight,
  ZoomIn,
  BounceIn,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Sample focus modes
const FOCUS_MODES = [
  { id: 'deep', name: 'Deep Focus', duration: 25, color: 'primary' },
  { id: 'flow', name: 'Flow State', duration: 50, color: 'secondary' },
  { id: 'light', name: 'Light Focus', duration: 15, color: 'accent' },
  { id: 'custom', name: 'Custom', duration: 30, color: 'info' },
];

// Funny messages that appear as distractions increase
const DISTRACTION_MESSAGES = [
  "Ready to focus",
  "Still focused?",
  "Getting distracted...",
  "Focus fading...",
  "Brain going elsewhere...",
  "Hello? Earth to you!",
  "What was the task again?",
  "I forgot what we're doing",
  "Time is an illusion anyway",
  "Pretty colors though, right?",
  "SQUIRREL!",
  "Did you feed your Tamagotchi?",
  "All work and no play...",
  "I'm melting, meeeelting!",
  "Time has lost all meaning",
  "Have you checked Twitter?",
];

// Silly distortion names for UI display
const DISTORTION_LEVEL_NAMES = [
  "Normal",
  "Slightly Weird",
  "Fidgety",
  "Questionable",
  "Confused",
  "Very Confused",
  "Reality Bending",
  "Brain Fog",
  "Time Warp",
  "Complete Chaos",
  "MAXIMUM OVERDRIVE"
];

// Funny fonts/transformations for the timer
const DISTORTION_STYLES = [
  {},
  { transform: [{ rotate: '1deg' }] },
  { transform: [{ rotate: '-2deg' }] },
  { transform: [{ skewX: '3deg' }] },
  { transform: [{ skewY: '2deg' }] },
  { transform: [{ rotate: '3deg' }, { skewX: '-2deg' }] },
  { transform: [{ rotate: '-4deg' }, { skewY: '3deg' }] },
  { transform: [{ scale: 1.05 }, { skewX: '5deg' }] },
  { transform: [{ scale: 0.95 }, { rotate: '-5deg' }] },
  { transform: [{ rotate: '7deg' }, { scale: 1.1 }] },
];

// Symbols to replace numbers when distortion is high
const DISTORTION_SYMBOLS = [
  '@', '#', '$', '%', '^', '&', '*', '!', '?', '+', '=', '×', '÷', '§', '¶', '~', '≈', '∞', '¢', '∑', '∏', '√', 
  '∆', 'Ω', '∩', '∫', '≠', '≡', '≤', '≥', '⊂', '⊃', '⊕', '⊗', '∅', '∈', '∀', '∃'
];

// Refined professional color palette
const PROFESSIONAL_COLORS = {
  primary: { dark: '#4361EE', light: '#3A56D4' },
  secondary: { dark: '#6C63FF', light: '#4895EF' },
  accent: { dark: '#2EC4B6', light: '#36ACA0' },
  warning: { dark: '#FF9F1C', light: '#FFBF69' },
  danger: { dark: '#E63946', light: '#F6566A' },
  info: { dark: '#4CC9F0', light: '#4895EF' },
  text: { dark: '#FFFFFF', light: '#121212' },
  subtext: { dark: 'rgba(255,255,255,0.7)', light: 'rgba(0,0,0,0.7)' },
  background: { dark: '#121212', light: '#F8F9FA' },
  card: { dark: '#1E1E1E', light: '#FFFFFF' },
  dark: '#121212',
  light: '#FFFFFF',
  gray: {
    100: '#F8F9FA',
    200: '#E9ECEF',
    300: '#DEE2E6',
    400: '#CED4DA',
    500: '#ADB5BD',
    600: '#6C757D',
    700: '#495057',
    800: '#343A40',
    900: '#212529',
  }
};

export default function FocusScreen() {
  const [selectedMode, setSelectedMode] = useState(FOCUS_MODES[0]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(FOCUS_MODES[0].duration * 60);
  const [distractions, setDistractions] = useState(0);
  const [isDndEnabled, setIsDndEnabled] = useState(false);
  const [customTimeModalVisible, setCustomTimeModalVisible] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('30');
  
  // New state for manual distortion control
  const [distortionLevel, setDistortionLevel] = useState(0);
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const theme = useColorScheme();
  const colors = isDark ? Colors.dark : Colors.light;
  
  // Animation values
  const focusRingScale = useSharedValue(1);
  const pageOpacity = useSharedValue(1);
  const timerRotation = useSharedValue(0);
  const timerScale = useSharedValue(1);
  const timerSkewX = useSharedValue(0);
  const timerSkewY = useSharedValue(0);
  const timerWobble = useSharedValue(0);
  
  // Enhanced animation values for extreme distortion effects
  const timerScreenX = useSharedValue(0);
  const timerScreenY = useSharedValue(0);
  const timerScreenScale = useSharedValue(1);
  const timerScreenRotation = useSharedValue(0);
  const timerScreenOpacity = useSharedValue(1);
  
  // Silly phrases to display when timer is extremely distorted
  const SILLY_TIMER_PHRASES = [
    "Time is just a concept!",
    "Where'd it go?!",
    "Catch me if you can!",
    "Too slow!",
    "Time waits for no one!",
    "Wheeeeeee!",
    "I'm free!",
    "Can't touch this!",
    "Look at me go!",
    "Outta here!",
    "Zoom zoom!",
    "Timer goes brrr!",
  ];
  
  // Fun emoji to display at high distortion
  const FUNNY_EMOJIS = ["🤪", "🤯", "🙃", "😵‍💫", "🫠", "🫨", "🌀", "💨", "✨", "💥", "⏱️", "⌛"];
  
  // Timer ref for cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const distortionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const screenJumpIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sillyTextRef = useRef("");
  const sillyEmojiRef = useRef("");
  
  // Enhanced color configurations
  const professionalColors = PROFESSIONAL_COLORS;
  
  // Helper function to get theme-aware colors
  const getColor = (colorName: string) => {
    return PROFESSIONAL_COLORS[colorName as keyof typeof PROFESSIONAL_COLORS][isDark ? 'dark' : 'light'];
  };
  
  const getTextColor = () => {
    return PROFESSIONAL_COLORS.text[isDark ? 'dark' : 'light'];
  };
  
  const getSubtextColor = () => {
    return PROFESSIONAL_COLORS.subtext[isDark ? 'dark' : 'light'];
  };
  
  const getBackgroundColor = () => {
    return PROFESSIONAL_COLORS.background[isDark ? 'dark' : 'light'];
  };
  
  const getCardColor = () => {
    return PROFESSIONAL_COLORS.card[isDark ? 'dark' : 'light'];
  };
  
  useEffect(() => {
    // Calculate effective distortion (combination of manual distortion and distractions)
    const effectiveDistortion = distortionLevel + Math.floor(distractions / 2);
    const maxDistortion = Math.min(effectiveDistortion, 10);
    
    // Cancel any existing animations
    cancelAnimation(timerRotation);
    cancelAnimation(timerScale);
    cancelAnimation(timerSkewX);
    cancelAnimation(timerSkewY);
    cancelAnimation(timerWobble);
    cancelAnimation(timerScreenX);
    cancelAnimation(timerScreenY);
    cancelAnimation(timerScreenScale);
    cancelAnimation(timerScreenRotation);
    cancelAnimation(timerScreenOpacity);
    
    if (effectiveDistortion === 0) {
      // Reset to normal
      timerRotation.value = withTiming(0);
      timerScale.value = withTiming(1);
      timerSkewX.value = withTiming(0);
      timerSkewY.value = withTiming(0);
      timerWobble.value = withTiming(0);
      timerScreenX.value = withTiming(0);
      timerScreenY.value = withTiming(0);
      timerScreenScale.value = withTiming(1);
      timerScreenRotation.value = withTiming(0);
      timerScreenOpacity.value = withTiming(1);
      
      if (distortionIntervalRef.current) {
        clearInterval(distortionIntervalRef.current);
        distortionIntervalRef.current = null;
      }
      
      if (screenJumpIntervalRef.current) {
        clearInterval(screenJumpIntervalRef.current);
        screenJumpIntervalRef.current = null;
      }
      
      sillyTextRef.current = "";
      sillyEmojiRef.current = "";
      return;
    }
    
    // Apply distortion effects based on level
    if (maxDistortion >= 1) {
      timerRotation.value = withRepeat(
        withSequence(
          withTiming(-maxDistortion * 2, { duration: 800 - maxDistortion * 70 }),
          withTiming(maxDistortion * 2, { duration: 800 - maxDistortion * 70 })
        ),
        -1,
        true
      );
    }
    
    if (maxDistortion >= 2) {
      timerScale.value = withRepeat(
        withSequence(
          withTiming(1 - maxDistortion * 0.05, { duration: 900 - maxDistortion * 80 }),
          withTiming(1 + maxDistortion * 0.05, { duration: 900 - maxDistortion * 80 })
        ),
        -1,
        true
      );
    }
    
    if (maxDistortion >= 3) {
      timerSkewX.value = withRepeat(
        withSequence(
          withTiming(-maxDistortion * 0.8, { duration: 700 - maxDistortion * 60 }),
          withTiming(maxDistortion * 0.8, { duration: 700 - maxDistortion * 60 })
        ),
        -1,
        true
      );
    }
    
    if (maxDistortion >= 4) {
      timerSkewY.value = withRepeat(
        withSequence(
          withTiming(-maxDistortion * 0.7, { duration: 600 - maxDistortion * 60 }),
          withTiming(maxDistortion * 0.7, { duration: 600 - maxDistortion * 60 })
        ),
        -1,
        true
      );
    }
    
    if (maxDistortion >= 5) {
      // Add more extreme random wobbles at higher levels - position jumping
      if (!distortionIntervalRef.current) {
        const wobbleInterval = Math.max(100, 1500 - maxDistortion * 150);
        distortionIntervalRef.current = setInterval(() => {
          timerWobble.value = withSequence(
            withTiming(Math.random() * maxDistortion * 5 - maxDistortion * 2.5, { duration: wobbleInterval / 2 }),
            withTiming(Math.random() * maxDistortion * 5 - maxDistortion * 2.5, { duration: wobbleInterval / 2 })
          );
        }, wobbleInterval);
      }
    }
    
    // Super wild distortion - make timer bounce all over the screen
    if (maxDistortion >= 6) {
      // Start screen jumping effects with increasing chaos
      if (!screenJumpIntervalRef.current) {
        // Faster jumps at higher distortion
        const jumpInterval = Math.max(150, 1500 - maxDistortion * 130);
        
        // Get screen dimensions for calculating jumps
        const { width, height } = Dimensions.get('window');
        
        // Percentage of screen to use (nearly the entire screen at max distortion)
        const screenPercentage = 0.5 + (maxDistortion - 6) * 0.15; 
        
        // Random silly text at interval
        setInterval(() => {
          if (maxDistortion >= 8 && Math.random() > 0.7) {
            sillyTextRef.current = SILLY_TIMER_PHRASES[Math.floor(Math.random() * SILLY_TIMER_PHRASES.length)];
            
            // Clear after a moment
            setTimeout(() => {
              sillyTextRef.current = "";
            }, jumpInterval * 3);
          }
          
          if (maxDistortion >= 7 && Math.random() > 0.6) {
            sillyEmojiRef.current = FUNNY_EMOJIS[Math.floor(Math.random() * FUNNY_EMOJIS.length)];
            
            // Clear after a moment
            setTimeout(() => {
              sillyEmojiRef.current = "";
            }, jumpInterval * 2);
          }
        }, jumpInterval * 2);
        
        screenJumpIntervalRef.current = setInterval(() => {
          // Random position on screen - more wild at higher distortion
          const randomX = (Math.random() * width * screenPercentage - width * screenPercentage/2);
          const randomY = (Math.random() * height * screenPercentage - height * screenPercentage/2);
          
          // More extreme scale changes as distortion increases
          const randomScale = 0.6 + Math.random() * 0.8;
          
          // Random rotation for extra craziness
          const randomRotation = maxDistortion >= 8 ? Math.random() * 360 : Math.random() * 90 - 45;
          
          // Random opacity flashes at high distortion
          const randomOpacity = maxDistortion >= 9 ? 0.4 + Math.random() * 0.6 : 1;
          
          // Apply extreme movement with faster timing as distortion increases
          const duration = Math.max(100, 400 - maxDistortion * 30);
          
          // Add easing functions for funnier movement
          const easing = maxDistortion >= 8 ? 
            (Math.random() > 0.5 ? Easing.bounce : Easing.elastic(1)) : 
            Easing.bezier(0.17, 0.67, 0.83, 0.67);
          
          // Super-fast movement at highest distortion
          timerScreenX.value = withTiming(randomX, { duration, easing });
          timerScreenY.value = withTiming(randomY, { duration, easing });
          timerScreenScale.value = withTiming(randomScale, { duration: duration * 1.2 });
          timerScreenRotation.value = withTiming(randomRotation, { duration: duration * 1.5 });
          timerScreenOpacity.value = withTiming(randomOpacity, { duration: duration * 0.8 });
          
          // Add haptic feedback for extreme jumps if distortion is very high
          if (maxDistortion >= 8 && Math.random() > 0.4) {
            Haptics.impactAsync(
              Math.random() > 0.7 ? 
                Haptics.ImpactFeedbackStyle.Heavy : 
                Haptics.ImpactFeedbackStyle.Medium
            );
          }
        }, jumpInterval);
      }
    } else {
      // Reset screen position if distortion is not extreme
      timerScreenX.value = withTiming(0);
      timerScreenY.value = withTiming(0);
      timerScreenScale.value = withTiming(1);
      timerScreenRotation.value = withTiming(0);
      timerScreenOpacity.value = withTiming(1);
      
      if (screenJumpIntervalRef.current) {
        clearInterval(screenJumpIntervalRef.current);
        screenJumpIntervalRef.current = null;
      }
      
      sillyTextRef.current = "";
      sillyEmojiRef.current = "";
    }
  }, [distractions, distortionLevel]);
  
  // Create animated styles for timer distortion
  const timerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: timerWobble.value },
        { rotate: `${timerRotation.value}deg` },
        { scale: timerScale.value },
        { skewX: `${timerSkewX.value}deg` },
        { skewY: `${timerSkewY.value}deg` },
      ],
    };
  });
  
  // Enhanced animated style for extreme screen jumping
  const screenJumpAnimatedStyle = useAnimatedStyle(() => {
    return {
      position: timerScreenX.value !== 0 || timerScreenY.value !== 0 ? 'absolute' : 'relative',
      zIndex: 1000,
      opacity: timerScreenOpacity.value,
      transform: [
        { translateX: timerScreenX.value },
        { translateY: timerScreenY.value },
        { scale: timerScreenScale.value },
        { rotate: `${timerScreenRotation.value}deg` }
      ],
    };
  });
  
  // Function to increase distortion level
  const increaseDistortion = () => {
    // Add haptic feedback - gets stronger as level increases
    if (distortionLevel < 3) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (distortionLevel < 6) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    setDistortionLevel(prevLevel => Math.min(prevLevel + 1, 10));
  };
  
  // Function to decrease distortion level
  const decreaseDistortion = () => {
    // Gentle haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setDistortionLevel(prevLevel => Math.max(prevLevel - 1, 0));
  };

  // Get the effective distortion level (combined manual + distractions)
  const getEffectiveDistortion = () => {
    return Math.min(distortionLevel + Math.floor(distractions / 2), 10);
  };
  
  // Format time to MM:SS with optional distortion
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    const effectiveDistortion = getEffectiveDistortion();
    
    // As distortion increases, gradually replace digits with symbols
    if (effectiveDistortion >= 9) {
      // Extreme distortion - pure gibberish - just random symbols
      const symbolCount = 5 + Math.floor(Math.random() * 3); // 5-7 random symbols
      let result = '';
      for (let i = 0; i < symbolCount; i++) {
        const symbolIndex = Math.floor(Math.random() * DISTORTION_SYMBOLS.length);
        result += DISTORTION_SYMBOLS[symbolIndex];
      }
      return result;
    } else if (effectiveDistortion >= 8) {
      // High distortion - mix of symbols and some numbers
      const minStr = mins.toString().padStart(2, '0');
      const secStr = secs.toString().padStart(2, '0');
      
      // Replace most digits with symbols
      let distortedTime = '';
      for (let i = 0; i < 5; i++) {
        if (i === 2) {
          // This is the colon position
          distortedTime += Math.random() > 0.5 ? ':' : DISTORTION_SYMBOLS[Math.floor(Math.random() * DISTORTION_SYMBOLS.length)];
        } else {
          // This is a digit position
          if (Math.random() > 0.2) { // 80% chance to replace with symbol
            distortedTime += DISTORTION_SYMBOLS[Math.floor(Math.random() * DISTORTION_SYMBOLS.length)];
          } else {
            // Keep original digit
            const digit = i < 2 ? minStr[i] : secStr[i-3];
            distortedTime += digit;
          }
        }
      }
      return distortedTime;
    } else if (effectiveDistortion >= 7) {
      // Significant distortion - some symbols mixed in
      const minStr = mins.toString().padStart(2, '0');
      const secStr = secs.toString().padStart(2, '0');
      
      let distortedTime = '';
      for (let i = 0; i < 5; i++) {
        if (i === 2) {
          // Keep colon most of the time
          distortedTime += Math.random() > 0.3 ? ':' : DISTORTION_SYMBOLS[Math.floor(Math.random() * DISTORTION_SYMBOLS.length)];
        } else {
          // This is a digit position
          if (Math.random() > 0.6) { // 40% chance to replace with symbol
            distortedTime += DISTORTION_SYMBOLS[Math.floor(Math.random() * DISTORTION_SYMBOLS.length)];
          } else {
            // Keep original digit
            const digit = i < 2 ? minStr[i] : secStr[i-3];
            distortedTime += digit;
          }
        }
      }
      return distortedTime;
    } else if (effectiveDistortion >= 6) {
      // Moderately distorted - slightly off times and some symbol replacement
      const randomOffset = Math.floor(Math.random() * 12) - 6;
      const distortedSecs = Math.max(0, Math.min(59, secs + randomOffset));
      const minStr = mins.toString().padStart(2, '0');
      const secStr = distortedSecs.toString().padStart(2, '0');
      
      // Occasionally replace a digit with a symbol
      if (Math.random() > 0.6) {
        const pos = Math.floor(Math.random() * 4); // 0-3 (positions 0,1 for mins, 2,3 for secs)
        const symbol = DISTORTION_SYMBOLS[Math.floor(Math.random() * DISTORTION_SYMBOLS.length)];
        
        if (pos < 2) {
          // Replace a minute digit
          const newMin = minStr.substring(0, pos) + symbol + minStr.substring(pos + 1);
          return `${newMin}:${secStr}`;
        } else {
          // Replace a second digit
          const secPos = pos - 2;
          const newSec = secStr.substring(0, secPos) + symbol + secStr.substring(secPos + 1);
          return `${minStr}:${newSec}`;
        }
      }
      
      return `${minStr}:${secStr}`;
    } else if (effectiveDistortion >= 4) {
      // Slightly distorted - occasional wrong digit
      if (Math.random() > 0.6) {
        const minStr = mins.toString().padStart(2, '0');
        const secStr = secs.toString().padStart(2, '0');
        
        if (Math.random() > 0.2) { // 80% chance for random digit, 20% chance for symbol
          const randomDigit = Math.floor(Math.random() * 10);
          
          // Randomly change one digit
          if (Math.random() > 0.5) {
            // Change a minute digit
            const pos = Math.random() > 0.5 ? 0 : 1;
            const newMin = minStr.substring(0, pos) + randomDigit + minStr.substring(pos + 1);
            return `${newMin}:${secStr}`;
          } else {
            // Change a second digit
            const pos = Math.random() > 0.5 ? 0 : 1;
            const newSec = secStr.substring(0, pos) + randomDigit + secStr.substring(pos + 1);
            return `${minStr}:${newSec}`;
          }
        } else {
          // Replace with a symbol instead of a digit
          const symbol = DISTORTION_SYMBOLS[Math.floor(Math.random() * DISTORTION_SYMBOLS.length)];
          
          if (Math.random() > 0.5) {
            // Change a minute digit
            const pos = Math.random() > 0.5 ? 0 : 1;
            const newMin = minStr.substring(0, pos) + symbol + minStr.substring(pos + 1);
            return `${newMin}:${secStr}`;
          } else {
            // Change a second digit
            const pos = Math.random() > 0.5 ? 0 : 1;
            const newSec = secStr.substring(0, pos) + symbol + secStr.substring(pos + 1);
            return `${minStr}:${newSec}`;
          }
        }
      }
    }
    
    // Normal time display
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get a message based on distortion level
  const getTimerMessage = () => {
    if (!isTimerRunning && !isPaused) return "Ready to focus";
    if (isPaused) return "Paused";
    
    const effectiveDistortion = getEffectiveDistortion();
    const messageIndex = Math.min(effectiveDistortion, DISTRACTION_MESSAGES.length - 1);
    return DISTRACTION_MESSAGES[messageIndex];
  };
  
  // Complete timer function
  const completeTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsTimerRunning(false);
    setIsPaused(false);
    
    // Haptic success feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Start or pause timer
  const toggleTimer = () => {
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (isTimerRunning) {
      // Pause the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsPaused(true);
      setIsTimerRunning(false);
    } else {
      // Start or resume the timer
      setIsTimerRunning(true);
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer complete
            completeTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };
  
  // Reset the timer
  const resetTimer = () => {
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsTimerRunning(false);
    setIsPaused(false);
    setTimeRemaining(selectedMode.duration * 60);
    
    // Reset distractions if the user wants to start fresh
    if (distractions > 0) {
      Alert.alert(
        "Reset Distractions?",
        "Do you want to reset your distraction count as well?",
        [
          {
            text: "No, keep count",
            style: "cancel"
          },
          {
            text: "Yes, reset all",
            onPress: () => setDistractions(0)
          }
        ]
      );
    }
    
    // Also ask about resetting distortion if it's active
    if (distortionLevel > 0) {
      Alert.alert(
        "Reset Distortion?",
        "Do you want to reset your distortion level as well?",
        [
          {
            text: "No, keep distortion",
            style: "cancel"
          },
          {
            text: "Yes, reset all",
            onPress: () => setDistortionLevel(0)
          }
        ]
      );
    }
  };
  
  // Track distraction
  const trackDistraction = () => {
    // Add haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    // Increment distractions with a fun animation effect
    setDistractions(prev => {
      const newCount = prev + 1;
      
      // Stronger haptic feedback as distractions increase
      if (newCount % 3 === 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      
      return newCount;
    });
  };

  // Get mode color - simplified and with better error handling
  const getModeColor = (modeColor: string) => {
    try {
      if (!modeColor || !colors || !colors.gradient || !colors.gradient[modeColor]) {
        return ['#7047EB', '#38BDF8']; // Fallback to hardcoded values
      }
      return colors.gradient[modeColor];
    } catch (error) {
      console.log('Error getting color:', error);
      return ['#7047EB', '#38BDF8']; // Safe fallback
    }
  };
  
  // Handle selecting a focus mode
  const selectMode = (mode: typeof FOCUS_MODES[0]) => {
    if (mode && mode.id && mode.id !== selectedMode?.id) {
      setSelectedMode(mode);
      setTimeRemaining(mode.duration * 60);
      
      // Show custom time modal if custom mode is selected
      if (mode.id === 'custom') {
        setCustomTimeModalVisible(true);
      }
      
      // Haptic feedback
      Haptics.selectionAsync();
    }
  };
  
  // Handle custom time confirmation
  const handleCustomTimeConfirm = () => {
    const minutes = parseInt(customMinutes, 10);
    
    if (isNaN(minutes) || minutes <= 0 || minutes > 180) {
      // Show error for invalid input
      Alert.alert('Invalid Time', 'Please enter a valid time between 1 and 180 minutes.');
      return;
    }
    
    // Update the custom mode duration
    const updatedModes = [...FOCUS_MODES];
    const customModeIndex = updatedModes.findIndex(mode => mode.id === 'custom');
    if (customModeIndex !== -1) {
      updatedModes[customModeIndex] = {
        ...updatedModes[customModeIndex],
        duration: minutes
      };
    }
    
    // Update time remaining
    setTimeRemaining(minutes * 60);
    
    // Close modal
    setCustomTimeModalVisible(false);
  };
  
  // Get appropriate color for distortion level
  const getTimerColor = () => {
    const effectiveDistortion = getEffectiveDistortion();
    
    if (effectiveDistortion >= 8) {
      // High distortion level - use more chaotic colors
      return ['#FF5733', '#C70039'];
    } else if (effectiveDistortion >= 5) {
      // Medium distortion level - use warning colors
      return ['#FFC300', '#FF5733'];
    }
    // Normal color for the selected mode
    return getModeColor(selectedMode?.color);
  };
  
  // Clean up all intervals when the component unmounts
  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (distortionIntervalRef.current) {
        clearInterval(distortionIntervalRef.current);
      }
      if (screenJumpIntervalRef.current) {
        clearInterval(screenJumpIntervalRef.current);
      }
    };
  }, []);
  
  const [modeSelectVisible, setModeSelectVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <LinearGradient
        colors={['#121212', '#1A1A1A', '#202020']}
        style={styles.background}
      />
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Focus</Text>
          <TouchableOpacity
            style={styles.modeSelectButton}
            onPress={() => setModeSelectVisible(true)}
          >
            <Text style={{ color: 'white', marginRight: 8 }}>{selectedMode.name}</Text>
            <Ionicons name="chevron-down" size={18} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Timer Circle */}
            <Animated.View style={[
              styles.timerCircle,
              timerAnimatedStyle,
              screenJumpAnimatedStyle
            ]}>
              <View style={styles.timerInnerCircle}>
                <Animated.Text style={[
                  styles.timerText,
                  { color: 'white' }
                ]}>
                  {formatTime(timeRemaining)}
                </Animated.Text>
              </View>
            </Animated.View>

            <Text style={styles.timerMode}>
              {getTimerMessage()}
            </Text>

            {/* Controls */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity 
                style={[styles.controlButton, isTimerRunning ? styles.controlButtonPrimary : null]}
                onPress={toggleTimer}
              >
                <Ionicons 
                  name={isTimerRunning ? "pause" : "play"} 
                  size={30} 
                  color="white" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={resetTimer}
              >
                <Ionicons name="refresh" size={28} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, styles.distractionButton]}
                onPress={trackDistraction}
              >
                <Ionicons name="alert-circle-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            {/* ENHANCED DISTORTION CONTROLS */}
            <View style={{
              width: '90%',
              marginTop: 30,
              padding: 20,
              backgroundColor: 'rgba(30, 30, 60, 0.8)',
              borderRadius: 16,
              borderWidth: 2,
              borderColor: '#3949AB',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 10
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                marginBottom: 15,
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2
              }}>
                Distortion Level: {DISTORTION_LEVEL_NAMES[distortionLevel]}
              </Text>
              
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
              }}>
                <TouchableOpacity 
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: distortionLevel === 0 ? 'rgba(57, 73, 171, 0.4)' : '#3949AB',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                    elevation: 6
                  }}
                  onPress={decreaseDistortion}
                  disabled={distortionLevel === 0}
                >
                  <MaterialCommunityIcons name="waveform" size={24} color="white" />
                  <Ionicons name="remove" size={20} color="white" style={{ marginLeft: -8 }} />
                </TouchableOpacity>
                
                <View style={{
                  flexDirection: 'row',
                  width: '60%',
                  height: 20,
                  backgroundColor: 'rgba(20, 20, 40, 0.8)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  marginHorizontal: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)'
                }}>
                  {[...Array(10)].map((_, index) => (
                    <View 
                      key={index}
                      style={{
                        flex: 1,
                        height: '100%',
                        borderRightWidth: index < 9 ? 1 : 0,
                        borderColor: 'rgba(0,0,0,0.2)',
                        backgroundColor: index < distortionLevel 
                          ? index < 3 
                            ? '#00E676' 
                            : index < 6 
                              ? '#FFEA00' 
                              : '#FF1744'
                          : 'transparent'
                      }}
                    />
                  ))}
                </View>
                
                <TouchableOpacity 
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: distortionLevel === 10 ? 'rgba(0, 176, 255, 0.4)' : '#00B0FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                    elevation: 6
                  }}
                  onPress={increaseDistortion}
                  disabled={distortionLevel === 10}
                >
                  <MaterialCommunityIcons name="waveform" size={24} color="white" />
                  <Ionicons name="add" size={20} color="white" style={{ marginLeft: -8 }} />
                </TouchableOpacity>
              </View>
              
              {distortionLevel >= 10 && (
                <Animated.Text 
                  style={{
                    marginTop: 15,
                    color: '#FF1744',
                    fontWeight: 'bold',
                    fontSize: 16,
                    textAlign: 'center',
                    textShadowColor: 'rgba(0,0,0,0.5)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 2
                  }}
                  entering={ZoomIn}
                >
                  MAXIMUM CHAOS ACTIVATED!
                </Animated.Text>
              )}
            </View>
          </View>
        </ScrollView>
        
        {/* Mode Selection Modal */}
        <Modal
          visible={modeSelectVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModeSelectVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Focus Mode</Text>
              
              <ScrollView style={{ maxHeight: height * 0.5 }}>
                {FOCUS_MODES.map((mode) => (
                  <TouchableOpacity
                    key={mode.id}
                    style={{
                      padding: 15,
                      borderRadius: 10,
                      marginBottom: 10,
                      backgroundColor: mode.id === selectedMode.id 
                        ? 'rgba(67, 97, 238, 0.3)' 
                        : 'rgba(255, 255, 255, 0.1)',
                      borderWidth: mode.id === selectedMode.id ? 1 : 0,
                      borderColor: '#4361EE'
                    }}
                    onPress={() => {
                      selectMode(mode);
                      setModeSelectVisible(false);
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                      {mode.name}
                    </Text>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, marginTop: 5 }}>
                      {mode.duration} minutes
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <TouchableOpacity
                style={{
                  alignSelf: 'center',
                  marginTop: 15,
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  width: '100%',
                  alignItems: 'center'
                }}
                onPress={() => setModeSelectVisible(false)}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        {/* Custom Time Modal */}
        <Modal
          visible={customTimeModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setCustomTimeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Custom Time</Text>
              
              <TextInput
                style={styles.timeInput}
                placeholder="Enter minutes (1-180)"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={customMinutes}
                onChangeText={setCustomMinutes}
                maxLength={3}
                keyboardType="number-pad"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setCustomTimeModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleCustomTimeConfirm}
                >
                  <Text style={styles.modalButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Rich dark background for premium look
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.5, // Tighter letter spacing for modern look
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  timerCircle: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width * 0.375,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,30,30,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  timerInnerCircle: {
    width: '90%',
    height: '90%',
    borderRadius: width * 0.35,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,20,20,0.5)',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  timerMode: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 10,
    fontWeight: '600',
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
    letterSpacing: -0.3, // Tighter letter spacing for modern typography
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
    borderRadius: 16, // More rounded corners for modern look
    marginBottom: 10,
    shadowColor: "#000", // Add subtle shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  modeName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 5,
  },
  modeDuration: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)', // Brighter for better contrast
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  timerGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100, // Ensure gradient has rounded edges
  },
  timerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15, // Add some padding around content
  },
  timerLabel: {
    fontSize: 15, // Slightly larger for better readability
    color: 'rgba(255,255,255,0.9)', // Brighter for better contrast
    fontWeight: '500', // Medium weight for better legibility
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10, // Add some space below controls
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,30,30,0.7)',
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  secondaryControlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    width: '100%',
  },
  secondaryControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40,40,40,0.7)',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  controlButtonPrimary: {
    backgroundColor: 'rgba(50,205,50,0.4)',
  },
  distractionButton: {
    backgroundColor: 'rgba(255,99,71,0.4)',
  },
  distortionControlsContainer: {
    width: '100%',
    marginTop: 25,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(30,30,50,0.7)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#3949AB',
  },
  distortionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  distortionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'space-between',
    width: '100%',
  },
  distortionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  distortionMinus: {
    backgroundColor: '#3949AB',
  },
  distortionPlus: {
    backgroundColor: '#00B0FF',
  },
  distortionButtonDisabled: {
    opacity: 0.5,
  },
  distortionButtonIcon: {
    marginLeft: -8,
    marginTop: -2,
  },
  distortionLevelBar: {
    flexDirection: 'row',
    width: '65%',
    height: 14,
    backgroundColor: 'rgba(20,20,30,0.8)',
    borderRadius: 7,
    marginHorizontal: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  distortionLevelSegment: {
    flex: 1,
    height: '100%',
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  maxDistortionText: {
    marginTop: 10,
    color: '#FF1744',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
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
  distractionLevelContainer: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  distractionLevelTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
  },
  distractionLevelBar: {
    flexDirection: 'row',
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distractionLevelSegment: {
    flex: 1,
    height: '100%',
    marginHorizontal: 1,
    backgroundColor: 'transparent',
  },
  maxDistractionText: {
    marginTop: 10,
    color: '#FF5252',
    fontWeight: 'bold',
    fontSize: 14,
  },
  combinedDistortionContainer: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  combinedDistortionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.8)',
  },
  combinedDistortionValue: {
    marginTop: 10,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(5px)', // Add blur effect for depth (iOS only)
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  timeInput: {
    backgroundColor: 'rgba(60,60,60,0.6)',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'white',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.15)', // Brighter for better visibility
  },
  confirmButton: {
    backgroundColor: '#4361EE', // Vibrant blue for accent
  },
  modalButtonText: {
    color: 'white',
    fontSize: 17, // Larger for better readability
    fontWeight: '600',
  },
  modeSelectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(40,40,40,0.8)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
}); 