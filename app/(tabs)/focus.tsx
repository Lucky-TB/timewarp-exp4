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
  const [customTimeModalVisible, setCustomTimeModalVisible] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('30');
  
  const theme = useColorScheme();
  const colors = Colors[theme ?? 'light'];
  
  // Animation values - simplified
  const focusRingScale = useSharedValue(1);
  const pageOpacity = useSharedValue(1);
  
  // Timer ref for cleanup
  const timerRef = useRef(null);
  
  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Format time to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
  };
  
  // Track distraction
  const trackDistraction = () => {
    // Add haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    setDistractions(prev => prev + 1);
  };

  // Get mode color - simplified and with better error handling
  const getModeColor = (modeColor) => {
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
  const selectMode = (mode) => {
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
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.background}>
        <LinearGradient
          colors={['rgba(76, 76, 102, 0.6)', 'rgba(51, 51, 77, 0.6)']}
          style={{ width: width, height: height, position: 'absolute' }}
        />
      </View>
      
      <View style={styles.content}>
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
                      backgroundColor: selectedMode?.id === mode.id 
                        ? colors[mode.color] || colors.primary
                        : colors.card,
                      borderColor: colors[mode.color] || colors.primary,
                      borderWidth: selectedMode?.id === mode.id ? 0 : 1,
                    }
                  ]}
                  onPress={() => selectMode(mode)}
                >
                  <Text 
                    style={[
                      styles.modeName, 
                      { 
                        color: selectedMode?.id === mode.id 
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
                        color: selectedMode?.id === mode.id 
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
          
          {/* Timer Display - Simplified */}
          <View style={styles.timerContainer}>
            <View style={styles.timerCircle}>
              <View style={styles.timerInnerCircle}>
                <LinearGradient
                  colors={getModeColor(selectedMode?.color)}
                  style={styles.timerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.timerContent}>
                    <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                    <Text style={styles.timerLabel}>
                      {isTimerRunning ? "Focusing" : isPaused ? "Paused" : "Ready to focus"}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            </View>
            
            {/* Timer Controls - Simplified */}
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
                ]}
                onPress={toggleTimer}
              >
                <Ionicons 
                  name={isTimerRunning ? "pause" : "play"} 
                  size={32} 
                  color="white" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={trackDistraction}
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
                  {Math.floor((selectedMode?.duration * 60 - timeRemaining) / 60) || 0}
                </Text>
                <Text style={styles.statLabel}>Minutes Focused</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      
      {/* Custom Time Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={customTimeModalVisible}
        onRequestClose={() => setCustomTimeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Custom Time</Text>
            <TextInput
              style={styles.timeInput}
              keyboardType="number-pad"
              placeholder="Minutes (1-180)"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={customMinutes}
              onChangeText={setCustomMinutes}
              maxLength={3}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  background: {
    position: 'absolute',
    width: width,
    height: height,
    zIndex: 0,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
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
    backgroundColor: 'rgba(50,205,50,0.3)',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.8,
    backgroundColor: '#1F1F2C',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  timeInput: {
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  confirmButton: {
    backgroundColor: '#7047EB',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 