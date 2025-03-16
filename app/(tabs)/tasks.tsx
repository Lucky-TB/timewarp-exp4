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

// Random task personality traits
const PERSONALITY_TRAITS = [
  'Anxious', 'Cheerful', 'Perfectionist', 'Laid-back', 'Sarcastic',
  'Dramatic', 'Zen', 'Grumpy', 'Motivational', 'Philosophical',
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

// Task item component
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
  
  // Get personality icon
  const getPersonalityIcon = (personality) => {
    switch (personality) {
      case 'Anxious': return 'pulse';
      case 'Cheerful': return 'happy';
      case 'Perfectionist': return 'checkmark-circle';
      case 'Laid-back': return 'sunny';
      case 'Sarcastic': return 'eye-roll';
      case 'Dramatic': return 'thunderstorm';
      case 'Zen': return 'flower';
      case 'Grumpy': return 'cloud';
      case 'Motivational': return 'trophy';
      case 'Philosophical': return 'book';
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
                {task.title}
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
            
            <Animated.View style={[styles.taskDescription, descriptionStyle]}>
              <Text
                style={[styles.descriptionText, { color: colors.text }]}
                numberOfLines={2}
              >
                {task.description}
              </Text>
              
              {task.relationships.length > 0 && (
                <View style={styles.relationshipsContainer}>
                  <Text style={[styles.relationshipsLabel, { color: colors.muted }]}>
                    Related tasks:
                  </Text>
                  {task.relationships.map((rel, index) => (
                    <View key={index} style={styles.relationshipItem}>
                      <Ionicons
                        name={rel.type === 'friend' ? 'heart' : 'flash'}
                        size={12}
                        color={rel.type === 'friend' ? colors.success : colors.warning}
                      />
                      <Text
                        style={[
                          styles.relationshipText,
                          {
                            color: rel.type === 'friend'
                              ? colors.success
                              : colors.warning
                          }
                        ]}
                      >
                        {rel.taskId.replace('task-', 'Task ')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>
          </View>
          
          <View style={styles.taskActions}>
            {isDeadlineClose && !task.completed && (
              <View style={[styles.urgentBadge, { backgroundColor: colors.danger }]}>
                <Text style={styles.urgentText}>!</Text>
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
  
  // Initialize tasks
  useEffect(() => {
    setTasks(generateRandomTasks(12));
    pageOpacity.value = withTiming(1, { duration: 800 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Tasks</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
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
                name="checkbox"
                size={60}
                color={colors.muted}
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No tasks found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                {searchText
                  ? "Try a different search term"
                  : filter === 'completed'
                  ? "Complete some tasks to see them here"
                  : filter === 'urgent'
                  ? "No urgent tasks right now"
                  : "Add a new task to get started"}
              </Text>
            </View>
          )}
        />
      </Animated.View>
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
}); 