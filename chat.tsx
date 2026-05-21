import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Send,
  Bot,
  User,
  Brain,
  Lightbulb,
  BookOpen,
  Target,
  HelpCircle,
  Zap,
  Camera,
  ImageIcon,
  X,
} from 'lucide-react-native';
import { useStudyScope } from '@/contexts/StudyScopeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRorkAgent, createRorkTool } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

interface QuickPrompt {
  id: string;
  text: string;
  icon: React.ElementType;
  color: string;
}

interface AttachedImage {
  uri: string;
  mimeType: string;
}

export default function ChatScreen() {
  const { user, assessment } = useStudyScope();
  const { colors } = useTheme();
  const [input, setInput] = useState('');
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const hasResults = !!assessment;
  const learningProfile = assessment?.learningProfile;
  const screeningResult = learningProfile?.screeningResult;

  const buildSystemContext = useCallback(() => {
    let context = `You are StudyScope AI, a friendly and knowledgeable learning assistant. You help students understand their learning styles, study more effectively, and overcome learning challenges. Be encouraging, supportive, and provide actionable advice.`;

    if (user) {
      context += `\n\nStudent Profile:`;
      context += `\n- Name: ${user.name}`;
      if (user.age) context += `\n- Age: ${user.age} years old`;
      if (user.grade) context += `\n- Grade: ${user.grade}`;
      if (user.school) context += `\n- School: ${user.school}`;
      if (user.city && user.state) context += `\n- Location: ${user.city}, ${user.state}`;
    }

    if (hasResults && learningProfile) {
      context += `\n\nLearning Assessment Results:`;
      
      if (learningProfile.preferredStyles && learningProfile.preferredStyles.length > 0) {
        const topStyle = learningProfile.preferredStyles[0];
        context += `\n- Primary Learning Style: ${topStyle.style} (${topStyle.percentage}%)`;
        context += `\n- All Styles: ${learningProfile.preferredStyles.map(s => `${s.style}: ${s.percentage}%`).join(', ')}`;
      }

      if (learningProfile.strengthZones && learningProfile.strengthZones.length > 0) {
        context += `\n- Strengths: ${learningProfile.strengthZones.map(s => s.title).join(', ')}`;
      }

      if (learningProfile.frictionZones && learningProfile.frictionZones.length > 0) {
        context += `\n- Areas Needing Support: ${learningProfile.frictionZones.map(f => f.title).join(', ')}`;
      }

      if (screeningResult) {
        if (screeningResult.hasIndicators) {
          const significantConditions = screeningResult.conditions
            .filter(c => c.severity === 'significant' || c.severity === 'moderate')
            .map(c => `${c.condition.replace(/_/g, ' ')} (${c.severity})`);
          
          if (significantConditions.length > 0) {
            context += `\n- Learning Difference Indicators: ${significantConditions.join(', ')}`;
          }
          context += `\n- Cognitive Strengths: ${screeningResult.strengths.join(', ')}`;
        } else {
          context += `\n- No significant learning difference indicators detected`;
          context += `\n- Well-balanced cognitive profile`;
        }
      }

      context += `\n\nIMPORTANT: Use this personalized information to provide 100% tailored advice. Reference their specific learning style, strengths, and any challenges when giving recommendations. Make every response feel custom-made for this student.`;
    } else {
      context += `\n\nNote: This student hasn't completed their learning assessment yet. Provide general but detailed advice about learning strategies, study techniques, and educational topics. Encourage them to complete the assessment for personalized insights.`;
    }

    return context;
  }, [user, hasResults, learningProfile, screeningResult]);

  const systemContext = buildSystemContext();

  const { messages, sendMessage, status } = useRorkAgent({
    tools: {
      getStudyTip: createRorkTool({
        description: "Get a personalized study tip based on the student's learning style",
        zodSchema: z.object({
          topic: z.string().describe("The subject or topic for the study tip"),
          learningStyle: z.enum(['visual', 'auditory', 'kinesthetic']).optional(),
        }),
        execute(input) {
          const style = input.learningStyle || learningProfile?.preferredStyles[0]?.style || 'visual';
          const tips: Record<string, string[]> = {
            visual: [
              `For ${input.topic}: Create colorful mind maps and diagrams`,
              `For ${input.topic}: Use highlighters and color-coded notes`,
              `For ${input.topic}: Watch educational videos and visualizations`,
            ],
            auditory: [
              `For ${input.topic}: Record yourself explaining concepts and listen back`,
              `For ${input.topic}: Join study groups for discussions`,
              `For ${input.topic}: Use podcasts and audiobooks as supplements`,
            ],
            kinesthetic: [
              `For ${input.topic}: Create hands-on projects or models`,
              `For ${input.topic}: Take frequent movement breaks while studying`,
              `For ${input.topic}: Use role-playing or simulations to understand concepts`,
            ],
          };
          return tips[style][Math.floor(Math.random() * tips[style].length)];
        },
      }),
    },
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const quickPrompts: QuickPrompt[] = hasResults
    ? [
        { id: '1', text: 'How can I use my learning style better?', icon: Brain, color: colors.primary },
        { id: '2', text: 'Give me study tips for my strengths', icon: Target, color: colors.success },
        { id: '3', text: 'How do I improve my weak areas?', icon: Lightbulb, color: colors.warning },
        { id: '4', text: 'Create a study plan for me', icon: BookOpen, color: colors.accent },
      ]
    : [
        { id: '1', text: 'What are different learning styles?', icon: Brain, color: colors.primary },
        { id: '2', text: 'How can I study more effectively?', icon: BookOpen, color: colors.success },
        { id: '3', text: 'Tips for staying focused', icon: Target, color: colors.warning },
        { id: '4', text: 'How do I remember things better?', icon: Lightbulb, color: colors.accent },
      ];

  const pickImage = useCallback(async (useCamera: boolean) => {
    try {
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission needed', 'Please allow access to continue');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            base64: true,
            allowsMultipleSelection: true,
            selectionLimit: 3,
          });

      if (!result.canceled && result.assets) {
        const newImages: AttachedImage[] = result.assets
          .filter(asset => asset.base64)
          .map(asset => ({
            uri: `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`,
            mimeType: asset.mimeType || 'image/jpeg',
          }));
        setAttachedImages(prev => [...prev, ...newImages].slice(0, 3));
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, []);

  const removeAttachedImage = useCallback((index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = useCallback(() => {
    if ((input.trim() || attachedImages.length > 0) && status !== 'streaming') {
      const textContent = input.trim() || 'Please analyze this image and provide insights about my learning patterns or any observations you can make.';
      const messageWithContext = messages.length === 0
        ? `[System Context: ${systemContext}]\n\nUser: ${textContent}`
        : textContent;

      if (attachedImages.length > 0) {
        const files = attachedImages.map(img => ({
          type: 'file' as const,
          mediaType: img.mimeType,
          url: img.uri,
        }));
        sendMessage({ text: messageWithContext, files });
      } else {
        sendMessage(messageWithContext);
      }
      
      setInput('');
      setAttachedImages([]);
    }
  }, [input, attachedImages, sendMessage, status, messages.length, systemContext]);

  const handleQuickPrompt = useCallback((prompt: string) => {
    if (status !== 'streaming') {
      const messageWithContext = messages.length === 0 
        ? `[System Context: ${systemContext}]\n\nUser: ${prompt}`
        : prompt;
      sendMessage(messageWithContext);
    }
  }, [sendMessage, status, messages.length, systemContext]);

  const isLoading = status === 'streaming';

  const renderMessage = ({ item }: { item: typeof messages[0] }) => {
    const isUser = item.role === 'user';
    
    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
          { opacity: fadeAnim },
        ]}
      >
        {!isUser && (
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
            <Bot color={colors.primary} size={18} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser
              ? [styles.userBubble, { backgroundColor: colors.primary }]
              : [styles.assistantBubble, { backgroundColor: colors.surface, borderColor: colors.border }],
          ]}
        >
          {item.parts.map((part, i) => {
            if (part.type === 'text') {
              return (
                <Text
                  key={`${item.id}-${i}`}
                  style={[
                    styles.messageText,
                    isUser ? styles.userText : { color: colors.text },
                  ]}
                >
                  {part.text}
                </Text>
              );
            }
            if (part.type === 'tool') {
              if (part.state === 'output-available') {
                return (
                  <View key={`${item.id}-${i}`} style={[styles.toolResult, { backgroundColor: colors.primaryLight + '15' }]}>
                    <Zap color={colors.primary} size={14} />
                    <Text style={[styles.toolResultText, { color: colors.text }]}>
                      {typeof part.output === 'string' ? part.output : JSON.stringify(part.output)}
                    </Text>
                  </View>
                );
              }
              return null;
            }
            return null;
          })}
        </View>
        {isUser && (
          <View style={[styles.avatarContainer, { backgroundColor: colors.accent + '20' }]}>
            <User color={colors.accent} size={18} />
          </View>
        )}
      </Animated.View>
    );
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
<View style={styles.headerIcon}>
            <Bot color="#fff" size={24} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>StudyScope AI</Text>
            <Text style={styles.headerSubtitle}>
              {hasResults ? 'Personalized to your learning profile' : 'Your learning assistant'}
            </Text>
          </View>
        </View>
        {hasResults && learningProfile?.preferredStyles[0] && (
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>
              {learningProfile.preferredStyles[0].style.charAt(0).toUpperCase() + 
               learningProfile.preferredStyles[0].style.slice(1)} Learner
            </Text>
          </View>
        )}
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight + '20' }]}>
              <HelpCircle color={colors.primary} size={48} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {hasResults ? 'Ask Me Anything!' : 'How Can I Help?'}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              {hasResults
                ? "I know your learning style and strengths. Ask me for personalized study tips, strategies, or help with any subject!"
                : "Ask me about learning strategies, study tips, or how to improve your grades. Complete the assessment for personalized advice!"}
            </Text>
            
            <View style={styles.quickPromptsContainer}>
              <Text style={[styles.quickPromptsTitle, { color: colors.textMuted }]}>
                Quick Questions
              </Text>
              <View style={styles.quickPromptsGrid}>
                {quickPrompts.map((prompt) => (
                  <TouchableOpacity
                    key={prompt.id}
                    style={[styles.quickPromptButton, { backgroundColor: prompt.color + '12', borderColor: prompt.color + '30' }]}
                    onPress={() => handleQuickPrompt(prompt.text)}
                    activeOpacity={0.7}
                  >
                    <prompt.icon color={prompt.color} size={18} />
                    <Text style={[styles.quickPromptText, { color: colors.text }]} numberOfLines={2}>
                      {prompt.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {isLoading && (
          <View style={[styles.typingIndicator, { backgroundColor: colors.surface }]}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
              <Bot color={colors.primary} size={18} />
            </View>
            <View style={styles.typingDots}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                Thinking...
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {attachedImages.length > 0 && (
            <View style={styles.attachedImagesContainer}>
              {attachedImages.map((img, index) => (
                <View key={index} style={styles.attachedImageWrapper}>
                  <Image
                    source={{ uri: img.uri }}
                    style={styles.attachedImage}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                    onPress={() => removeAttachedImage(index)}
                  >
                    <X color="#fff" size={12} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={[styles.mediaButton, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => pickImage(false)}
              disabled={isLoading || attachedImages.length >= 3}
              activeOpacity={0.7}
            >
              <ImageIcon
                color={attachedImages.length >= 3 ? colors.textMuted : colors.primary}
                size={20}
              />
            </TouchableOpacity>
            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={[styles.mediaButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => pickImage(true)}
                disabled={isLoading || attachedImages.length >= 3}
                activeOpacity={0.7}
              >
                <Camera
                  color={attachedImages.length >= 3 ? colors.textMuted : colors.primary}
                  size={20}
                />
              </TouchableOpacity>
            )}
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surfaceSecondary, color: colors.text }]}
              value={input}
              onChangeText={setInput}
              placeholder={attachedImages.length > 0 ? "Add a message or send..." : "Ask me anything about learning..."}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={1000}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: (input.trim() || attachedImages.length > 0) && !isLoading ? colors.primary : colors.surfaceSecondary },
              ]}
              onPress={handleSend}
              disabled={(!input.trim() && attachedImages.length === 0) || isLoading}
              activeOpacity={0.7}
            >
              <Send
                color={(input.trim() || attachedImages.length > 0) && !isLoading ? '#fff' : colors.textMuted}
                size={20}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/contexts/ThemeContext').useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  profileBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  chatContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  quickPromptsContainer: {
    width: '100%',
  },
  quickPromptsTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  quickPromptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  quickPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: '48%',
  },
  quickPromptText: {
    fontSize: 13,
    fontWeight: '500' as const,
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 8,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  toolResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
  },
  toolResultText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 13,
  },
  inputWrapper: {
    borderTopWidth: 1,
  },
  attachedImagesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },
  attachedImageWrapper: {
    position: 'relative',
  },
  attachedImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
  },
  mediaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
