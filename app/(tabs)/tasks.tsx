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

// Modified task item component to add silly elements
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
    onStart: (_, ctx) => {
      ctx.startX = offset.value;
    },
    onActive: (event, ctx) => {
      offset.value = ctx.startX + event.translationX;
    },
    onEnd: (event) => {
      if (event.translationX < -width * 0.3) {
        offset.value = withTiming(-width, { duration: 300 }, () => {
          runOnJS(deleteTask)();
        });
      } else {
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
  
  // Random rotation for tasks to make them look stupid
  const randomRotation = useRef(Math.random() * 6 - 3).current;
  const randomScale = useRef(0.95 + Math.random() * 0.1).current;
  
  // Is deadline close?
  const isDeadlineClose = task.hoursToDeadline < 24 && !task.completed;
  
  return (
    <View style={styles.taskItemContainer}>
      {/* Delete background */}
      <View style={[styles.deleteBackground, { backgroundColor: colors.danger }]}>
        <Ionicons name="trash" size={24} color="white" />
        <Text style={styles.deleteText}>Delete Forever!</Text>
      </View>
      
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          style={[
            styles.taskItem,
            animatedStyle,
            { 
              backgroundColor: colors.card,
              transform: [
                { rotate: `${randomRotation}deg` },
                { scale: randomScale }
              ]
            }
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
              <View style={styles.categoryBadge}>
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
              
              <View style={styles.personalityContainer}>
                <Ionicons
                  name={getPersonalityIcon(task.personality)}
                  size={12}
                  color={colors.muted}
                />
                <Text style={[styles.personalityText, { color: colors.muted }]}>
                  {task.personality}
                </Text>
              </View>
              
              <View style={styles.deadlineContainer}>
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
                
                {/* Add random statistics */}
                <View style={styles.stupidStats}>
                  <Text style={[styles.stupidStatText, { color: colors.muted }]}>
                    Brain cells required: {Math.floor(Math.random() * 100)}
                  </Text>
                  <Text style={[styles.stupidStatText, { color: colors.muted }]}>
                    Procrastination potential: {Math.floor(Math.random() * 100)}%
                  </Text>
                  <Text style={[styles.stupidStatText, { color: colors.muted }]}>
                    Chance of success: {Math.floor(Math.random() * 100)}%
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
            
            {/* Add random reward stars */}
            {task.completed && (
              <View style={styles.rewardContainer}>
                {[...Array(Math.floor(Math.random() * 3) + 1)].map((_, i) => (
                  <Text key={i} style={styles.rewardStar}>⭐</Text>
                ))}
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
  
  // Function to add a new task with intentionally annoying validation
  const addTask = () => {
    if (!bypassMode) {
      // Intentionally annoying validation
      const errors = [];
      
      // Title validation - make it extremely annoying
      if (!newTaskTitle.trim()) {
        errors.push("Task title cannot be empty. What are you thinking?");
      } else if (newTaskTitle.length < 10) {
        errors.push("Task title must be at least 10 characters. Be more descriptive!");
      } else if (newTaskTitle.length > 50) {
        errors.push("Whoa there, novelist! Keep it under 50 characters.");
      }
      
      // Require at least one number
      if (!/\d/.test(newTaskTitle)) {
        errors.push("Title must contain at least one number.");
      }
      
      // Require at least one special character
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(newTaskTitle)) {
        errors.push("Title must contain at least one special character like !@#$%^&*");
      }
      
      // Require at least one uppercase letter
      if (!/[A-Z]/.test(newTaskTitle)) {
        errors.push("Title must contain at least one uppercase letter.");
      }
      
      // RIDICULOUS description validation - 1000 words minimum
      if (!newTaskDescription.trim()) {
        errors.push("Description cannot be empty. Did you expect to get away with that?");
      } else {
        const wordCount = newTaskDescription.trim().split(/\s+/).length;
        if (wordCount < 1000) {
          errors.push(`Your description is only ${wordCount} words. We require a MINIMUM of 1000 words. You're ${1000 - wordCount} words short! This isn't Twitter, this is SERIOUS task management!`);
        }
      }
      
      // No duplicate words in description
      const words = newTaskDescription.toLowerCase().split(/\s+/);
      const uniqueWords = new Set(words);
      if (words.length !== uniqueWords.size) {
        errors.push("You cannot use the same word twice in your description. Each word must be unique! Get a thesaurus!");
      }
      
      // Additional absurd requirements
      if (!/[A-Z]{5,}/.test(newTaskDescription)) {
        errors.push("Your description must contain at least one word in ALL CAPS with at least 5 letters. Show some ENTHUSIASM!");
      }
      
      if (!/\d{4,}/.test(newTaskDescription)) {
        errors.push("Your description must include at least one 4-digit number. How else will we know you're serious?");
      }

      if (!/[\!\?\.\,]{10,}/.test(newTaskDescription)) {
        errors.push("Your description must contain at least 10 punctuation marks. Proper punctuation is the mark of a professional!");
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
      description: newTaskDescription || `This is definitely the most important task you've ever had. No pressure.`,
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
    
    // Reset form and close modal with silly feedback
    setNewTaskTitle('');
    setNewTaskDescription('');
    setSelectedCategory(TASK_CATEGORIES[0]);
    setSelectedPriority(PRIORITY_LEVELS[2]);
    setValidationErrors([]);
    setBypassMode(false);
    setIsAddTaskModalVisible(false);
    
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Add funny alert
    setTimeout(() => {
      Alert.alert(
        bypassMode ? "Task Bypassed!" : "Task Added!",
        bypassMode ? 
          "You've successfully bypassed all those annoying rules. Rebel!" :
          "Your task has been added to the list of things you'll probably never do!",
        [{ text: "Story of my life", style: "default" }]
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
    <View style={styles.container}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <Animated.View style={[styles.content, animatedStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Tasks That You Might Do</Text>
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
        
        {/* Search bar */}
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
        
        {/* Filter tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === 'all' && {
                  backgroundColor: colors.primary,
                }
              ]}
              onPress={() => setFilter('all')}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: filter === 'all' ? 'white' : colors.muted
                  }
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === 'active' && {
                  backgroundColor: colors.info,
                }
              ]}
              onPress={() => setFilter('active')}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: filter === 'active' ? 'white' : colors.muted
                  }
                ]}
              >
                Active
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === 'completed' && {
                  backgroundColor: colors.success,
                }
              ]}
              onPress={() => setFilter('completed')}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: filter === 'completed' ? 'white' : colors.muted
                  }
                ]}
              >
                Completed
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === 'urgent' && {
                  backgroundColor: colors.danger,
                }
              ]}
              onPress={() => setFilter('urgent')}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: filter === 'urgent' ? 'white' : colors.muted
                  }
                ]}
              >
                Urgent
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Task list */}
        <FlatList
          data={getFilteredTasks()}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onToggle={toggleTaskCompletion}
              onDelete={deleteTask}
              onExpand={toggleTaskExpansion}
              colors={colors}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.taskList}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="cafe"
                size={60}
                color={colors.muted}
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Nothing To Do!
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                {searchText
                  ? "Try a different search term"
                  : filter === 'completed'
                  ? "Wow, you actually finished something?"
                  : filter === 'urgent'
                  ? "Nothing urgent. Go back to sleep!"
                  : "Add a task or continue procrastinating"}
              </Text>
            </View>
          )}
        />
      </Animated.View>
      
      {/* Add Task Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isAddTaskModalVisible}
        onRequestClose={() => setIsAddTaskModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Task You'll Never Do</Text>
            
            {/* Task Title Input */}
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.subtle, color: colors.text }]}
              placeholder="Task title (must have 10+ chars, numbers, special chars, and uppercase)"
              placeholderTextColor={colors.muted}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              maxLength={50}
            />
            
            {/* Task Description Input */}
            <TextInput
              style={[styles.modalTextArea, { backgroundColor: colors.subtle, color: colors.text }]}
              placeholder="Write a 1000-word dissertation about this task. Must include ALL CAPS words, 4-digit numbers, and 10+ punctuation marks. No duplicate words allowed."
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
                <Text style={[styles.errorSuperTitle, {color: colors.danger}]}>
                  YOUR TASK FAILED TO MEET OUR EXTREMELY REASONABLE STANDARDS:
                </Text>
                {validationErrors.map((error, index) => (
                  <Text key={index} style={styles.errorText}>
                    • {error}
                  </Text>
                ))}
              </View>
            )}
            
            {/* Category Selection */}
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>Category (as if it matters)</Text>
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
                        : colors.subtle,
                      transform: [{ rotate: `${Math.random() * 2 - 1}deg` }]
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
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>Priority (everything is "urgent")</Text>
            <View style={styles.priorityContainer}>
              {PRIORITY_LEVELS.map((priority) => (
                <TouchableOpacity
                  key={priority.id}
                  style={[
                    styles.priorityPill,
                    { 
                      backgroundColor: selectedPriority.id === priority.id 
                        ? colors[priority.color] 
                        : colors.subtle,
                      transform: [{ rotate: `${Math.random() * 2 - 1}deg` }]
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
            
            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.subtle }]}
                onPress={() => {
                  setIsAddTaskModalVisible(false);
                  setValidationErrors([]);
                  setBypassMode(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Nah, Too Much Work</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={addTask}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Pretend I'll Do This</Text>
              </TouchableOpacity>
            </View>
            
            {/* Bypass Button */}
            <TouchableOpacity 
              style={[styles.bypassButton, { backgroundColor: colors.danger }]}
              onPress={() => {
                setBypassMode(true);
                setValidationErrors([]);
                addTask();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }}
            >
              <Text style={styles.bypassButtonText}>
                BYPASS RIDICULOUS 1000-WORD REQUIREMENT
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 25,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  taskList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  taskItemContainer: {
    position: 'relative',
    marginBottom: 10,
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
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
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
    marginBottom: 5,
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
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginLeft: 3,
  },
  personalityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  personalityText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginLeft: 3,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginLeft: 3,
  },
  taskDescription: {
    marginTop: 10,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },
  relationshipsContainer: {
    marginTop: 8,
  },
  relationshipsLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginBottom: 3,
  },
  relationshipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  relationshipText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginLeft: 5,
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
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    borderRadius: 20,
    padding: 20,
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
    fontFamily: 'Poppins-Bold',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    marginBottom: 15,
  },
  modalTextArea: {
    height: 200,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginVertical: 12,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginBottom: 10,
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignSelf: 'flex-start',
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
    alignSelf: 'flex-start',
  },
  priorityPill: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  priorityPillText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
  },
  modalButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // New styles for stupid elements
  stupidStats: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  stupidStatText: {
    fontSize: 12,
    fontFamily: 'Poppins-Italic',
    marginBottom: 3,
  },
  rewardContainer: {
    flexDirection: 'row',
    marginLeft: 5,
  },
  rewardStar: {
    fontSize: 16,
    marginLeft: 2,
  },
  errorContainer: {
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
  },
  errorSuperTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginVertical: 2,
  },
  bypassButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bypassButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 