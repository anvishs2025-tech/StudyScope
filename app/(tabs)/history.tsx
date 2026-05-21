import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  History,
  MessageCircle,
  FileText,
  Lock,
  Crown,
  Trash2,
  ChevronRight,
  Calendar,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription, ChatSession } from '@/contexts/SubscriptionContext';

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { canAccessHistory, chatHistory, deleteChatSession } = useSubscription();
  const [activeTab, setActiveTab] = useState<'chats' | 'results'>('chats');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleUpgrade = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/subscription/select-plan' as any);
  }, [router]);

  const handleDeleteChat = useCallback((sessionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteChatSession(sessionId),
        },
      ]
    );
  }, [deleteChatSession]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const styles = createStyles(colors);

  const mockChats: ChatSession[] = [
    {
      id: '1',
      title: 'Study tips for math exam',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Help with essay structure',
      messages: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      title: 'Science project ideas',
      messages: [],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  const mockResults = [
    {
      id: '1',
      title: 'Initial Assessment',
      date: new Date(Date.now() - 604800000).toISOString(),
      summary: 'Visual learner with strong analytical skills',
    },
    {
      id: '2',
      title: 'Progress Check',
      date: new Date(Date.now() - 172800000).toISOString(),
      summary: 'Improved focus duration by 20%',
    },
  ];

  const displayChats = chatHistory.length > 0 ? chatHistory : mockChats;

  if (!canAccessHistory) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.lockedContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.lockedContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.lockedIconContainer}>
              <Lock color={colors.textMuted} size={48} />
            </View>
            <Text style={styles.lockedTitle}>History Locked</Text>
            <Text style={styles.lockedDescription}>
              Upgrade to a paid plan to access your full conversation history
              and assessment results over time.
            </Text>

            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>What you'll get:</Text>
              <View style={styles.previewItem}>
                <View style={[styles.previewIcon, { backgroundColor: colors.primary + '20' }]}>
                  <MessageCircle color={colors.primary} size={24} />
                </View>
                <View style={styles.previewText}>
                  <Text style={styles.previewItemTitle}>Chat History</Text>
                  <Text style={styles.previewItemDesc}>
                    Access all your past conversations with the AI tutor
                  </Text>
                </View>
              </View>
              <View style={styles.previewItem}>
                <View style={[styles.previewIcon, { backgroundColor: colors.success + '20' }]}>
                  <FileText color={colors.success} size={24} />
                </View>
                <View style={styles.previewText}>
                  <Text style={styles.previewItemTitle}>Assessment Results</Text>
                  <Text style={styles.previewItemDesc}>
                    Track your learning progress over time
                  </Text>
                </View>
              </View>
              <View style={styles.previewItem}>
                <View style={[styles.previewIcon, { backgroundColor: colors.warning + '20' }]}>
                  <Clock color={colors.warning} size={24} />
                </View>
                <View style={styles.previewText}>
                  <Text style={styles.previewItemTitle}>Timeline View</Text>
                  <Text style={styles.previewItemDesc}>
                    See your complete learning journey
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              activeOpacity={0.8}
            >
              <Crown color="#fff" size={20} />
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <History color="#fff" size={32} />
              <Text style={styles.headerTitle}>Your History</Text>
              <Text style={styles.headerSubtitle}>
                Past conversations and assessment results
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'chats' && styles.tabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('chats');
              }}
            >
              <MessageCircle
                color={activeTab === 'chats' ? '#fff' : colors.textSecondary}
                size={18}
              />
              <Text style={[styles.tabText, activeTab === 'chats' && styles.tabTextActive]}>
                Conversations
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'results' && styles.tabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('results');
              }}
            >
              <FileText
                color={activeTab === 'results' ? '#fff' : colors.textSecondary}
                size={18}
              />
              <Text style={[styles.tabText, activeTab === 'results' && styles.tabTextActive]}>
                Results
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'chats' && (
            <View style={styles.section}>
              {displayChats.length === 0 ? (
                <View style={styles.emptyState}>
                  <MessageCircle color={colors.textMuted} size={48} />
                  <Text style={styles.emptyTitle}>No conversations yet</Text>
                  <Text style={styles.emptyDescription}>
                    Start chatting with the AI tutor to see your history here
                  </Text>
                </View>
              ) : (
                displayChats.map((chat) => (
                  <View key={chat.id} style={styles.historyCard}>
                    <View style={styles.historyIconContainer}>
                      <MessageCircle color={colors.primary} size={22} />
                    </View>
                    <View style={styles.historyContent}>
                      <Text style={styles.historyTitle}>{chat.title}</Text>
                      <View style={styles.historyMeta}>
                        <Calendar color={colors.textMuted} size={14} />
                        <Text style={styles.historyDate}>{formatDate(chat.updatedAt)}</Text>
                      </View>
                    </View>
                    <View style={styles.historyActions}>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteChat(chat.id)}
                      >
                        <Trash2 color={colors.error} size={18} />
                      </TouchableOpacity>
                      <ChevronRight color={colors.textMuted} size={20} />
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'results' && (
            <View style={styles.section}>
              {mockResults.length === 0 ? (
                <View style={styles.emptyState}>
                  <FileText color={colors.textMuted} size={48} />
                  <Text style={styles.emptyTitle}>No results yet</Text>
                  <Text style={styles.emptyDescription}>
                    Complete an assessment to see your results here
                  </Text>
                </View>
              ) : (
                mockResults.map((result) => (
                  <View key={result.id} style={styles.historyCard}>
                    <View style={[styles.historyIconContainer, { backgroundColor: colors.success + '15' }]}>
                      <FileText color={colors.success} size={22} />
                    </View>
                    <View style={styles.historyContent}>
                      <Text style={styles.historyTitle}>{result.title}</Text>
                      <Text style={styles.historySummary}>{result.summary}</Text>
                      <View style={styles.historyMeta}>
                        <Calendar color={colors.textMuted} size={14} />
                        <Text style={styles.historyDate}>{formatDate(result.date)}</Text>
                      </View>
                    </View>
                    <ChevronRight color={colors.textMuted} size={20} />
                  </View>
                ))
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/contexts/ThemeContext').useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  lockedContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  lockedContainer: {
    alignItems: 'center',
  },
  lockedIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  previewContainer: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 16,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  previewText: {
    flex: 1,
  },
  previewItemTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  previewItemDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 10,
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  upgradeButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#fff',
  },
  header: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  headerGradient: {
    padding: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  section: {
    paddingHorizontal: 20,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  historyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  historySummary: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
