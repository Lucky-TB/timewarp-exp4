import React, { useState, useRef, useEffect } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Switch,
  Animated,
  Pressable,
  ImageBackground,
  Dimensions
} from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// Dimensions for responsive sizing
const { width } = Dimensions.get('window');

// Gemini API key
const API_KEY = 'AIzaSyAWOvNRyxSK94LWXzOTdL3wmf4Uv8ERMDk';
// Use text-only model that's available for free tier
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Add a counter to track API usage and enforce our own limits
let apiCallCounter = 0;
const MAX_API_CALLS = 15; // Limit for free tier to prevent hitting quotas

export default function CompanionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  
  // Gender state for the companion
  const [isFemale, setIsFemale] = useState(false);
  
  // Animation for avatar effects
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Prepare animated bounce effect
  const startBounceAnimation = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: -12,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  // Start pulsing animation
  useEffect(() => {
    // Continuous pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        })
      ])
    ).start();
    
    // Subtle continuous rotation for avatar background
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const [messages, setMessages] = useState([
    { 
      id: '1', 
      text: isFemale ? 
        'Hey there! I\'m your personal companion. How\'s your day going?' : 
        'Sup! I\'m your personal companion. What\'s on your mind today?', 
      sender: 'bot',
      timestamp: new Date() 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);
  
  // Add state to track if free tier is exceeded
  const [apiQuotaExceeded, setApiQuotaExceeded] = useState(false);
  
  // Load messages and gender preference from storage on mount
  useEffect(() => {
    loadMessages();
    loadGenderPreference();
  }, []);
  
  // Reset welcome message when gender changes
  useEffect(() => {
    const welcomeMessage = {
      id: '1',
      text: isFemale ? 
        'Hey there! I\'m your personal companion. How\'s your day going?' : 
        'Sup! I\'m your personal companion. What\'s on your mind today?',
      sender: 'bot',
      timestamp: new Date()
    };
    
    // Only update if there's just 1 message (the welcome message)
    if (messages.length === 1) {
      setMessages([welcomeMessage]);
    }
    
    saveGenderPreference();
    startBounceAnimation();
  }, [isFemale]);
  
  // Save messages when they change
  useEffect(() => {
    if (messages.length > 1) {
      saveMessages();
    }
  }, [messages]);
  
  // Load messages from AsyncStorage
  const loadMessages = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem('geminiMessages');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert timestamps back to Date objects
        const processedMessages = parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(processedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };
  
  // Save messages to AsyncStorage
  const saveMessages = async () => {
    try {
      await AsyncStorage.setItem('geminiMessages', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };
  
  // Load gender preference
  const loadGenderPreference = async () => {
    try {
      const savedPreference = await AsyncStorage.getItem('companionGender');
      if (savedPreference !== null) {
        setIsFemale(savedPreference === 'female');
      }
    } catch (error) {
      console.error('Error loading gender preference:', error);
    }
  };
  
  // Save gender preference
  const saveGenderPreference = async () => {
    try {
      await AsyncStorage.setItem('companionGender', isFemale ? 'female' : 'male');
    } catch (error) {
      console.error('Error saving gender preference:', error);
    }
  };
  
  // Format timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Modified sendMessageToGemini function with better error handling
  const sendMessageToGemini = async (message) => {
    try {
      console.log("Making API request");
      
      // Track API calls
      if (apiCallCounter >= MAX_API_CALLS) {
        console.log("API quota exceeded, using mock responses");
        setIsLoading(false);
        return generateMockResponse(message);
      }

      // Increment counter
      apiCallCounter++;
      
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: message
                }
              ]
            }
          ]
        })
      });
      
      const data = await response.json();
      
      if (response.status === 429) {
        console.log('API rate limit exceeded, using mock responses');
        setApiQuotaExceeded(true);
        return generateMockResponse(message);
      }
      
      if (data.error) {
        console.log('API error: ', data.error.message || 'Unknown API error');
        return generateMockResponse(message);
      }
      
      if (data.candidates && data.candidates[0]?.content?.parts && data.candidates[0].content.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        console.log('Unexpected API response format');
        return generateMockResponse(message);
      }
    } catch (error) {
      console.log('API request failed:', error.message || error);
      return generateMockResponse(message);
    }
  };
  
  // Enhanced mock response generator with more variety
  const generateMockResponse = (message) => {
    console.log('Generating mock response');
    const lowerMessage = message.toLowerCase();
    
    // If API quota is exceeded, show a special message the first time
    if (apiQuotaExceeded && Math.random() < 0.3) {
      return isFemale ?
        "I'm sorry, but I've reached my message limit for now. I'll still chat with you using my pre-programmed responses though! What else would you like to talk about?" :
        "Hey, looks like I've hit my message quota for now. I can still chat using my built-in responses though. What's on your mind?";
    }
    
    // Common responses that vary based on gender
    const femaleResponses = {
      greeting: [
        "Hey there! So nice to chat with you. How's your day been?",
        "Hi! I've been waiting to talk with you. What's on your mind?",
        "Hello! *smiles* Great to see you! How have you been feeling lately?"
      ],
      thanks: [
        "You're so welcome! I'm always here for you when you need me.",
        "Anytime! That's what I'm here for. *virtual hug*",
        "No problem at all! I'm happy when I can help you out."
      ],
      goodbye: [
        "Take care! I'll be thinking of you. Chat again soon?",
        "Bye for now! I'll miss our conversation. Come back soon!",
        "Until next time! I'll be here whenever you need someone to talk to."
      ],
      compliment: [
        "Aww, that's so sweet of you to say! You just made my day brighter.",
        "You know exactly how to make me smile! You're pretty amazing yourself.",
        "*blushes* Thank you! It means a lot coming from you."
      ],
      fallback: [
        "I'm really interested in hearing more about that. Can you tell me more?",
        "That's fascinating! What else is on your mind today?",
        "I'm here for you, whatever you want to talk about. *supportive smile*"
      ]
    };
    
    const maleResponses = {
      greeting: [
        "Hey! Good to see you. What's been happening?",
        "What's up? Been looking forward to chatting with you.",
        "Hey there! *nods* How's everything going for you?"
      ],
      thanks: [
        "No problem at all! That's what I'm here for.",
        "Anytime, seriously. I've got your back.",
        "You got it! Always happy to help out."
      ],
      goodbye: [
        "Later! I'll be here when you want to chat again.",
        "Take it easy! Come back anytime, alright?",
        "Catch you later! I'll be around whenever you need to talk."
      ],
      compliment: [
        "Hey, thanks! That's cool of you to say.",
        "I appreciate that! You're pretty awesome yourself.",
        "*grin* Thanks! Good to know I'm doing something right."
      ],
      fallback: [
        "That's interesting. Want to tell me more about it?",
        "I'm all ears. What else is on your mind?",
        "I'm here to listen, whatever's on your mind. *supportive nod*"
      ]
    };
    
    const responses = isFemale ? femaleResponses : maleResponses;
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
    } else if (lowerMessage.includes('thank')) {
      return responses.thanks[Math.floor(Math.random() * responses.thanks.length)];
    } else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return responses.goodbye[Math.floor(Math.random() * responses.goodbye.length)];
    } else if (lowerMessage.includes('love') || lowerMessage.includes('like you') || lowerMessage.includes('great') || lowerMessage.includes('awesome')) {
      return responses.compliment[Math.floor(Math.random() * responses.compliment.length)];
    } else if (lowerMessage.includes('help')) {
      if (isFemale) {
        return "I'm here to help and support you! We can chat about your day, your feelings, or I can try to cheer you up if you're feeling down. What would you like to talk about?";
      } else {
        return "I've got your back! We can talk about whatever's on your mind - your day, challenges you're facing, or just chat to take your mind off things. What's up?";
      }
    } else if (lowerMessage.includes('joke') || lowerMessage.includes('funny')) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "What's the best thing about Switzerland? I don't know, but their flag is a big plus!",
        "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them!",
        "Why did the scarecrow win an award? Because he was outstanding in his field!",
        "How do you organize a space party? You planet!"
      ];
      return jokes[Math.floor(Math.random() * jokes.length)] + " 😂";
    } else {
      return responses.fallback[Math.floor(Math.random() * responses.fallback.length)];
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (inputText.trim() === '') return;
    
    // Add user message to state
    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText(''); // Clear input
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    // Bounce the avatar
    startBounceAnimation();
    
    // Get response from Gemini
    const botResponse = await sendMessageToGemini(inputText);
    
    // Add bot response to state
    const botMessage = {
      id: Date.now().toString(),
      text: botResponse,
      sender: 'bot',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, botMessage]);
    
    // Bounce the avatar when the companion responds
    startBounceAnimation();
    
    // Scroll to bottom again
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  // Clear all messages
  const clearMessages = async () => {
    const initialMessage = {
      id: Date.now().toString(),
      text: isFemale ? 
        'Hey there! I\'m your personal companion. How\'s your day going?' : 
        'Sup! I\'m your personal companion. What\'s on your mind today?',
      sender: 'bot',
      timestamp: new Date()
    };
    
    setMessages([initialMessage]);
    
    try {
      await AsyncStorage.removeItem('geminiMessages');
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  };

  // Get companion color based on gender
  const getCompanionColor = () => {
    return isFemale 
      ? isDark ? '#FF5E94' : '#FF4081'  // Pink shades for female
      : isDark ? '#42A5F5' : '#2196F3'; // Blue shades for male
  };
  
  // Get gradients for various components
  const getHeaderGradient = () => {
    return isDark 
      ? isFemale ? ['#33091E', '#1A0A14'] : ['#0A1A33', '#0A1428']
      : isFemale ? ['#FFF5F8', '#FFF0F5'] : ['#F0F8FF', '#E6F4FF'];
  };
  
  const getBackgroundGradient = () => {
    return isDark
      ? isFemale ? ['#33091E', '#000000'] : ['#0A1A33', '#000000']
      : isFemale ? ['#FFF5F8', '#FFFFFF'] : ['#F0F8FF', '#FFFFFF'];
  };
  
  const getAvatarGradient = () => {
    return isFemale
      ? isDark ? ['#FF5E9466', '#FF408133'] : ['#FF5E9455', '#FF408122']
      : isDark ? ['#42A5F566', '#2196F333'] : ['#42A5F555', '#2196F322'];
  };
  
  const inputStyles = {
    backgroundColor: isDark 
      ? 'rgba(255,255,255,0.08)' 
      : 'rgba(0,0,0,0.04)',
    borderColor: getCompanionColor() + '55',
    color: colors.text
  };

  // Calculate rotation for the background effect
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={getBackgroundGradient()}
        style={styles.backgroundGradient}
      />
      
      {/* Header */}
      <LinearGradient
        colors={getHeaderGradient()}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons 
              name="account-heart" 
              size={26} 
              color={getCompanionColor()} 
              style={styles.headerIcon}
            />
            <Text style={[styles.headerTitle, { color: colors.text }]}>Companion</Text>
          </View>
          
          <View style={styles.genderSwitchContainer}>
            <View style={[
              styles.avatarOption, 
              !isFemale && {
                borderColor: getCompanionColor(), 
                borderWidth: 2,
                backgroundColor: getCompanionColor() + '22'
              }
            ]}>
              <Text style={styles.genderLabel}>👨</Text>
              <Text style={[styles.genderText, { color: colors.text }]}>Man</Text>
            </View>
            
            <Switch
              trackColor={{ false: '#42A5F5AA', true: '#FF4081AA' }}
              thumbColor={isFemale ? '#FF4081' : '#2196F3'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={setIsFemale}
              value={isFemale}
              style={styles.genderSwitch}
            />
            
            <View style={[
              styles.avatarOption, 
              isFemale && {
                borderColor: getCompanionColor(), 
                borderWidth: 2,
                backgroundColor: getCompanionColor() + '22'
              }
            ]}>
              <Text style={styles.genderLabel}>👩</Text>
              <Text style={[styles.genderText, { color: colors.text }]}>Woman</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={clearMessages} 
            style={[
              styles.clearButton, 
              {
                backgroundColor: getCompanionColor() + '22',
                borderColor: getCompanionColor() + '44',
                borderWidth: 1,
              }
            ]}
          >
            <Ionicons 
              name="trash-outline" 
              size={18} 
              color={getCompanionColor()} 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Chat area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Companion avatar */}
        <View style={styles.avatarContainer}>
          <Animated.View
            style={[
              styles.avatarBackgroundRotate,
              {
                transform: [{ rotate: spin }]
              }
            ]}
          >
            <LinearGradient
              colors={getAvatarGradient()}
              style={styles.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
          
          <Animated.View
            style={[
              styles.avatarBackground,
              {
                backgroundColor: getCompanionColor() + '15',
                transform: [
                  { scale: pulseAnim }
                ]
              }
            ]}
          />
          
          <Animated.Text 
            style={[
              styles.avatar,
              { transform: [{ translateY: bounceAnim }] }
            ]}
          >
            {isFemale ? '👩' : '👨'}
          </Animated.Text>
          
          <Text style={[
            styles.avatarName, 
            { 
              color: getCompanionColor(),
              textShadowColor: getCompanionColor() + '44',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4
            }
          ]}>
            {isFemale ? 'Woman' : 'Man'}
          </Text>
        </View>
        
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View 
              key={message.id}
              style={[
                styles.messageBubble,
                message.sender === 'user' ? 
                  [styles.userMessage, { 
                    backgroundColor: getCompanionColor(),
                    shadowColor: getCompanionColor(),
                  }] : 
                  [styles.botMessage, { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    borderColor: getCompanionColor() + '33',
                    borderWidth: 1,
                  }]
              ]}
            >
              <Text 
                style={[
                  styles.messageText,
                  { color: message.sender === 'user' ? '#fff' : colors.text }
                ]}
              >
                {message.text}
              </Text>
              <Text style={[
                styles.timestamp,
                { color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)' }
              ]}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          ))}
          
          {isLoading && (
            <View style={[
              styles.loadingContainer,
              {
                backgroundColor: getCompanionColor() + '15',
                borderColor: getCompanionColor() + '33',
                borderWidth: 1,
              }
            ]}>
              <ActivityIndicator size="small" color={getCompanionColor()} />
              <Text style={[
                styles.loadingText, 
                { 
                  color: getCompanionColor() 
                }
              ]}>
                Thinking...
              </Text>
            </View>
          )}
          
          {/* Add some padding at the bottom */}
          <View style={{ height: 20 }} />
        </ScrollView>
        
        {/* Quick response buttons */}
        <View style={styles.quickResponseWrapper}>
          <LinearGradient
            colors={isDark ? 
              ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'] : 
              ['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)']}
            style={styles.quickResponseGradient}
          />
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickResponseContainer}
            contentContainerStyle={styles.quickResponseContent}
          >
            <Pressable 
              style={[
                styles.quickResponseButton, 
                {
                  backgroundColor: getCompanionColor() + '15',
                  borderColor: getCompanionColor() + '55',
                  borderWidth: 1,
                }
              ]}
              onPress={() => setInputText("How are you today?")}
            >
              <Text style={[
                styles.quickResponseText, 
                {
                  color: getCompanionColor()
                }
              ]}>How are you?</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.quickResponseButton, 
                {
                  backgroundColor: getCompanionColor() + '15',
                  borderColor: getCompanionColor() + '55',
                  borderWidth: 1,
                }
              ]}
              onPress={() => setInputText("Tell me a joke")}
            >
              <Text style={[
                styles.quickResponseText, 
                {
                  color: getCompanionColor()
                }
              ]}>Tell me a joke</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.quickResponseButton, 
                {
                  backgroundColor: getCompanionColor() + '15',
                  borderColor: getCompanionColor() + '55',
                  borderWidth: 1,
                }
              ]}
              onPress={() => setInputText("I need some motivation")}
            >
              <Text style={[
                styles.quickResponseText, 
                {
                  color: getCompanionColor()
                }
              ]}>Motivate me</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.quickResponseButton, 
                {
                  backgroundColor: getCompanionColor() + '15',
                  borderColor: getCompanionColor() + '55',
                  borderWidth: 1,
                }
              ]}
              onPress={() => setInputText("I had a tough day")}
            >
              <Text style={[
                styles.quickResponseText, 
                {
                  color: getCompanionColor()
                }
              ]}>Tough day</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.quickResponseButton, 
                {
                  backgroundColor: getCompanionColor() + '15',
                  borderColor: getCompanionColor() + '55',
                  borderWidth: 1,
                }
              ]}
              onPress={() => setInputText("What do you think about me?")}
            >
              <Text style={[
                styles.quickResponseText, 
                {
                  color: getCompanionColor()
                }
              ]}>About me</Text>
            </Pressable>
          </ScrollView>
        </View>
        
        {/* Input area */}
        <LinearGradient
          colors={getHeaderGradient()}
          style={styles.inputGradient}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                inputStyles
              ]}
              placeholder="Type a message..."
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                { 
                  backgroundColor: inputText.trim() === '' ? 
                    (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') : 
                    getCompanionColor(),
                  shadowColor: getCompanionColor(),
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.4,
                  shadowRadius: 3,
                  elevation: 2,
                }
              ]}
              onPress={handleSendMessage}
              disabled={inputText.trim() === '' || isLoading}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 16,
  },
  avatarOption: {
    alignItems: 'center',
    padding: 5,
    borderRadius: 12,
  },
  genderLabel: {
    fontSize: 20,
  },
  genderText: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  genderSwitch: {
    marginHorizontal: 10,
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }]
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
    position: 'relative',
  },
  avatarBackgroundRotate: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -8,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarBackground: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    zIndex: 1,
  },
  avatar: {
    fontSize: 60,
    marginBottom: 5,
    zIndex: 2,
  },
  avatarName: {
    fontSize: 16,
    marginTop: 5,
    zIndex: 2,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  messagesContent: {
    paddingTop: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 10,
    margin: 10,
    borderRadius: 15,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  quickResponseWrapper: {
    position: 'relative',
    paddingBottom: 10,
  },
  quickResponseGradient: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    height: 30,
  },
  quickResponseContainer: {
    maxHeight: 50,
    marginHorizontal: 10,
  },
  quickResponseContent: {
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  quickResponseButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 10,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  quickResponseText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputGradient: {
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 45,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingRight: 50,
    fontSize: 15,
  },
  sendButton: {
    position: 'absolute',
    right: 22,
    bottom: Platform.OS === 'ios' ? 17 : 17,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
