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
  SafeAreaView
} from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Gemini API key
const API_KEY = 'AIzaSyAWOvNRyxSK94LWXzOTdL3wmf4Uv8ERMDk';
const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent';

export default function CompanionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  
  const [messages, setMessages] = useState([
    { 
      id: '1', 
      text: 'Hi there! I\'m your AI companion. How can I help you today?', 
      sender: 'bot',
      timestamp: new Date() 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);
  
  // Load messages from storage on mount
  useEffect(() => {
    loadMessages();
  }, []);
  
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
  
  // Format timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Send message to Gemini API
  const sendMessageToGemini = async (message) => {
    try {
      setIsLoading(true);
      console.log('Making API request');
      
      const requestBody = {
        contents: [
          {
            parts: [
              { text: message }
            ]
          }
        ]
      };
      
      console.log('Request body:', JSON.stringify(requestBody));
      
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      // Log full response for debugging
      console.log('API response status:', response.status);
      console.log('API response:', JSON.stringify(data));
      
      if (data.error) {
        console.log('API error:', data.error.message || 'Unknown error');
        return generateMockResponse(message);
      }
      
      if (data.candidates && data.candidates[0]?.content?.parts && data.candidates[0].content.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        console.log('Unexpected API response format:', JSON.stringify(data));
        return generateMockResponse(message);
      }
    } catch (error) {
      console.log('API request failed:', error.message || error);
      return generateMockResponse(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate a mock response in case the API fails
  const generateMockResponse = (message) => {
    console.log('Generating mock response');
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm your AI companion. How can I assist you today?";
    } else if (lowerMessage.includes('how are you')) {
      return "I'm just a program, but thanks for asking! I'm here to help you.";
    } else if (lowerMessage.includes('help')) {
      return "I can chat with you, answer questions, or just be a friendly companion. What's on your mind?";
    } else if (lowerMessage.includes('thank')) {
      return "You're welcome! I'm glad I could help.";
    } else if (lowerMessage.includes('bye')) {
      return "Goodbye! Feel free to chat again anytime.";
    } else {
      const responses = [
        "That's interesting. Tell me more about that.",
        "I'm here to listen and chat. What else is on your mind?",
        "I'm still learning, but I'm doing my best to be helpful!",
        "Thanks for sharing that with me. How are you feeling today?",
        "I appreciate our conversation. Is there anything specific you'd like to talk about?",
        "I'm here to support you. What can I do to help?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
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
    
    // Scroll to bottom again
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  // Clear all messages
  const clearMessages = async () => {
    const initialMessage = {
      id: Date.now().toString(),
      text: 'Hi there! I\'m your AI companion. How can I help you today?',
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
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Companion</Text>
        <TouchableOpacity onPress={clearMessages} style={styles.clearButton}>
          <Ionicons 
            name="trash-outline" 
            size={20} 
            color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Chat area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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
                  [styles.userMessage, { backgroundColor: colors.primary }] : 
                  [styles.botMessage, { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' 
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
              <Text style={styles.timestamp}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          ))}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Thinking...
              </Text>
            </View>
          )}
          
          {/* Add some padding at the bottom */}
          <View style={{ height: 15 }} />
        </ScrollView>
        
        {/* Input area */}
        <View style={[
          styles.inputContainer, 
          { 
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
          }
        ]}>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: colors.text 
              }
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
                  colors.primary 
              }
            ]}
            onPress={handleSendMessage}
            disabled={inputText.trim() === '' || isLoading}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  chatContainer: {
    flex: 1,
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
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  botMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.4)',
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
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingRight: 45,
  },
  sendButton: {
    position: 'absolute',
    right: 22,
    bottom: Platform.OS === 'ios' ? 15 : 15,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
