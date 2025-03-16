import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Dimensions,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  Extrapolate,
  interpolateColor,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { format } from 'date-fns';

const { width, height } = Dimensions.get('window');

// Random task personality traits (updated with more ridiculous ones)
const PERSONALITY_TRAITS = [
  'Anxious', 'Cheerful', 'Perfectionist', 'Laid-back', 'Sarcastic',
  'Dramatic', 'Zen', 'Grumpy', 'Motivational', 'Philosophical',
  'Conspiracy Theorist', 'Drama Queen', 'Extremely Confused', 'Forgetful',
  'Space Cadet', 'Sugar High', 'Completely Lost', 'Paranoid', 'Clueless',
];

// Random silly emojis for tasks
const SILLY_EMOJIS = ['🤪', '🥴', '🤡', '👽', '🤖', '👻', '💩', '🦄', '🦠', '🧠', '🤦‍♂️', '🙃', '🫠', '🫥', '🫨'];

// Silly task titles for placeholders
const SILLY_TASK_TITLES = [
  'Remember to breathe today',
  'Find my missing brain cells',
  'Solve world peace (before lunch)',
  'Teach my cat to code',
  'Build a time machine out of cardboard',
  'Practice telekinesis for 10 minutes',
  'Count all the hairs on my head',
  'Train for the underwater basket weaving championship',
  'Learn to speak Klingon while sleeping',
  'Write a novel using only emojis',
  'Invent a new color',
];

// Sample task categories
const TASK_CATEGORIES = [
  { id: 'work', name: 'Work', icon: 'briefcase', color: 'primary' },
  { id: 'personal', name: 'Personal', icon: 'person', color: 'accent' },
  { id: 'health', name: 'Health', icon: 'fitness', color: 'success' },
  { id: 'learning', name: 'Learning', icon: 'school', color: 'secondary' },
  { id: 'home', name: 'Home', icon: 'home', color: 'warning' },
];

// Sample priority levels
const PRIORITY_LEVELS = [
  { id: 'critical', name: 'Critical', color: 'danger' },
  { id: 'high', name: 'High', color: 'warning' },
  { id: 'medium', name: 'Medium', color: 'info' },
  { id: 'low', name: 'Low', color: 'success' },
];

// Generate sample tasks
const generateRandomTasks = (count = 10) => {
  const tasks = [];
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  for (let i = 0; i < count; i++) {
    const randomDate = new Date(today.getTime() + Math.random() * (nextWeek.getTime() - today.getTime()));
    const hoursToDeadline = Math.floor((randomDate - today) / (1000 * 60 * 60));
    
    tasks.push({
      id: `task-${i}`,
      title: `Task ${i + 1}`,
      description: `This is a description for task ${i + 1}`,
      category: TASK_CATEGORIES[Math.floor(Math.random() * TASK_CATEGORIES.length)],
      priority: PRIORITY_LEVELS[Math.floor(Math.random() * PRIORITY_LEVELS.length)],
      deadline: randomDate,
      hoursToDeadline,
      completed: Math.random() > 0.7,
      personality: PERSONALITY_TRAITS[Math.floor(Math.random() * PERSONALITY_TRAITS.length)],
      relationships: [],
      ageState: Math.random(),
      isExpanded: false,
    });
  }
  
  // Add some relationships between tasks
  tasks.forEach((task, index) => {
    if (index < count - 1) {
      const randomIndex = Math.floor(Math.random() * count);
      if (randomIndex !== index) {
        const relationshipType = Math.random() > 0.5 ? 'frenemy' : 'friend';
        task.relationships.push({
          taskId: `task-${randomIndex}`,
          type: relationshipType,
        });
      }
    }
  });
  
  return tasks;
};

// Modified task item component with more modern aesthetics
const TaskItem = ({ task, onToggle, onDelete, onExpand, colors }) => {
  // Animation values
  const offset = useSharedValue(0);
  const itemHeight = useSharedValue(70);
  const checkScale = useSharedValue(task.completed ? 1 : 0);
  const descOpacity = useSharedValue(0);
  
  // Set initial state
  useEffect(() => {
    checkScale.value = withTiming(task.completed ? 1 : 0, { duration: 300 });
    
    if (task.isExpanded) {
      itemHeight.value = withTiming(140, { duration: 300 });
      descOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [task.completed, task.isExpanded]);
  
  // Toggle completion status
  const toggleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    checkScale.value = withSequence(
      withTiming(task.completed ? 0 : 1.3, { duration: 200 }),
      withTiming(task.completed ? 0 : 1, { duration: 150 })
    );
    onToggle(task.id);
  };
  
  // Delete animation & callback
  const deleteTask = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    offset.value = withTiming(-width, { duration: 300 }, () => {
      runOnJS(onDelete)(task.id);
    });
  };
  
  // Expand/collapse
  const toggleExpand = () => {
    Haptics.selectionAsync();
    if (!task.isExpanded) {
      itemHeight.value = withTiming(140, { duration: 300 });
      descOpacity.value = withTiming(1, { duration: 300 });
    } else {
      itemHeight.value = withTiming(70, { duration: 300 });
      descOpacity.value = withTiming(0, { duration: 200 });
    }
    onExpand(task.id);
  };
  
  // Handle swipe gesture
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: { startX: number }) => {
      ctx.startX = offset.value;
    },
    onActive: (event, ctx: { startX: number }) => {
      // Only allow left swipes (negative translation values)
      // For right swipes, keep the offset at its starting value
      if (event.translationX <= 0) {
        offset.value = ctx.startX + event.translationX;
      } else {
        offset.value = ctx.startX;
      }
    },
    onEnd: (event) => {
      // Only trigger delete if swiped left past threshold
      if (event.translationX < -width * 0.3) {
        offset.value = withTiming(-width, { duration: 300 }, () => {
          runOnJS(deleteTask)();
        });
      } else {
        // Reset position
        offset.value = withTiming(0, { duration: 300 });
      }
    },
  });
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
    height: itemHeight.value,
  }));
  
  const checkboxStyle = useAnimatedStyle(() => ({
    opacity: interpolate(checkScale.value, [0, 1], [0.3, 1]),
    transform: [{ scale: interpolate(checkScale.value, [0, 1], [0.8, 1]) }],
    backgroundColor: task.completed ? colors[task.priority.color] : 'transparent',
    borderColor: colors[task.priority.color],
  }));
  
  const titleStyle = useAnimatedStyle(() => ({
    textDecorationLine: task.completed ? 'line-through' : 'none',
    opacity: task.completed ? 0.6 : 1,
  }));
  
  const descriptionStyle = useAnimatedStyle(() => ({
    opacity: descOpacity.value,
  }));
  
  // Format deadline
  const formattedDeadline = format(task.deadline, 'MMM d, h:mm a');
  
  // Add random emojis to task titles on render
  const taskEmoji = useRef(SILLY_EMOJIS[Math.floor(Math.random() * SILLY_EMOJIS.length)]).current;
  
  // Get personality icon with more silly icons
  const getPersonalityIcon = (personality) => {
    switch (personality) {
      case 'Anxious': return 'pulse';
      case 'Cheerful': return 'happy';
      case 'Perfectionist': return 'checkmark-circle';
      case 'Laid-back': return 'sunny';
      case 'Sarcastic': return 'thumbs-down';
      case 'Dramatic': return 'thunderstorm';
      case 'Zen': return 'flower';
      case 'Grumpy': return 'cloud';
      case 'Motivational': return 'trophy';
      case 'Philosophical': return 'book';
      case 'Conspiracy Theorist': return 'planet';
      case 'Drama Queen': return 'flame';
      case 'Extremely Confused': return 'help';
      case 'Forgetful': return 'help-buoy';
      case 'Space Cadet': return 'rocket';
      case 'Sugar High': return 'ice-cream';
      case 'Completely Lost': return 'compass';
      case 'Paranoid': return 'eye';
      case 'Clueless': return 'help-circle';
      default: return 'help-circle';
    }
  };
  
  // Is deadline close?
  const isDeadlineClose = task.hoursToDeadline < 24 && !task.completed;
  
  return (
    <View style={styles.taskItemContainer}>
      {/* Delete background */}
      <View style={[styles.deleteBackground, { backgroundColor: colors.danger }]}>
        <Ionicons name="trash" size={24} color="white" />
        <Text style={styles.deleteText}>Delete</Text>
      </View>
      
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          style={[
            styles.taskItem,
            animatedStyle,
            { backgroundColor: colors.card }
          ]}
        >
          <TouchableOpacity
            style={[styles.checkbox]}
            onPress={toggleComplete}
          >
            <Animated.View style={[styles.checkboxInner, checkboxStyle]}>
              {task.completed && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </Animated.View>
          </TouchableOpacity>
          
          <View style={styles.taskContent}>
            <View style={styles.taskHeader}>
              <Animated.Text
                style={[styles.taskTitle, titleStyle, { color: colors.text }]}
                numberOfLines={1}
              >
                {taskEmoji} {task.title}
              </Animated.Text>
              
              <TouchableOpacity onPress={toggleExpand}>
                <Ionicons
                  name={task.isExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.taskMeta}>
              <View style={[styles.categoryBadge, { backgroundColor: `${colors[task.category.color]}20` }]}>
                <Ionicons
                  name={task.category.icon}
                  size={12}
                  color={colors[task.category.color]}
                />
                <Text
                  style={[
                    styles.categoryText,
                    { color: colors[task.category.color] }
                  ]}
                >
                  {task.category.name}
                </Text>
              </View>
              
              <View style={[styles.deadlineContainer, { backgroundColor: isDeadlineClose ? `${colors.danger}20` : `${colors.muted}20` }]}>
                <Ionicons
                  name="time"
                  size={12}
                  color={isDeadlineClose ? colors.danger : colors.muted}
                />
                <Text
                  style={[
                    styles.deadlineText,
                    {
                      color: isDeadlineClose
                        ? colors.danger
                        : colors.muted
                    }
                  ]}
                >
                  {formattedDeadline}
                </Text>
              </View>
            </View>
            
            {task.isExpanded && (
              <Animated.View style={[styles.taskDescription, descriptionStyle]}>
                <Text style={[styles.descriptionText, { color: colors.text }]}>
                  {task.description}
                </Text>
                
                <View style={[styles.personalityContainer, { backgroundColor: `${colors.muted}20` }]}>
                  <Ionicons
                    name={getPersonalityIcon(task.personality)}
                    size={12}
                    color={colors.muted}
                  />
                  <Text style={[styles.personalityText, { color: colors.muted }]}>
                    {task.personality}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
          
          <View style={styles.taskActions}>
            {isDeadlineClose && !task.completed && (
              <View style={[styles.urgentBadge, { backgroundColor: colors.danger }]}>
                <Text style={styles.urgentText}>!</Text>
              </View>
            )}
            
            {task.completed && (
              <View style={styles.rewardContainer}>
                <Text style={styles.rewardStar}>⭐</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const pageOpacity = useSharedValue(0);
  
  // Add task modal state
  const [isAddTaskModalVisible, setIsAddTaskModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(TASK_CATEGORIES[0]);
  const [selectedPriority, setSelectedPriority] = useState(PRIORITY_LEVELS[2]); // Medium priority default
  const [validationErrors, setValidationErrors] = useState([]);
  const [bypassMode, setBypassMode] = useState(false);
  
  // Initialize tasks
  useEffect(() => {
    setTasks(generateRandomTasks(12));
    pageOpacity.value = withTiming(1, { duration: 800 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  
  // Function to add a new task
  const addTask = () => {
    if (!bypassMode) {
      // Validation
      const errors = [];
      
      if (!newTaskTitle.trim()) {
        errors.push("Task title cannot be empty.");
      }
      
      if (!newTaskDescription.trim()) {
        errors.push("Please provide a task description.");
      }
      
      // Set validation errors
      if (errors.length > 0) {
        setValidationErrors(errors);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }
    
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const randomDate = new Date(today.getTime() + Math.random() * (nextWeek.getTime() - today.getTime()));
    const hoursToDeadline = Math.floor((randomDate - today) / (1000 * 60 * 60));
    
    const newTask = {
      id: `task-${tasks.length + 1}-${Date.now()}`,
      title: newTaskTitle || SILLY_TASK_TITLES[Math.floor(Math.random() * SILLY_TASK_TITLES.length)],
      description: newTaskDescription || `This is a description for your task.`,
      category: selectedCategory,
      priority: selectedPriority,
      deadline: randomDate,
      hoursToDeadline,
      completed: false,
      personality: PERSONALITY_TRAITS[Math.floor(Math.random() * PERSONALITY_TRAITS.length)],
      relationships: [],
      ageState: Math.random(),
      isExpanded: false,
    };
    
    setTasks(prevTasks => [newTask, ...prevTasks]);
    
    // Reset form and close modal
    setNewTaskTitle('');
    setNewTaskDescription('');
    setSelectedCategory(TASK_CATEGORIES[0]);
    setSelectedPriority(PRIORITY_LEVELS[2]);
    setValidationErrors([]);
    setBypassMode(false);
    setIsAddTaskModalVisible(false);
    
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Success alert
    setTimeout(() => {
      Alert.alert(
        "Task Added!",
        "Your task has been added successfully!",
        [{ text: "Great", style: "default" }]
      );
    }, 500);
  };
  
  // Handle task completion toggle
  const toggleTaskCompletion = (taskId) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };
  
  // Handle task deletion
  const deleteTask = (taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };
  
  // Handle task expansion
  const toggleTaskExpansion = (taskId) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, isExpanded: !task.isExpanded }
          : task
      )
    );
  };
  
  // Filter tasks
  const getFilteredTasks = () => {
    let filtered = [...tasks];
    
    // Apply search filter if any
    if (searchText) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchText.toLowerCase()) ||
        task.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Apply status filter
    switch (filter) {
      case 'completed':
        return filtered.filter(task => task.completed);
      case 'active':
        return filtered.filter(task => !task.completed);
      case 'urgent':
        return filtered.filter(task => task.hoursToDeadline < 24 && !task.completed);
      default:
        return filtered;
    }
  };
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value,
  }));
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <Animated.View style={[styles.content, animatedStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Tasks</Text>
          </View>
          
          {/* Search and Add button row */}
          <View style={styles.searchRow}>
            <View style={[styles.searchContainer, { backgroundColor: colors.subtle }]}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search tasks..."
                placeholderTextColor={colors.muted}
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setIsAddTaskModalVisible(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Filter tabs */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filter === 'all' && { backgroundColor: colors.primary }
                ]}
                onPress={() => setFilter('all')}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: filter === 'all' ? 'white' : colors.muted }
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filter === 'active' && { backgroundColor: colors.info }
                ]}
                onPress={() => setFilter('active')}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: filter === 'active' ? 'white' : colors.muted }
                  ]}
                >
                  Active
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filter === 'completed' && { backgroundColor: colors.success }
                ]}
                onPress={() => setFilter('completed')}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: filter === 'completed' ? 'white' : colors.muted }
                  ]}
                >
                  Completed
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filter === 'urgent' && { backgroundColor: colors.danger }
                ]}
                onPress={() => setFilter('urgent')}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: filter === 'urgent' ? 'white' : colors.muted }
                  ]}
                >
                  Urgent
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          
          {/* Task list */}
          <View style={styles.taskListContainer}>
            {getFilteredTasks().length > 0 ? (
              getFilteredTasks().map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTaskCompletion}
                  onDelete={deleteTask}
                  onExpand={toggleTaskExpansion}
                  colors={colors}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="cafe"
                  size={60}
                  color={colors.muted}
                  style={styles.emptyIcon}
                />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No Tasks Found
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                  {searchText
                    ? "Try a different search term"
                    : filter === 'completed'
                    ? "You haven't completed any tasks yet"
                    : filter === 'urgent'
                    ? "No urgent tasks at the moment"
                    : "Add a task to get started"}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Add Task Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddTaskModalVisible}
        onRequestClose={() => setIsAddTaskModalVisible(false)}
      >
        <BlurView intensity={90} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Task</Text>
              <TouchableOpacity onPress={() => setIsAddTaskModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Task Title Input */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Task Title</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.subtle, color: colors.text }]}
              placeholder="Enter a title for your task"
              placeholderTextColor={colors.muted}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              maxLength={50}
            />
            
            {/* Task Description Input */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Description</Text>
            <TextInput
              style={[styles.modalTextArea, { backgroundColor: colors.subtle, color: colors.text }]}
              placeholder="Describe your task"
              placeholderTextColor={colors.muted}
              value={newTaskDescription}
              onChangeText={setNewTaskDescription}
              multiline
              textAlignVertical="top"
              numberOfLines={6}
            />
            
            {/* Display validation errors */}
            {validationErrors.length > 0 && (
              <View style={styles.errorContainer}>
                {validationErrors.map((error, index) => (
                  <Text key={index} style={styles.errorText}>
                    • {error}
                  </Text>
                ))}
              </View>
            )}
            
            {/* Category Selection */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
            >
              {TASK_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryPill,
                    { 
                      backgroundColor: selectedCategory.id === category.id 
                        ? colors[category.color] 
                        : colors.subtle
                    }
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Ionicons 
                    name={category.icon} 
                    size={16} 
                    color={selectedCategory.id === category.id ? 'white' : colors.text} 
                  />
                  <Text 
                    style={[
                      styles.categoryPillText, 
                      { 
                        color: selectedCategory.id === category.id 
                          ? 'white' 
                          : colors.text 
                      }
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Priority Selection */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Priority</Text>
            <View style={styles.priorityContainer}>
              {PRIORITY_LEVELS.map((priority) => (
                <TouchableOpacity
                  key={priority.id}
                  style={[
                    styles.priorityPill,
                    { 
                      backgroundColor: selectedPriority.id === priority.id 
                        ? colors[priority.color] 
                        : colors.subtle
                    }
                  ]}
                  onPress={() => setSelectedPriority(priority)}
                >
                  <Text 
                    style={[
                      styles.priorityPillText, 
                      { 
                        color: selectedPriority.id === priority.id 
                          ? 'white' 
                          : colors.text 
                      }
                    ]}
                  >
                    {priority.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Add Button */}
            <TouchableOpacity 
              style={[styles.addTaskButton, { backgroundColor: colors.primary }]}
              onPress={addTask}
            >
              <Text style={styles.addTaskButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: 'Poppins-Bold',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
  },
  filterText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  taskListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  taskItemContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    height: '100%',
    width: '100%',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 30,
  },
  deleteText: {
    color: 'white',
    fontFamily: 'Poppins-Medium',
    marginLeft: 5,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  checkbox: {
    marginRight: 12,
    marginTop: 3,
  },
  checkboxInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    maxWidth: '90%',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginLeft: 4,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deadlineText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginLeft: 4,
  },
  personalityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  personalityText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginLeft: 4,
  },
  taskDescription: {
    marginTop: 10,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  taskActions: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  urgentBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentText: {
    color: 'white',
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 15,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 5,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    maxWidth: '80%',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    marginBottom: 15,
  },
  modalTextArea: {
    width: '100%',
    height: 120,
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 15,
    textAlignVertical: 'top',
    fontFamily: 'Poppins-Regular',
  },
  categoriesContainer: {
    marginBottom: 15,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryPillText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    marginLeft: 5,
  },
  priorityContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    justifyContent: 'space-between',
  },
  priorityPill: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  priorityPillText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  addTaskButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskButtonText: {
    color: 'white',
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
  },
  errorContainer: {
    marginTop: 5,
    marginBottom: 15,
    padding: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginVertical: 2,
    fontFamily: 'Poppins-Regular',
  },
  rewardContainer: {
    flexDirection: 'row',
    marginLeft: 5,
  },
  rewardStar: {
    fontSize: 16,
    marginLeft: 2,
  },
}); 