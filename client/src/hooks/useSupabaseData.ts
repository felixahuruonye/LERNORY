import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
  chatSessionsDb,
  chatMessagesDb,
  notificationsDb,
  studyPlansDb,
  memoryEntriesDb,
  examResultsDb,
  generatedWebsitesDb,
  learningHistoryDb,
  userProgressDb,
  projectsDb,
  generatedImagesDb,
  pricingTiersDb,
  subscriptionsDb,
  generatedLessonsDb,
} from '@/lib/supabaseDb';

// Chat Sessions
export function useChatSessions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supabase', 'chat-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await chatSessionsDb.getAll(user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
}

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ['supabase', 'chat-messages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await chatMessagesDb.getBySession(sessionId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!sessionId,
    staleTime: 10000,
  });
}

export function useCreateChatSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: { title: string; mode?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data: session, error } = await chatSessionsDb.create({
        user_id: user.id,
        title: data.title,
        mode: data.mode || 'chat',
      });
      if (error) throw error;
      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase', 'chat-sessions', user?.id] });
    },
  });
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await chatSessionsDb.delete(id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase', 'chat-sessions', user?.id] });
    },
  });
}

// Notifications
export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supabase', 'notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await notificationsDb.getAll(user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
}

export function useUnreadNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supabase', 'notifications-unread', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await notificationsDb.getUnread(user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 10000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await notificationsDb.markAsRead(id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase', 'notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['supabase', 'notifications-unread', user?.id] });
    },
  });
}

// Study Plans
export function useStudyPlans() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supabase', 'study-plans', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await studyPlansDb.getAll(user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

export function useCreateStudyPlan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: { title: string; subjects: string[]; exam_type?: string; deadline?: string; hours_per_day?: number }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data: plan, error } = await studyPlansDb.create({
        user_id: user.id,
        ...data,
      });
      if (error) throw error;
      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase', 'study-plans', user?.id] });
    },
  });
}

// Memory Entries
export function useMemoryEntries() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supabase', 'memory-entries', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await memoryEntriesDb.getAll(user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

// Exam Results
export function useExamResults() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supabase', 'exam-results', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await examResultsDb.getAll(user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

// Generated Websites
export function useGeneratedWebsites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supabase', 'websites', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await generatedWebsitesDb.getAll(user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

// Learning History
export function useLearningHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supabase', 'learning-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await learningHistoryDb.getAll(user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

// User Progress
export function useUserProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supabase', 'user-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await userProgressDb.getAll(user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

// Projects
export function useProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supabase', 'projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await projectsDb.getAll(user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

// Generated Images
export function useGeneratedImages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supabase', 'images', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await generatedImagesDb.getAll(user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

// Pricing Tiers (public)
export function usePricingTiers() {
  return useQuery({
    queryKey: ['supabase', 'pricing-tiers'],
    queryFn: async () => {
      const { data, error } = await pricingTiersDb.getAll();
      if (error) throw error;
      return data || [];
    },
    staleTime: 300000, // 5 minutes
  });
}

// User Subscription
export function useSubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supabase', 'subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await subscriptionsDb.getByUser(user.id);
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

// Generated Lessons
export function useGeneratedLessons() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supabase', 'lessons', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await generatedLessonsDb.getAll(user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

// Dashboard Stats (combines multiple queries)
export function useDashboardStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['supabase', 'dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const [
        chatSessions,
        studyPlans,
        examResults,
        websites,
        images,
        lessons,
      ] = await Promise.all([
        chatSessionsDb.getAll(user.id),
        studyPlansDb.getAll(user.id),
        examResultsDb.getAll(user.id),
        generatedWebsitesDb.getAll(user.id),
        generatedImagesDb.getAll(user.id),
        generatedLessonsDb.getAll(user.id),
      ]);

      return {
        chatSessionsCount: chatSessions.data?.length || 0,
        studyPlansCount: studyPlans.data?.length || 0,
        examResultsCount: examResults.data?.length || 0,
        websitesCount: websites.data?.length || 0,
        imagesCount: images.data?.length || 0,
        lessonsCount: lessons.data?.length || 0,
        recentChats: (chatSessions.data || []).slice(0, 5),
        recentExams: (examResults.data || []).slice(0, 5),
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
}
