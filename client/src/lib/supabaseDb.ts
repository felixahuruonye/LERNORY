import { supabase } from './supabase';

// Chat Sessions
export const chatSessionsDb = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    return { data, error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async create(session: { user_id: string; title: string; mode?: string }) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert(session)
      .select()
      .single();
    return { data, error };
  },

  async update(id: string, updates: Partial<{ title: string; summary: string; is_bookmarked: boolean }>) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id);
    return { error };
  },
};

// Chat Messages
export const chatMessagesDb = {
  async getBySession(sessionId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    return { data, error };
  },

  async create(message: { user_id: string; session_id?: string; role: string; content: string; attachments?: any }) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(message)
      .select()
      .single();
    
    // Update session message count and updated_at manually
    if (message.session_id) {
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('message_count')
        .eq('id', message.session_id)
        .single();
      
      if (session) {
        await supabase
          .from('chat_sessions')
          .update({ 
            message_count: (session.message_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', message.session_id);
      }
    }
    
    return { data, error };
  },
};

// Notifications
export const notificationsDb = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    return { data, error };
  },

  async getUnread(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    return { error };
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    return { error };
  },

  async create(notification: { user_id: string; type: string; title: string; message: string; icon?: string; action_url?: string }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    return { data, error };
  },
};

// Study Plans
export const studyPlansDb = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async create(plan: { user_id: string; title: string; subjects: string[]; exam_type?: string; deadline?: string; hours_per_day?: number }) {
    const { data, error } = await supabase
      .from('study_plans')
      .insert(plan)
      .select()
      .single();
    return { data, error };
  },

  async update(id: string, updates: Partial<{ title: string; schedule: any; progress: any }>) {
    const { data, error } = await supabase
      .from('study_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('study_plans')
      .delete()
      .eq('id', id);
    return { error };
  },
};

// Memory Entries
export const memoryEntriesDb = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getByType(userId: string, type: string) {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async create(entry: { user_id: string; type: string; data: any }) {
    const { data, error } = await supabase
      .from('memory_entries')
      .insert(entry)
      .select()
      .single();
    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('memory_entries')
      .delete()
      .eq('id', id);
    return { error };
  },
};

// Exam Results
export const examResultsDb = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('exam_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async create(result: { user_id: string; exam_name: string; subject?: string; total_questions?: number; correct_answers?: number; score?: number; time_spent?: number; answers?: any; topics_strong?: string[]; topics_weak?: string[] }) {
    const { data, error } = await supabase
      .from('exam_results')
      .insert(result)
      .select()
      .single();
    return { data, error };
  },
};

// Generated Websites
export const generatedWebsitesDb = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('generated_websites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('generated_websites')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async create(website: { user_id: string; title: string; description?: string; prompt: string; html_code: string; css_code: string; js_code?: string; tags?: string[] }) {
    const { data, error } = await supabase
      .from('generated_websites')
      .insert(website)
      .select()
      .single();
    return { data, error };
  },

  async update(id: string, updates: Partial<{ title: string; html_code: string; css_code: string; js_code: string; is_favorite: boolean }>) {
    const { data, error } = await supabase
      .from('generated_websites')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('generated_websites')
      .delete()
      .eq('id', id);
    return { error };
  },
};

// Learning History
export const learningHistoryDb = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('learning_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async create(entry: { user_id: string; subject: string; topic: string; mode?: string; duration?: number; performance?: string; notes?: string }) {
    const { data, error } = await supabase
      .from('learning_history')
      .insert(entry)
      .select()
      .single();
    return { data, error };
  },
};

// User Progress
export const userProgressDb = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  },

  async getBySubject(userId: string, subject: string) {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', subject)
      .single();
    return { data, error };
  },

  async upsert(progress: { user_id: string; subject: string; topics_studied?: string[]; weak_topics?: string[]; strong_topics?: string[]; questions_attempted?: number; average_score?: number }) {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert(progress, { onConflict: 'user_id,subject' })
      .select()
      .single();
    return { data, error };
  },
};

// Projects
export const projectsDb = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_tasks(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_tasks(*)')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async create(project: { user_id: string; name: string; description?: string }) {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    return { data, error };
  },

  async update(id: string, updates: Partial<{ name: string; description: string; status: string }>) {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    return { error };
  },
};

// Project Tasks
export const projectTasksDb = {
  async create(task: { project_id: string; title: string; description?: string; priority?: number; due_date?: string }) {
    const { data, error } = await supabase
      .from('project_tasks')
      .insert(task)
      .select()
      .single();
    return { data, error };
  },

  async update(id: string, updates: Partial<{ title: string; description: string; status: string; priority: number }>) {
    const { data, error } = await supabase
      .from('project_tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', id);
    return { error };
  },
};

// Generated Images
export const generatedImagesDb = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async create(image: { user_id: string; prompt: string; image_url: string; related_topic?: string; tags?: string[] }) {
    const { data, error } = await supabase
      .from('generated_images')
      .insert(image)
      .select()
      .single();
    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('generated_images')
      .delete()
      .eq('id', id);
    return { error };
  },
};

// Pricing Tiers
export const pricingTiersDb = {
  async getAll() {
    const { data, error } = await supabase
      .from('pricing_tiers')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });
    return { data, error };
  },
};

// Subscriptions
export const subscriptionsDb = {
  async getByUser(userId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, pricing_tiers(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    return { data, error };
  },

  async create(subscription: { user_id: string; tier_id: string; paystack_subscription_code?: string; current_period_start?: string; current_period_end?: string }) {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single();
    return { data, error };
  },

  async update(id: string, updates: Partial<{ status: string; current_period_end: string }>) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};

// Generated Lessons
export const generatedLessonsDb = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('generated_lessons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('generated_lessons')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async create(lesson: { user_id: string; title: string; subject: string; topic: string; content: string; summary?: string }) {
    const { data, error } = await supabase
      .from('generated_lessons')
      .insert(lesson)
      .select()
      .single();
    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('generated_lessons')
      .delete()
      .eq('id', id);
    return { error };
  },
};

// Users profile helpers
export const usersDb = {
  async getById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async update(id: string, updates: Partial<{ first_name: string; last_name: string; profile_image_url: string; subscription_tier: string }>) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};

// Real-time subscriptions
export const realtimeSubscriptions = {
  subscribeToNotifications(userId: string, callback: (notification: any) => void) {
    return supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
  },

  subscribeToChatMessages(sessionId: string, callback: (message: any) => void) {
    return supabase
      .channel(`chat:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
  },

  unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  },
};
