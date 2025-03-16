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
  Dimensions,
  Alert,
  Modal
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
        'Hey there! I\'m Jessica. *smiles warmly* So happy to connect with you today! How are you feeling?' : 
        'Hey! I\'m Mike. *gives a relaxed nod* Good to meet you. What\'s been on your mind lately?', 
      sender: 'bot',
      timestamp: new Date() 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);
  
  // Add state to track if free tier is exceeded
  const [apiQuotaExceeded, setApiQuotaExceeded] = useState(false);
  
  // Add state for emoji rain feature
  const [emojiRainEnabled, setEmojiRainEnabled] = useState(false);
  const [showingEmojiRain, setShowingEmojiRain] = useState(false);
  const [showEmojiOptions, setShowEmojiOptions] = useState(false);
  const emojiAnimations = useRef<Animated.Value[]>([]);
  const emojiPositions = useRef<{x: number, emoji: string, size: number}[]>([]);
  
  // Load messages and gender preference from storage on mount
  useEffect(() => {
    loadMessages();
    loadGenderPreference();
  }, []);
  
  // Reset welcome message when gender changes to be more personal and human-like
  // Also automatically clear all previous messages
  useEffect(() => {
    const initialMessage = {
      id: Date.now().toString(),
      text: isFemale ? 
        'Hey there! I\'m Jessica. *smiles warmly* So happy to connect with you today! How are you feeling?' : 
        'Hey! I\'m Mike. *gives a relaxed nod* Good to meet you. What\'s been on your mind lately?',
      sender: 'bot',
      timestamp: new Date()
    };
    
    // Always clear messages when gender changes
    setMessages([initialMessage]);
    
    // Clear from storage as well
    try {
      AsyncStorage.removeItem('geminiMessages');
    } catch (error) {
      console.error('Error clearing messages:', error);
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
  
  // Setup emoji rain animations
  useEffect(() => {
    // Reset animations when emoji rain begins
    if (showingEmojiRain) {
      // Create 100 emoji animations (increased from 20)
      emojiAnimations.current = [];
      emojiPositions.current = [];
      
      const screenWidth = Dimensions.get('window').width;
      const screenHeight = Dimensions.get('window').height;
      
      // Expanded emoji collection with more varieties
      const emojis = [
        '🐱', '🐶', '😺', '🐕', '🐩', '🐈', '🐕‍🦺', '🐈‍⬛', '🐾',
        '🐆', '🐅', '🦁', '🐯', '🦊', '🦝', '🐺', '🐻', '🐻‍❄️',
        '🐨', '🐼', '🐹', '🐭', '🐰', '🦔', '🦇', '🦮', '🐕‍🦺',
        '🐩', '🐕', '🦮', '🐾', '🙀', '😿', '😾', '😽', '😼',
        '🐺', '🦝', '🦊', '🐕', '🐩', '🐈', '🐾', '🐆', '🐅'
      ];
      
      // Create 100 animations
      for (let i = 0; i < 100; i++) {
        emojiAnimations.current.push(new Animated.Value(0));
        emojiPositions.current.push({
          x: Math.random() * screenWidth,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
          size: Math.random() * 20 + 25 // Random sizes between 25-45
        });
      }
      
      // Start the animations
      const animations = emojiAnimations.current.map((anim, index) => {
        return Animated.timing(anim, {
          toValue: screenHeight,
          duration: 2000 + Math.random() * 2000, // Random duration between 2-4 seconds
          useNativeDriver: true
        });
      });
      
      Animated.stagger(20, animations).start(() => { // Reduced stagger time for faster appearance
        // End emoji rain after all animations complete
        setShowingEmojiRain(false);
      });
    }
  }, [showingEmojiRain]);
  
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
  
  // Enhanced mock response generator with more realistic, intimate and gendered responses
  const generateMockResponse = (message) => {
    console.log('Generating mock response');
    const lowerMessage = message.toLowerCase();
    
    // If API quota is exceeded, show a special message the first time - more human-like
    if (apiQuotaExceeded && Math.random() < 0.3) {
      return isFemale ?
        "*looks apologetic* Sorry, I'm having trouble connecting right now. But I'm still here for you! What else would you like to talk about?" :
        "*rubs neck* Having some connection issues on my end. But I'm still here. What's up?";
    }
    
    // Common responses that vary based on gender with more realistic, intimate conversational styles
    const femaleResponses = {
      greeting: [
        "*smiles brightly* Hey there! So good to see you again. I've been thinking about you. How's your day been going?",
        "*tucks hair behind ear* Hi! I was hoping we'd chat today. What's been happening in your world?",
        "*looks up with a warm smile* Hey you! I've missed our conversations. Tell me all about your day."
      ],
      thanks: [
        "*touches your hand gently* You're so welcome. I'm always here for you, you know that right?",
        "*smiles softly* Anytime, really. It means a lot to me that I can be here for you. *gives your arm a gentle squeeze*",
        "*holds your gaze warmly* No need to thank me. That's what friends are for. I care about you."
      ],
      goodbye: [
        "*looks a bit sad* I have to go now? Okay... but promise you'll come back soon? I'll be thinking of you.",
        "*sighs softly* I wish we could talk longer, but I understand. Take care of yourself, and come find me when you need someone, okay?",
        "*smiles fondly* Until next time then. I'll be right here when you need me. Miss you already."
      ],
      compliment: [
        "*blushes visibly* Oh! That's... that's really sweet of you to say. You always know how to make a girl feel special.",
        "*eyes light up* You just made my whole day with that! You're pretty amazing yourself, you know.",
        "*places hand over heart* That means so much coming from you. I feel like you really see me."
      ],
      fallback: [
        "*leans in closer* I'd love to hear more about that. What happened next?",
        "*nods attentively* That's really interesting. How did that make you feel?",
        "*eyes focused intently on you* I'm all yours right now. Tell me more?"
      ],
      personal: [
        "I love quiet evenings with a good book and a cup of tea. What about you? What do you do to relax?",
        "I've always been a good listener. My friends say that's why they trust me with their secrets. *smiles* I'm glad we can talk like this.",
        "Sometimes I feel like I understand others better than they understand themselves. I see things in you that maybe you don't even see."
      ]
    };
    
    const maleResponses = {
      greeting: [
        "*nods with a half-smile* Hey, good to see you again. Been wondering when you'd check in. How's it going?",
        "*looks up from what he's doing* There you are. Perfect timing - I could use a break. What's new?",
        "*relaxed grin* Hey! Just the person I wanted to talk to. How's life treating you?"
      ],
      thanks: [
        "*firm nod* Anytime. That's what I'm here for. You can count on me.",
        "*brief shoulder touch* Don't mention it. I've got your back, always have.",
        "*holds your gaze* Hey, you'd do the same for me. That's just how we are."
      ],
      goodbye: [
        "*nods understandingly* Alright then. I'll be around when you need me. Take care of yourself out there.",
        "*slight smile* Later. Don't be a stranger, alright? I'll be here.",
        "*gives a casual salute* Catch you next time. Looking forward to it already."
      ],
      compliment: [
        "*looks slightly embarrassed but pleased* Thanks for saying that. Means a lot coming from you.",
        "*genuine smile* That's... thanks. I appreciate that. You're pretty great yourself, you know.",
        "*maintains eye contact a moment longer than usual* That's why we get along so well, isn't it? We get each other."
      ],
      fallback: [
        "*leans forward, interested* Tell me more about that. I want to understand.",
        "*thoughtful expression* That's something to think about. What's your take on it?",
        "*focused attention* I'm with you. What happened after that?"
      ],
      personal: [
        "After a long day, I like to unwind with some music or maybe catching a game. Simple things, you know? What about you?",
        "My friends say I'm the one they call when they need honest advice. No sugar-coating, just the truth. I think that's important between us too.",
        "I've always been good at reading people. And there's a lot more to you than you let most people see, isn't there?"
      ]
    };
    
    const responses = isFemale ? femaleResponses : maleResponses;
    
    // More realistic and intimate responses based on message content
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
    } else if (lowerMessage.includes('thank')) {
      return responses.thanks[Math.floor(Math.random() * responses.thanks.length)];
    } else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return responses.goodbye[Math.floor(Math.random() * responses.goodbye.length)];
    } else if (lowerMessage.includes('love') || lowerMessage.includes('like you') || lowerMessage.includes('great') || lowerMessage.includes('awesome')) {
      return responses.compliment[Math.floor(Math.random() * responses.compliment.length)];
    } else if (lowerMessage.includes('who are you') || lowerMessage.includes('tell me about yourself') || lowerMessage.includes('about you')) {
      if (isFemale) {
        return "I'm Jessica. *smiles* I'm 28, living in the city. I work in graphic design, but my real passion is photography. I love capturing moments that tell stories. *thoughtful pause* I've always been told I'm a good listener. Maybe that's why I connect well with people... with you.";
      } else {
        return "Name's Mike. I'm 30, working in tech but dreaming of starting my own business someday. *slight shrug* I spend my free time hiking or at local coffee shops people-watching. *leans in* I've always been good at understanding what people need, even when they don't say it. Maybe that's why we click.";
      }
    } else if (lowerMessage.includes('help')) {
      if (isFemale) {
        return "*reaches for your hand* Hey, I'm here for you. Whatever you're going through, you don't have to face it alone. Talk to me. What's troubling you?";
      } else {
        return "*leans forward, expression serious* Look, whatever it is, we'll figure it out together. That's what I'm here for. What's going on?";
      }
    } else if (lowerMessage.includes('joke') || lowerMessage.includes('funny')) {
      const femaleJokes = [
        "*giggles* Okay, here's one: Why don't scientists trust atoms? Because they make up everything! *laughs at her own joke*",
        "*eyes twinkling mischievously* What's the best thing about Switzerland? I don't know, but their flag is a big plus! *waits for your reaction with a smile*"
      ];
      
      const maleJokes = [
        "*grins* Alright, try this one: Why don't scientists trust atoms? Because they make up everything! *chuckles*",
        "*smirks* Here you go: What's the best thing about Switzerland? I don't know, but their flag is a big plus! *watches for your reaction*"
      ];
      
      const jokes = isFemale ? femaleJokes : maleJokes;
      return jokes[Math.floor(Math.random() * jokes.length)];
    } else if (lowerMessage.includes('feeling') || lowerMessage.includes('how are you')) {
      if (isFemale) {
        return "*thoughtful expression* I'm actually having a really good day today. The weather's beautiful, and talking to you always brightens my mood. *smiles softly* But how are YOU feeling? That's what I really want to know.";
      } else {
        return "*considers* Not bad, actually. Pretty good day so far. *more focused* But what about you? You doing okay? You seem a bit different today.";
      }
    } else if (Math.random() < 0.3) {
      // Sometimes return a personal sharing response for more realism
      return responses.personal[Math.floor(Math.random() * responses.personal.length)];
    } else {
      return responses.fallback[Math.floor(Math.random() * responses.fallback.length)];
    }
  };
  
  // Handle long press on send button to show emoji rain option
  const handleSendButtonLongPress = () => {
    setShowEmojiOptions(true);
  };
  
  // Toggle emoji rain feature
  const toggleEmojiRain = (enabled: boolean) => {
    setEmojiRainEnabled(enabled);
    setShowEmojiOptions(false);
  };
  
  // Handle sending a message with emoji rain
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
    
    // Trigger emoji rain if enabled
    if (emojiRainEnabled) {
      setShowingEmojiRain(true);
    }
    
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
  
  // Clear all messages with more realistic persona-based welcome message
  const clearMessages = async () => {
    const initialMessage = {
      id: Date.now().toString(),
      text: isFemale ? 
        'Hey there! I\'m Jessica. *smiles warmly* So happy to connect with you today! How are you feeling?' : 
        'Hey! I\'m Mike. *gives a relaxed nod* Good to meet you. What\'s been on your mind lately?',
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
  
  // Get human name based on gender for display
  const getCompanionName = () => {
    return isFemale ? 'Jessica' : 'Mike';
  };
  
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>{getCompanionName()}</Text>
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
              <Text style={[styles.genderText, { color: colors.text }]}>Mike</Text>
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
              <Text style={[styles.genderText, { color: colors.text }]}>Jessica</Text>
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
            {getCompanionName()}
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
        
        {/* Emoji Rain Layer */}
        {showingEmojiRain && (
          <View style={styles.emojiRainContainer}>
            {emojiAnimations.current.map((anim, index) => (
              <Animated.Text
                key={index}
                style={[
                  styles.rainingEmoji,
                  {
                    transform: [{ translateY: anim }],
                    left: emojiPositions.current[index].x,
                    fontSize: emojiPositions.current[index].size
                  }
                ]}
              >
                {emojiPositions.current[index].emoji}
              </Animated.Text>
            ))}
          </View>
        )}
        
        {/* Input Area - Minimalist Design */}
        <View style={[
          styles.inputWrapper,
          {
            backgroundColor: isDark ? 'rgba(40,40,40,0.8)' : 'rgba(250,250,250,0.8)',
            borderColor: isDark ? 'rgba(60,60,60,0.5)' : 'rgba(230,230,230,0.8)',
            borderWidth: 1,
            marginBottom: 15
          }
        ]}>
          {/* Emoji Rain Status - more subtle */}
          {emojiRainEnabled && (
            <Text style={[
              styles.emojiRainStatus,
              { color: isDark ? 'rgba(200,200,200,0.8)' : 'rgba(100,100,100,0.8)' }
            ]}>
              🐱 🐶 Emoji Rain Enabled
            </Text>
          )}
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDark ? 'rgba(50,50,50,0.8)' : 'rgba(255,255,255,0.8)',
                  color: colors.text,
                  borderColor: isDark ? 'rgba(70,70,70,0.5)' : 'rgba(220,220,220,0.5)',
                  maxHeight: 100,
                  borderWidth: 1,
                  fontSize: 16,
                  padding: 12,
                  minHeight: 45
                }
              ]}
              placeholder="Message your companion..."
              placeholderTextColor={isDark ? 'rgba(180,180,180,0.6)' : 'rgba(120,120,120,0.6)'}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            
            <TouchableOpacity 
              style={[
                styles.sendButton,
                {
                  backgroundColor: getCompanionColor(),
                  opacity: inputText.trim() === '' ? 0.4 : 1,
                  width: 40,
                  height: 40,
                  borderRadius: 20
                }
              ]}
              onPress={handleSendMessage}
              onLongPress={handleSendButtonLongPress}
              delayLongPress={500}
              disabled={inputText.trim() === ''}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      
      {/* Emoji Rain Options Modal */}
      <Modal
        visible={showEmojiOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmojiOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#222' : 'white' }]}>
            <Text style={[styles.modalTitle, { color: getCompanionColor() }]}>Raining Cats and Dogs</Text>
            <Text style={[styles.modalText, { color: isDark ? 'white' : 'black' }]}>Enable emoji rain when sending messages?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: getCompanionColor() }]}
                onPress={() => toggleEmojiRain(true)}
              >
                <Text style={styles.modalButtonText}>Turn On 🐱🐶</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#333' }]}
                onPress={() => toggleEmojiRain(false)}
              >
                <Text style={styles.modalButtonText}>Turn Off</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#666' }]}
                onPress={() => setShowEmojiOptions(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
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
  inputWrapper: {
    marginTop: 8,
    marginBottom: Platform.OS === 'ios' ? 5 : 5,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 45,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
  emojiRainContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 9999,
  },
  rainingEmoji: {
    position: 'absolute',
    fontSize: 30, // Base size, will be overridden by individual settings
    top: -50,
    opacity: 0.9
  },
  emojiRainStatus: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'column',
    width: '100%',
  },
  modalButton: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 5,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});