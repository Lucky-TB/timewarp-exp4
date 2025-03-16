import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
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
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PERSONALITIES, EMOJI_REACTIONS, PERSONALITY_MESSAGES } from '../components/Todo';

const { width, height } = Dimensions.get('window');

// Task categories
const CATEGORIES = [
  'Work',
  'Personal',
  'Health',
  'Learning',
  'Errands',
  'Creative',
  'Home',
  'Finance',
];

// Priority levels
const PRIORITIES = [
  { value: 'low', label: 'Low', icon: 'arrow-down' },
  { value: 'medium', label: 'Medium', icon: 'remove' },
  { value: 'high', label: 'High', icon: 'arrow-up' },
];

// Sample tasks for related tasks
const SAMPLE_TASKS = [
  {
    id: '1',
    title: 'Research productivity techniques',
    category: 'Learning',
    priority: 'medium',
    completed: false,
  },
  {
    id: '2',
    title: 'Create wireframes for TimeWarp Focus',
    category: 'Work',
    priority: 'high',
    completed: true,
  },
  {
    id: '3',
    title: 'User testing for time visualization',
    category: 'Work',
    priority: 'high',
    completed: false,
  },
  {
    id: '4',
    title: 'Design 3D productivity landscape',
    category: 'Creative',
    priority: 'medium',
    completed: false,
  },
];

// Sample task data - in a real app, this would come from state or API
const SAMPLE_TASK = {
  id: 'task-1',
  title: 'Implement Task Detail Screen',
  description: 'Create a beautiful and functional task detail screen with editing capabilities, personality traits, and related tasks.',
  category: 'Work',
  priority: 'high',
  deadline: new Date(Date.now() + 86400000 * 2), // 2 days from now
  completed: false,
  personality: 'eager',
  relatedTasks: ['2', '3', '4'],
  notes: 'Make sure to include animations for a smooth user experience!',
  createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
};

// Option selector component
const OptionSelector = ({ 
  title, 
  options, 
  selectedValue, 
  onSelect, 
  colors, 
  renderOption = null 
}) => {
  return (
    <View style={styles.optionSelectorContainer}>
      <Text style={[styles.optionSelectorTitle, { color: colors.muted }]}>
        {title}
      </Text>
      <View style={styles.optionsRow}>
        {options.map((option) => {
          const isSelected = typeof option === 'string' 
            ? option === selectedValue 
            : option.value === selectedValue;
          
          return (
            <TouchableOpacity
              key={typeof option === 'string' ? option : option.value}
              style={[
                styles.optionButton,
                { 
                  backgroundColor: isSelected ? colors.primary : colors.subtle,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(typeof option === 'string' ? option : option.value);
              }}
              activeOpacity={0.7}
            >
              {renderOption ? (
                renderOption(option, isSelected)
              ) : (
                <Text
                  style={[
                    styles.optionText,
                    { 
                      color: isSelected ? 'white' : colors.text,
                      fontFamily: isSelected ? 'Poppins-Medium' : 'Poppins-Regular',
                    },
                  ]}
                >
                  {typeof option === 'string' ? option : option.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Related task component
const RelatedTask = ({ task, colors, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.relatedTask, { backgroundColor: colors.subtle }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(task.id);
      }}
    >
      <View
        style={[
          styles.relatedTaskPriority,
          { 
            backgroundColor: task.priority === 'high' ? colors.error : 
              task.priority === 'medium' ? colors.warning : colors.success 
          }
        ]}
      />
      
      <View style={styles.relatedTaskContent}>
        <Text 
          style={[
            styles.relatedTaskTitle, 
            { 
              color: colors.text,
              textDecorationLine: task.completed ? 'line-through' : 'none',
              color: task.completed ? colors.muted : colors.text,
            }
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        
        <Text style={[styles.relatedTaskCategory, { color: colors.muted }]}>
          {task.category}
        </Text>
      </View>
      
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </TouchableOpacity>
  );
};

export default function TaskDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  // State
  const [task, setTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({});
  const [relatedTasks, setRelatedTasks] = useState([]);
  
  // Animation values
  const pageOpacity = useSharedValue(0);
  const pageScale = useSharedValue(0.95);
  const editButtonScale = useSharedValue(1);
  
  // Get random emoji based on personality
  const getEmoji = (personality) => {
    if (!personality || !EMOJI_REACTIONS[personality]) return '🚀';
    const emojis = EMOJI_REACTIONS[personality];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };
  
  // Get random message based on personality and completion status
  const getMessage = (personality, completed) => {
    if (!personality || !PERSONALITY_MESSAGES[personality]) return '';
    const status = completed ? 'completed' : 'pending';
    const messages = PERSONALITY_MESSAGES[personality][status];
    return messages[Math.floor(Math.random() * messages.length)];
  };
  
  // Format deadline
  const formatDeadline = (deadline) => {
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
      return new Date(deadline).toLocaleDateString();
    }
  };
  
  // Load task data
  useEffect(() => {
    // In a real app, you would fetch the task data from an API or local storage
    // For this demo, use the sample task
    setTask(SAMPLE_TASK);
    setEditedTask(SAMPLE_TASK);
    
    // Set related tasks
    const related = SAMPLE_TASKS.filter(t => 
      SAMPLE_TASK.relatedTasks.includes(t.id)
    );
    setRelatedTasks(related);
    
    // Animations
    pageOpacity.value = withTiming(1, { duration: 400 });
    pageScale.value = withSpring(1, { damping: 12 });
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [id]);
  
  // Animated styles
  const pageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value,
    transform: [{ scale: pageScale.value }],
  }));
  
  const editButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: editButtonScale.value }],
  }));
  
  // Handle close
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Exit animations
    pageOpacity.value = withTiming(0, { duration: 300 }, () => {
      router.back();
    });
  };
  
  // Handle save
  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTask(editedTask);
    setIsEditing(false);
    
    // In a real app, you would save the task to an API or local storage
    
    // Animation
    editButtonScale.value = withSequence(
      withTiming(1.1, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
  };
  
  // Handle toggle complete
  const handleToggleComplete = () => {
    const updatedTask = { ...task, completed: !task.completed };
    setTask(updatedTask);
    setEditedTask(updatedTask);
    
    Haptics.impactAsync(
      task.completed ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    
    // In a real app, you would save the task to an API or local storage
  };
  
  // Handle delete
  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    // Exit animations
    pageOpacity.value = withTiming(0, { duration: 300 }, () => {
      // In a real app, you would delete the task from an API or local storage
      router.back();
    });
  };
  
  // Handle related task press
  const handleRelatedTaskPress = (taskId) => {
    // In a real app, you would navigate to the related task
    router.push(`/tasks/${taskId}`);
  };
  
  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Task not found</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
    >
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
          
          {isEditing ? (
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.View style={[styles.headerRight, editButtonAnimatedStyle]}>
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: colors.primary }]}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="pencil" size={20} color="white" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Title */}
          {isEditing ? (
            <TextInput
              style={[styles.titleInput, { color: colors.text, borderColor: colors.border }]}
              value={editedTask.title}
              onChangeText={(text) => setEditedTask({ ...editedTask, title: text })}
              placeholder="Task title"
              placeholderTextColor={colors.muted}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          ) : (
            <View style={styles.titleContainer}>
              <Text style={[styles.taskTitle, { color: colors.text }]}>
                {task.title}
              </Text>
              
              {task.completed && (
                <View style={[styles.completedBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              )}
            </View>
          )}
          
          {/* Personality */}
          <View style={styles.personalityContainer}>
            <Text style={[styles.personalityEmoji]}>
              {getEmoji(task.personality)}
            </Text>
            <Text style={[styles.personalityMessage, { color: colors.muted }]}>
              {getMessage(task.personality, task.completed)}
            </Text>
          </View>
          
          {/* Meta info */}
          <View style={[styles.metaContainer, { backgroundColor: colors.card }]}>
            <View style={styles.metaRow}>
              <View style={[styles.metaIcon, { backgroundColor: colors.subtle }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.metaTextContainer}>
                <Text style={[styles.metaLabel, { color: colors.muted }]}>Due Date</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>
                  {task.deadline ? formatDeadline(task.deadline) : 'No deadline'}
                </Text>
              </View>
            </View>
            
            <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.metaRow}>
              <View style={[styles.metaIcon, { backgroundColor: colors.subtle }]}>
                <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.metaTextContainer}>
                <Text style={[styles.metaLabel, { color: colors.muted }]}>Category</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>{task.category}</Text>
              </View>
            </View>
            
            <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.metaRow}>
              <View style={[styles.metaIcon, { backgroundColor: colors.subtle }]}>
                <Ionicons 
                  name={
                    task.priority === 'high' ? 'arrow-up' : 
                    task.priority === 'medium' ? 'remove' : 'arrow-down'
                  } 
                  size={18} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.metaTextContainer}>
                <Text style={[styles.metaLabel, { color: colors.muted }]}>Priority</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Text>
              </View>
            </View>
            
            <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.metaRow}>
              <View style={[styles.metaIcon, { backgroundColor: colors.subtle }]}>
                <Ionicons name="happy-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.metaTextContainer}>
                <Text style={[styles.metaLabel, { color: colors.muted }]}>Personality</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>
                  {task.personality.charAt(0).toUpperCase() + task.personality.slice(1)}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Description */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            </View>
            
            {isEditing ? (
              <TextInput
                style={[
                  styles.descriptionInput, 
                  { 
                    color: colors.text, 
                    backgroundColor: colors.card,
                    borderColor: colors.border 
                  }
                ]}
                value={editedTask.description}
                onChangeText={(text) => setEditedTask({ ...editedTask, description: text })}
                placeholder="Task description"
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
              />
            ) : (
              <View style={[styles.descriptionContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.descriptionText, { color: colors.text }]}>
                  {task.description || 'No description'}
                </Text>
              </View>
            )}
          </View>
          
          {/* Edit options when editing */}
          {isEditing && (
            <View style={styles.editOptionsContainer}>
              <OptionSelector
                title="Category"
                options={CATEGORIES}
                selectedValue={editedTask.category}
                onSelect={(value) => setEditedTask({ ...editedTask, category: value })}
                colors={colors}
              />
              
              <OptionSelector
                title="Priority"
                options={PRIORITIES}
                selectedValue={editedTask.priority}
                onSelect={(value) => setEditedTask({ ...editedTask, priority: value })}
                colors={colors}
                renderOption={(option, isSelected) => (
                  <View style={styles.priorityOption}>
                    <Ionicons 
                      name={option.icon} 
                      size={16} 
                      color={isSelected ? 'white' : colors.text} 
                    />
                    <Text
                      style={[
                        styles.optionText,
                        { 
                          color: isSelected ? 'white' : colors.text,
                          fontFamily: isSelected ? 'Poppins-Medium' : 'Poppins-Regular',
                          marginLeft: 5,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                )}
              />
              
              <OptionSelector
                title="Personality"
                options={Object.keys(PERSONALITY_MESSAGES).map(key => ({
                  value: key,
                  label: key.charAt(0).toUpperCase() + key.slice(1),
                  emoji: getEmoji(key)
                }))}
                selectedValue={editedTask.personality}
                onSelect={(value) => setEditedTask({ ...editedTask, personality: value })}
                colors={colors}
                renderOption={(option, isSelected) => (
                  <View style={styles.personalityOption}>
                    <Text style={styles.personalityOptionEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.optionText,
                        { 
                          color: isSelected ? 'white' : colors.text,
                          fontFamily: isSelected ? 'Poppins-Medium' : 'Poppins-Regular',
                          marginLeft: 5,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}
          
          {/* Related Tasks */}
          {relatedTasks.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="git-branch-outline" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Related Tasks</Text>
              </View>
              
              <View style={styles.relatedTasksContainer}>
                {relatedTasks.map((relatedTask) => (
                  <RelatedTask
                    key={relatedTask.id}
                    task={relatedTask}
                    colors={colors}
                    onPress={handleRelatedTaskPress}
                  />
                ))}
              </View>
            </View>
          )}
          
          {/* Notes */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            </View>
            
            {isEditing ? (
              <TextInput
                style={[
                  styles.descriptionInput, 
                  { 
                    color: colors.text, 
                    backgroundColor: colors.card,
                    borderColor: colors.border 
                  }
                ]}
                value={editedTask.notes}
                onChangeText={(text) => setEditedTask({ ...editedTask, notes: text })}
                placeholder="Add notes"
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
              />
            ) : (
              <View style={[styles.descriptionContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.descriptionText, { color: colors.text }]}>
                  {task.notes || 'No notes'}
                </Text>
              </View>
            )}
          </View>
          
          {/* Created date */}
          <View style={styles.createdContainer}>
            <Text style={[styles.createdText, { color: colors.muted }]}>
              Created {task.createdAt.toLocaleDateString()}
            </Text>
          </View>
        </ScrollView>
        
        {/* Action Buttons */}
        {!isEditing && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.error },
              ]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={22} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.completeButton,
                { backgroundColor: task.completed ? colors.warning : colors.success },
              ]}
              onPress={handleToggleComplete}
            >
              <Ionicons 
                name={task.completed ? 'reload-outline' : 'checkmark'} 
                size={22} 
                color="white" 
              />
              <Text style={styles.completeButtonText}>
                {task.completed ? 'Reopen' : 'Complete'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerRight: {
    flexDirection: 'row',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButton: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  taskTitle: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    marginRight: 10,
  },
  completedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  completedText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  titleInput: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  personalityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  personalityEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  personalityMessage: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    fontStyle: 'italic',
  },
  metaContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  metaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metaTextContainer: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  metaDivider: {
    height: 1,
    marginHorizontal: 15,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
  },
  descriptionContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 15,
  },
  descriptionText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    lineHeight: 24,
  },
  descriptionInput: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 15,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    lineHeight: 24,
    borderWidth: 1,
    minHeight: 120,
  },
  editOptionsContainer: {
    marginBottom: 20,
  },
  optionSelectorContainer: {
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  optionSelectorTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personalityOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personalityOptionEmoji: {
    fontSize: 16,
  },
  relatedTasksContainer: {
    marginHorizontal: 20,
  },
  relatedTask: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
  },
  relatedTaskPriority: {
    width: 4,
    height: '80%',
    borderRadius: 2,
    marginRight: 12,
  },
  relatedTaskContent: {
    flex: 1,
  },
  relatedTaskTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginBottom: 4,
  },
  relatedTaskCategory: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  createdContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  createdText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 15,
    backgroundColor: 'transparent',
  },
  actionButton: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  completeButton: {
    flex: 1,
    marginLeft: 15,
    flexDirection: 'row',
  },
  completeButtonText: {
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    marginLeft: 10,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    marginTop: 100,
  },
}); 