import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// Sample data for charts
const weeklyFocusData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      data: [3.2, 4.5, 2.1, 5.8, 4.2, 1.5, 3.7],
      color: (opacity = 1) => `rgba(112, 71, 235, ${opacity})`,
      strokeWidth: 2,
    },
  ],
};

const taskCompletionData = {
  labels: ['Work', 'Personal', 'Health', 'Learning', 'Home'],
  datasets: [
    {
      data: [18, 12, 6, 9, 4],
    },
  ],
};

const productivityByHourData = {
  labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
  datasets: [
    {
      data: [2, 5, 4, 6, 3, 1],
      color: (opacity = 1) => `rgba(93, 108, 250, ${opacity})`,
      strokeWidth: 2,
    },
  ],
};

// 3D Visualization Components replaced with Animated version
function AnimatedProductivityLandscape() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Animation values for the interactive effect
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const scaleValue = useSharedValue(1);
  
  useEffect(() => {
    // Create continuous animation for rotation
    rotateX.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 20000 }),
      -1, // infinite
      false // don't reverse
    );
    
    rotateY.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 15000 }),
      -1, // infinite
      false // don't reverse
    );
    
    // Subtle breathing animation
    scaleValue.value = withRepeat(
      withTiming(1.05, { duration: 3000 }),
      -1, // infinite
      true // reverse
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotateX: `${rotateX.value}rad` },
        { rotateY: `${rotateY.value}rad` },
        { scale: scaleValue.value }
      ],
    };
  });
  
  return (
    <View style={[styles.placeholderContainer, { backgroundColor: colors.card }]}>
      <LinearGradient
        colors={colors.gradient.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.placeholderGradient}
      >
        <Animated.View style={[styles.placeholderContent, animatedStyle]}>
          <Ionicons name="cube-outline" size={40} color="white" />
          <Text style={styles.placeholderTitle}>3D Productivity Landscape</Text>
          <Text style={styles.placeholderDescription}>
            Visualize your productivity patterns in 3D
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

function ProductivityInsights({ data }) {
  // Calculate insights
  const totalHours = data.reduce((sum, day) => sum + day, 0);
  const averageHours = totalHours / data.length;
  const maxHours = Math.max(...data);
  const maxDay = weeklyFocusData.labels[data.indexOf(maxHours)];
  
  return (
    <View style={styles.insightsContainer}>
      <Text style={styles.insightTitle}>Productivity Insights</Text>
      
      <View style={styles.insightRow}>
        <View style={styles.insightItem}>
          <Text style={styles.insightValue}>{totalHours.toFixed(1)}</Text>
          <Text style={styles.insightLabel}>Total Hours</Text>
        </View>
        
        <View style={styles.insightItem}>
          <Text style={styles.insightValue}>{averageHours.toFixed(1)}</Text>
          <Text style={styles.insightLabel}>Daily Average</Text>
        </View>
        
        <View style={styles.insightItem}>
          <Text style={styles.insightValue}>{maxDay}</Text>
          <Text style={styles.insightLabel}>Most Productive</Text>
        </View>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [activeTab, setActiveTab] = useState('focus');
  const [timeRange, setTimeRange] = useState('week');
  const pageOpacity = useSharedValue(0);
  const landscapeScale = useSharedValue(0.8);
  
  // Animation effects
  useEffect(() => {
    pageOpacity.value = withTiming(1, { duration: 800 });
    landscapeScale.value = withSpring(1, { damping: 12 });
    
    // Trigger welcome haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  
  // Animated styles
  const pageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value,
  }));
  
  const landscapeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: landscapeScale.value }],
  }));
  
  // Tab change handler
  const handleTabChange = (tab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
    
    // Animation for tab change
    landscapeScale.value = withSequence(
      withTiming(0.9, { duration: 200 }),
      withSpring(1, { damping: 12 })
    );
  };
  
  // Time range change handler
  const handleTimeRangeChange = (range) => {
    Haptics.selectionAsync();
    setTimeRange(range);
  };
  
  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => `rgba(${colorScheme === 'dark' ? '243, 244, 246' : '51, 51, 51'}, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 1,
    labelColor: () => colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <Animated.View style={[styles.content, pageAnimatedStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
          
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: colors.subtle }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="options-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.timeRangeTab,
                timeRange === 'day' && {
                  backgroundColor: colors.primary,
                }
              ]}
              onPress={() => handleTimeRangeChange('day')}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  {
                    color: timeRange === 'day' ? 'white' : colors.muted
                  }
                ]}
              >
                Day
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.timeRangeTab,
                timeRange === 'week' && {
                  backgroundColor: colors.primary,
                }
              ]}
              onPress={() => handleTimeRangeChange('week')}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  {
                    color: timeRange === 'week' ? 'white' : colors.muted
                  }
                ]}
              >
                Week
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.timeRangeTab,
                timeRange === 'month' && {
                  backgroundColor: colors.primary,
                }
              ]}
              onPress={() => handleTimeRangeChange('month')}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  {
                    color: timeRange === 'month' ? 'white' : colors.muted
                  }
                ]}
              >
                Month
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.timeRangeTab,
                timeRange === 'year' && {
                  backgroundColor: colors.primary,
                }
              ]}
              onPress={() => handleTimeRangeChange('year')}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  {
                    color: timeRange === 'year' ? 'white' : colors.muted
                  }
                ]}
              >
                Year
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 3D Visualization - replaced with animated placeholder */}
          <Animated.View style={[styles.landscapeContainer, landscapeAnimatedStyle]}>
            <AnimatedProductivityLandscape />
          </Animated.View>
          
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'focus' && {
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2,
                }
              ]}
              onPress={() => handleTabChange('focus')}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'focus' ? colors.primary : colors.muted
                  }
                ]}
              >
                Focus Time
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'tasks' && {
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2,
                }
              ]}
              onPress={() => handleTabChange('tasks')}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'tasks' ? colors.primary : colors.muted
                  }
                ]}
              >
                Tasks
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'habits' && {
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2,
                }
              ]}
              onPress={() => handleTabChange('habits')}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'habits' ? colors.primary : colors.muted
                  }
                ]}
              >
                Habits
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Charts based on active tab */}
          {activeTab === 'focus' && (
            <>
              <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Weekly Focus Hours
                </Text>
                <LineChart
                  data={weeklyFocusData}
                  width={width - 40}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </View>
              
              <ProductivityInsights data={weeklyFocusData.datasets[0].data} />
              
              <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Productivity by Hour
                </Text>
                <LineChart
                  data={productivityByHourData}
                  width={width - 40}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
                <Text style={[styles.chartNote, { color: colors.muted }]}>
                  Your peak productivity is around 3PM
                </Text>
              </View>
            </>
          )}
          
          {activeTab === 'tasks' && (
            <>
              <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Tasks Completed by Category
                </Text>
                <BarChart
                  data={taskCompletionData}
                  width={width - 40}
                  height={220}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(254, 127, 106, ${opacity})`,
                  }}
                  style={styles.chart}
                  fromZero
                />
              </View>
              
              <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.statsTitle, { color: colors.text }]}>
                  Task Completion Rate
                </Text>
                
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>78%</Text>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>
                      Completion Rate
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>49</Text>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>
                      Tasks Completed
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>14</Text>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>
                      Tasks Pending
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
          
          {activeTab === 'habits' && (
            <>
              <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Habit Streaks
                </Text>
                <BarChart
                  data={{
                    labels: ['Focus', 'Exercise', 'Reading', 'Meditation', 'Coding'],
                    datasets: [
                      {
                        data: [12, 8, 5, 15, 21],
                      },
                    ],
                  }}
                  width={width - 40}
                  height={220}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                  }}
                  style={styles.chart}
                  fromZero
                />
                <Text style={[styles.chartNote, { color: colors.muted }]}>
                  Your longest streak is 21 days of coding
                </Text>
              </View>
              
              <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.statsTitle, { color: colors.text }]}>
                  Habit Consistency
                </Text>
                
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>85%</Text>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>
                      Weekly Consistency
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>12.2</Text>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>
                      Avg. Streak Length
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
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
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  scrollContent: {
    paddingBottom: 100,
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
    fontWeight: 'bold',
    color: 'white',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRangeContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  timeRangeTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  timeRangeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  landscapeContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 10,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontWeight: '600',
    fontSize: 16,
  },
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 20,
  },
  chartTitle: {
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 15,
  },
  chart: {
    borderRadius: 16,
  },
  chartNote: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
  },
  statsTitle: {
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 5,
    color: 'white',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  insightsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  insightTitle: {
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 15,
    color: 'white',
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightItem: {
    alignItems: 'center',
  },
  insightValue: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 5,
    color: 'white',
  },
  insightLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  placeholderContainer: {
    margin: 0,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderGradient: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    perspective: 1000,
  },
  placeholderContent: {
    alignItems: 'center',
    padding: 20,
    backfaceVisibility: 'hidden',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  placeholderDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
}); 