import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import Colors from '../../constants/Colors';
import { useColorScheme } from 'react-native';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

// Personality traits for tasks
const PERSONALITIES = [
  'eager',
  'anxious',
  'chill',
  'perfectionist',
  'procrastinator',
  'overachiever',
];

// Emoji reactions based on personality
const EMOJI_REACTIONS = {
  eager: ['🤩', '⚡️', '🚀', '💪'],
  anxious: ['😰', '⏰', '😬', '🙏'],
  chill: ['😎', '🌴', '✌️', '🧘‍♂️'],
  perfectionist: ['✨', '📏', '🔍', '✅'],
  procrastinator: ['🥱', '⏳', '🛌', '🤷‍♂️'],
  overachiever: ['🏆', '💯', '🔥', '📈'],
};

// Messages based on personality and completion status
const PERSONALITY_MESSAGES = {
  eager: {
    pending: ["Let's do this!", "Can't wait to start!", "Ready when you are!"],
    completed: ["Nailed it!", "That was fun!", "What's next?"],
  },
  anxious: {
    pending: ["Don't forget me!", "Time's running out!", "Still waiting..."],
    completed: ["Finally done!", "What a relief!", "One less worry!"],
  },
  chill: {
    pending: ["No rush", "Whenever you're ready", "Take your time"],
    completed: ["Cool, it's done", "Nice work", "Smooth sailing"],
  },
  perfectionist: {
    pending: ["Must be done right", "Every detail matters", "Excellence awaits"],
    completed: ["Flawlessly executed", "Perfect work", "Exactly right"],
  },
  procrastinator: {
    pending: ["Maybe later?", "Tomorrow's good too", "What's the rush?"],
    completed: ["About time!", "Finally got around to it", "That wasn't so bad"],
  },
  overachiever: {
    pending: ["Let's exceed expectations!", "Going above and beyond!", "110% effort!"],
    completed: ["Crushed it!", "Outstanding work!", "Excellence achieved!"],
  },
};

export type TodoProps = {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  deadline?: Date;
  completed: boolean;
  personality?: string;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onPress: (id: string) => void;
};

export default function Todo({
  id,
  title,
  description,
  category,
  priority,
  deadline,
  completed,
  personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
  onToggleComplete,
  onDelete,
  onPress,
}: TodoProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Animation values
  const offset = useSharedValue(0);
  const scale = useSharedValue(1);
  const cardHeight = useSharedValue(0);
  const checkmarkScale = useSharedValue(completed ? 1 : 0);
  const strikethrough = useSharedValue(completed ? 1 : 0);
  const bounceValue = useSharedValue(1);
  const isDeleting = useSharedValue(false);
  
  // Get random message based on personality and completion status
  const getMessage = () => {
    const status = completed ? 'completed' : 'pending';
    const messages = PERSONALITY_MESSAGES[personality][status];
    return messages[Math.floor(Math.random() * messages.length)];
  };
  
  // Get random emoji based on personality
  const getEmoji = () => {
    const emojis = EMOJI_REACTIONS[personality];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };
  
  // Priority color mapping
  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.info;
    }
  };
  
  // Format deadline
  const formatDeadline = () => {
    if (!deadline) return null;
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Overdue';
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays < 7) {
      return `Due in ${diffDays} days`;
    } else {
      return `Due on ${deadlineDate.toLocaleDateString()}`;
    }
  };
  
  // Handle completion toggle
  const handleToggleComplete = () => {
    Haptics.impactAsync(
      completed ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    
    // Animate checkmark and strikethrough
    checkmarkScale.value = withTiming(completed ? 0 : 1, { duration: 300 });
    strikethrough.value = withTiming(completed ? 0 : 1, { duration: 300 });
    
    // Bounce animation
    bounceValue.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1.05, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    onToggleComplete(id);
  };
  
  // Handle delete
  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    isDeleting.value = true;
    
    // Animate out before deleting
    scale.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }, () => {
      runOnJS(onDelete)(id);
    });
  };
  
  // Gesture handler for swipe actions
  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (isDeleting.value) return;
      offset.value = event.translationX;
    })
    .onEnd((event) => {
      if (isDeleting.value) return;
      
      if (event.translationX < -SWIPE_THRESHOLD) {
        // Swiped left - delete
        offset.value = withTiming(-width, { duration: 300 });
        runOnJS(handleDelete)();
      } else if (event.translationX > SWIPE_THRESHOLD) {
        // Swiped right - toggle complete
        offset.value = withTiming(0, { duration: 300 });
        runOnJS(handleToggleComplete)();
      } else {
        // Reset position
        offset.value = withTiming(0, { duration: 300 });
      }
    });
  
  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: offset.value },
        { scale: scale.value * bounceValue.value },
      ],
    };
  });
  
  const checkmarkAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: checkmarkScale.value }],
      opacity: checkmarkScale.value,
    };
  });
  
  const strikethroughAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${strikethrough.value * 100}%`,
    };
  });
  
  const leftActionAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      offset.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
      transform: [
        {
          scale: interpolate(
            offset.value,
            [0, SWIPE_THRESHOLD],
            [0.8, 1],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });
  
  const rightActionAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      offset.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
      transform: [
        {
          scale: interpolate(
            offset.value,
            [-SWIPE_THRESHOLD, 0],
            [1, 0.8],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });
  
  // Update animations when completed state changes
  useEffect(() => {
    checkmarkScale.value = withTiming(completed ? 1 : 0, { duration: 300 });
    strikethrough.value = withTiming(completed ? 1 : 0, { duration: 300 });
  }, [completed]);
  
  return (
    <View style={styles.container}>
      {/* Background action indicators */}
      <View style={styles.actionsContainer}>
        <Animated.View
          style={[
            styles.actionButton,
            styles.completeAction,
            { backgroundColor: colors.success },
            leftActionAnimatedStyle,
          ]}
        >
          <Ionicons name="checkmark" size={24} color="white" />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.actionButton,
            styles.deleteAction,
            { backgroundColor: colors.error },
            rightActionAnimatedStyle,
          ]}
        >
          <Ionicons name="trash" size={24} color="white" />
        </Animated.View>
      </View>
      
      {/* Main card */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.card, { backgroundColor: colors.card }, animatedCardStyle]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onPress(id)}
            style={styles.cardContent}
          >
            {/* Checkbox */}
            <TouchableOpacity
              style={[
                styles.checkbox,
                {
                  borderColor: completed ? colors.success : colors.border,
                  backgroundColor: completed ? colors.success : 'transparent',
                },
              ]}
              onPress={handleToggleComplete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Animated.View style={checkmarkAnimatedStyle}>
                <Ionicons name="checkmark" size={16} color="white" />
              </Animated.View>
            </TouchableOpacity>
            
            {/* Content */}
            <View style={styles.textContainer}>
              {/* Title with strikethrough */}
              <View style={styles.titleContainer}>
                <Text
                  style={[
                    styles.title,
                    { color: completed ? colors.muted : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
                <Animated.View
                  style={[
                    styles.strikethrough,
                    { backgroundColor: colors.muted },
                    strikethroughAnimatedStyle,
                  ]}
                />
              </View>
              
              {/* Category and priority */}
              <View style={styles.metaContainer}>
                <View
                  style={[
                    styles.categoryPill,
                    { backgroundColor: colors.subtle },
                  ]}
                >
                  <Text style={[styles.categoryText, { color: colors.muted }]}>
                    {category}
                  </Text>
                </View>
                
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: getPriorityColor() },
                  ]}
                />
                
                {deadline && (
                  <Text style={[styles.deadline, { color: colors.muted }]}>
                    {formatDeadline()}
                  </Text>
                )}
              </View>
              
              {/* Personality message */}
              <View style={styles.personalityContainer}>
                <Text style={[styles.personalityEmoji]}>{getEmoji()}</Text>
                <Text style={[styles.personalityMessage, { color: colors.muted }]}>
                  {getMessage()}
                </Text>
              </View>
            </View>
            
            {/* Chevron */}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.muted}
              style={styles.chevron}
            />
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    height: 100,
  },
  actionsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeAction: {
    marginLeft: 5,
  },
  deleteAction: {
    marginRight: 5,
  },
  card: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    height: 100,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    height: '100%',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  strikethrough: {
    position: 'absolute',
    height: 2,
    top: '50%',
    left: 0,
    borderRadius: 1,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  deadline: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  personalityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personalityEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  personalityMessage: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    fontStyle: 'italic',
  },
  chevron: {
    marginLeft: 8,
  },
}); 