-- LERNORY ULTRA - Supabase Database Migration
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin', 'lecturer', 'school');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('active', 'paused', 'ended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE quiz_difficulty AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE learning_mode AS ENUM ('learning', 'exam', 'revision', 'quick', 'eli5', 'advanced', 'practice');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE exam_type AS ENUM ('waec', 'neco', 'jamb', 'university', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('chat', 'chat_history', 'motivation', 'achievement', 'reminder', 'exam', 'study_plan', 'system');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Users table (links to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  role user_role DEFAULT 'student' NOT NULL,
  school_id VARCHAR,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_expires_at TIMESTAMP,
  paystack_customer_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Schools table
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Student profiles
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  weak_topics TEXT[],
  completed_courses TEXT[],
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Courses
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  syllabus JSONB,
  price DECIMAL(10, 2) DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE NOT NULL,
  school_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Chat sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  mode VARCHAR(50) DEFAULT 'chat',
  is_bookmarked BOOLEAN DEFAULT FALSE,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  icon VARCHAR(50),
  action_url VARCHAR(512),
  read BOOLEAN DEFAULT FALSE NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Study plans
CREATE TABLE IF NOT EXISTS public.study_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  subjects TEXT[] NOT NULL,
  exam_type exam_type,
  deadline TIMESTAMP,
  hours_per_day INTEGER,
  weak_areas TEXT[],
  schedule JSONB,
  progress JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Memory entries
CREATE TABLE IF NOT EXISTS public.memory_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Exam results
CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_name VARCHAR(255) NOT NULL,
  subject VARCHAR(100),
  total_questions INTEGER,
  correct_answers INTEGER,
  score DECIMAL(5, 2),
  time_spent INTEGER,
  answers JSONB,
  topics_strong TEXT[],
  topics_weak TEXT[],
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Generated websites
CREATE TABLE IF NOT EXISTS public.generated_websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  html_code TEXT NOT NULL,
  css_code TEXT NOT NULL,
  js_code TEXT,
  preview_url TEXT,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Learning history
CREATE TABLE IF NOT EXISTS public.learning_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  mode VARCHAR(50),
  duration INTEGER,
  performance VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- User progress
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  topics_studied TEXT[],
  weak_topics TEXT[],
  strong_topics TEXT[],
  questions_attempted INTEGER DEFAULT 0,
  average_score DECIMAL(5, 2) DEFAULT 0,
  learning_mode learning_mode DEFAULT 'learning',
  preferred_language VARCHAR(50) DEFAULT 'English',
  last_studied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Generated images
CREATE TABLE IF NOT EXISTS public.generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  related_topic VARCHAR(255),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Document uploads
CREATE TABLE IF NOT EXISTS public.document_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_name VARCHAR NOT NULL,
  file_type VARCHAR NOT NULL,
  file_url VARCHAR NOT NULL,
  file_size INTEGER,
  extracted_text TEXT,
  ai_analysis JSONB,
  is_processing BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Project tasks
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- CBT Exams
CREATE TABLE IF NOT EXISTS public.cbt_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  exam_type exam_type NOT NULL,
  subject VARCHAR(100) NOT NULL,
  duration INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  passing_score INTEGER DEFAULT 50,
  instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- CBT Sessions
CREATE TABLE IF NOT EXISTS public.cbt_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
  status session_status DEFAULT 'active' NOT NULL,
  current_question INTEGER DEFAULT 0,
  answers JSONB,
  score DECIMAL(5, 2),
  started_at TIMESTAMP DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMP
);

-- Pricing tiers
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2),
  features JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.pricing_tiers(id),
  status VARCHAR(50) DEFAULT 'active',
  paystack_subscription_code VARCHAR,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Generated lessons
CREATE TABLE IF NOT EXISTS public.generated_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  original_text TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_user ON public.study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_entries_user ON public.memory_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_user ON public.exam_results(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_history_user ON public.learning_history(user_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_lessons ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own chat messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own study plans" ON public.study_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own memory entries" ON public.memory_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own exam results" ON public.exam_results FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own websites" ON public.generated_websites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own learning history" ON public.learning_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own progress" ON public.user_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own images" ON public.generated_images FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own documents" ON public.document_uploads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own cbt sessions" ON public.cbt_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own lessons" ON public.generated_lessons FOR ALL USING (auth.uid() = user_id);

-- Public read access for some tables
CREATE POLICY "Anyone can view pricing tiers" ON public.pricing_tiers FOR SELECT USING (true);
CREATE POLICY "Anyone can view active cbt exams" ON public.cbt_exams FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT USING (is_published = true);

-- Project tasks inherit project access
CREATE POLICY "Users can view own project tasks" ON public.project_tasks FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid()));

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, profile_image_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULLIF(SUBSTRING(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '') FROM POSITION(' ' IN COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')) + 1), '')),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default pricing tiers
INSERT INTO public.pricing_tiers (name, price_monthly, price_yearly, features, is_active)
VALUES 
  ('free', 0, 0, '{"chat_messages": 50, "study_plans": 1, "exams": 3, "websites": 1, "ai_images": 5}', true),
  ('pro', 2999, 29990, '{"chat_messages": 500, "study_plans": 10, "exams": "unlimited", "websites": 10, "ai_images": 50, "priority_support": true}', true),
  ('premium', 5999, 59990, '{"chat_messages": "unlimited", "study_plans": "unlimited", "exams": "unlimited", "websites": "unlimited", "ai_images": "unlimited", "priority_support": true, "offline_mode": true}', true)
ON CONFLICT (name) DO NOTHING;

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
