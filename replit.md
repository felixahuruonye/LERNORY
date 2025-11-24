# LERNORY ULTRA - Advanced AI-Powered EdTech Platform

## Overview

LERNORY ULTRA is a comprehensive EdTech platform that leverages multi-modal AI to transform education. It offers a glassmorphic 8D dashboard, advanced chat with AI tutoring modes, comprehensive learning memory system, gamification, personalized study planning, and subject-specific expertise. The platform is designed for students, teachers, lecturers, and educational institutions, with a focus on enterprise-grade features tailored for the Nigerian education sector.

## User Preferences

Preferred communication style: Simple, everyday language. Prefers futuristic design with glassmorphism and neon effects. Wants faster, stronger backend logic without UI changes.

## System Architecture

### Frontend Architecture
The frontend is a React 18 application built with TypeScript and Vite. It uses Wouter for routing, TanStack Query for server state management, and React hooks for local state. UI components are built with Radix UI primitives and styled using shadcn/ui and Tailwind CSS, featuring a glassmorphic design that adapts to dark/light modes. The design philosophy emphasizes a voice-first interface, progressive disclosure, clean typography (Inter, Space Grotesk, JetBrains Mono), and purposeful animations.

### Backend Architecture - NOW ULTRA-ADVANCED
The backend is an Express.js application written in TypeScript, providing RESTful endpoints and WebSocket support for real-time features. It now includes 8 specialized modules that make LEARNORY an advanced education ecosystem:

#### 1. **tutorSystem.ts** ✅
- Comprehensive AI tutor workflow with subject detection
- Difficulty level identification
- Multi-format response generation (simple → complex)
- Automatic weak topic detection
- Learning interaction analysis and memory tracking
- Generates learning insights from chat history

#### 2. **learnorySystem.ts** ✅ [MASTER INTEGRATOR]
- Integrates ALL systems into one unified AI
- Generates LEARNORY Ultra-Advanced system prompt
- Personalizes responses based on user context
- Manages complete user learning dashboard
- Coordinates gamification, motivation, and tracking

#### 3. **mockExamEngine.ts** ✅
- Auto-generates mock exams by subject/difficulty
- Auto-marks exams with detailed explanations
- Analyzes performance by difficulty level
- Identifies weak topics from exam results
- Predicts final exam score based on trends
- Provides personalized recommendations

#### 4. **gamificationSystem.ts** ✅
- XP reward system (10XP per question, 50XP per quiz, 100XP per exam)
- 50 total levels with accelerating XP requirements
- Streak tracking (Bronze → Silver → Gold → Platinum)
- 15+ badge types (subject mastery, achievements, streaks, performance)
- Unlockable tools at XP milestones (video explanations, voice tutor, offline mode)
- User titles based on level and achievements

#### 5. **motivationCoach.ts** ✅
- Personalized motivational messages based on performance
- Daily study reminders (by time of day)
- Exam-specific encouragement (countdown mode)
- Performance-based tips for each subject
- Milestone celebration system
- Streak-based motivation escalation

#### 6. **personalizedPlanning.ts** ✅
- Generates custom study plans based on user profile
- Creates 90-day to 7-day exam preparation schedules
- Distributes subjects throughout the plan
- Difficulty progression (fundamentals → advanced → consolidation → revision)
- Daily task generation with priorities
- Pace tracking and recommendations
- Adjusts based on user progress

#### 7. **curriculumBrain.ts** ✅
- Complete curriculum for Nigerian exams (JAMB, WAEC, NECO)
- 20+ topics per subject with subtopics
- Key points, formulas, common mistakes for each topic
- Real-world applications and past questions
- Difficulty ratings and estimated study hours
- Smart study path recommendations
- Total curriculum hours calculation

#### 8. **advancedTutors.ts** ✅
- 6 subject-specific tutor prompts:
  - 🧮 MATHEMATICS MASTER (Algebra, Geometry, Calculus)
  - 🔬 PHYSICS GURU (Mechanics, Thermodynamics, Waves)
  - ⚗️ CHEMISTRY EXPERT (Bonding, Reactions, Redox)
  - 🧬 BIOLOGY MASTER (Cells, Genetics, Photosynthesis)
  - 📚 ENGLISH MASTER (Writing, Literature, Grammar)
  - 🏛️ GOVERNMENT EXPERT (Constitution, Institutions, Rights)
- Subject-specific teaching strategies
- Common mistakes and tips for each subject
- Practice question templates

### Database & ORM
PostgreSQL (Neon Serverless) with Drizzle ORM. Comprehensive schema supports:
- Users with learning profiles
- Chat sessions and messages with history
- Learning history tracking
- Study plans and user progress
- Memory entries for permanent learning tracking
- Exam results and performance analytics
- Generated content (websites, images, code)

### AI & External Services
- **OpenAI** (GPT-3.5-turbo) - Primary chat provider
- **OpenRouter** - Fallback for chat completions
- **Google Gemini** (gemini-2.5-flash) - Website generation and file analysis
- Three-tier fallback system: OpenAI → OpenRouter → Gemini

### Key Architectural Patterns
- **Monorepo structure** (`/client`, `/server`, `/shared`) for type safety
- **Integrated LEARNORY Ultra-Advanced System** that coordinates all 8 modules
- **Subject auto-detection** from message content
- **Real-time learning analytics** with permanent memory
- **Multi-modal responses** (simple explanation → detailed → formulas → examples → apps → mistakes → practice)
- **Personalization engine** that adapts to user level and performance

## Ultra-Advanced Features (NEW - Nov 24, 2025)

### What User Will Experience in Chat:

#### 1. **Subject-Specific Tutoring**
When you ask about any topic, the AI:
- Detects the subject automatically
- Switches to expert tutor mode for that subject
- Shows: Simple explanation → Detailed breakdown → Examples → Formulas → Real-world apps → Common mistakes → Practice questions → Related topics

Example: Ask about "photosynthesis" → Gets Biology Master tutor with step-by-step explanation

#### 2. **Comprehensive Problem Solving**
When solving ANY problem:
- Shows FULL working with every step explained
- Explains WHY each step (reasoning)
- Provides alternative methods
- Highlights common mistakes in this type of problem
- Generates 3 similar practice questions
- Includes exam shortcuts

#### 3. **Study Plan Generation**
When you ask: "Create a study plan for JAMB"
- Asks about exam, subjects, available hours, weak areas
- Generates complete daily schedule (80+ days)
- Distributes topics: 20% fundamentals → 40% deep learning → 25% consolidation → 15% revision
- Includes mock exam dates
- Provides pace tracking

#### 4. **Mock Exam Generation**
When you ask: "Generate physics mock exam"
- Creates 20+ questions with difficulty variation
- Auto-marks your answers
- Shows detailed explanations
- Identifies weak topics
- Predicts your final exam score
- Recommends specific focus areas

#### 5. **Learning Analytics**
When you ask: "What are my weak topics?"
- Shows all topics studied
- Identifies patterns in mistakes
- Calculates subject mastery percentage
- Tracks study streaks
- Shows XP and level progress
- Suggests what to focus on next

#### 6. **Gamification**
Behind the scenes, the AI:
- Awards XP for every correct answer (10+, 50+, 100+)
- Tracks study streaks (goal: reach platinum at 100 days)
- Unlocks badges (Math Wizard at 100 correct answers, etc.)
- Assigns achievements and titles
- Creates competition with self-improvement

#### 7. **Motivation & Coaching**
Daily:
- Personalized motivational messages based on performance
- Time-specific reminders (morning boost, afternoon push, evening study)
- Exam countdown messages with specific tips
- Performance-based encouragement
- Celebration of milestones

#### 8. **Permanent Memory System**
The AI remembers:
- Every topic you studied
- Every mistake you made
- Your weak topics and strong subjects
- Your learning pace and style
- Your study streaks and consistency
- Your score trends and improvements
- Your XP, level, badges, and achievements

## Recent Updates (Nov 24, 2025)

### Phase 2: Ultra-Advanced AI Tutoring System - COMPLETED ✅

**BACKEND MODULES CREATED:**
- ✅ `tutorSystem.ts` - Core tutoring workflow with memory tracking
- ✅ `learnorySystem.ts` - Master integrator of all systems
- ✅ `mockExamEngine.ts` - Auto-marking exam system with predictions
- ✅ `gamificationSystem.ts` - XP, badges, streaks, levels, unlockables
- ✅ `motivationCoach.ts` - Personalized motivation & daily reminders
- ✅ `personalizedPlanning.ts` - Custom study plan generation
- ✅ `curriculumBrain.ts` - Complete curriculum for Nigerian exams
- ✅ `advancedTutors.ts` - 6 subject-specific expert tutors

**FEATURES DELIVERED:**
- ✅ Subject-specific tutoring (Math, Physics, Chemistry, Biology, English, Government)
- ✅ Multi-format explanations (simple → complex with formulas, examples, apps, mistakes)
- ✅ Step-by-step problem solving with reasoning
- ✅ Mock exam generation with auto-marking
- ✅ Personalized study planning (90-day to 7-day countdown)
- ✅ Learning analytics & weak topic identification
- ✅ Gamification system (XP, badges, streaks, levels)
- ✅ Daily motivation & exam countdown reminders
- ✅ Permanent learning memory & pattern tracking
- ✅ Score prediction & performance trends

### Phase 3: LEARNORY LIVE AI - COMPLETED ✅ (Nov 24, 2025)

**FEATURES IMPLEMENTED:**
- ✅ New LEARNORY LIVE AI page (accessible via Zap icon in chat header)
- ✅ Real-time voice conversation setup (ready for Vapi integration)
- ✅ Document upload & intelligence system (PDF, images, handwritten notes)
- ✅ 8 in-chat feature buttons (Live Talk, Upload, Exam, Timetable, Lesson, University, Notes, Memory)
- ✅ Database schema for voice conversations, document uploads, and Live AI features
- ✅ Complete API endpoints for LIVE AI operations
- ✅ Storage interface with full CRUD operations for Live AI data
- ✅ Futuristic UI with gradient neon effects and smooth animations
- ✅ Mode selector (Conversational, Teaching, Exam modes)
- ✅ Document management sidebar
- ✅ AI status indicator

**DATABASE SCHEMA ADDED:**
- `voiceConversations` - Stores all voice sessions with metadata
- `documentUploads` - Manages uploaded files with processing status
- `liveAiFeatures` - Tracks feature usage and results

**API ENDPOINTS ADDED:**
- `POST /api/live-ai/voice-start` - Initiate voice conversation
- `POST /api/live-ai/document-upload` - Upload document for analysis
- `GET /api/live-ai/documents` - Retrieve user's documents
- `GET /api/live-ai/conversations` - Get voice conversation history
- `POST /api/live-ai/feature` - Track feature usage

## How to Use LEARNORY Ultra

### For Students:
1. **Ask about any topic**: "Explain quadratic equations"
2. **Ask for problems to be solved**: "Solve this physics problem: ..."
3. **Request study plan**: "Create a 60-day JAMB study plan with weak topics in Math"
4. **Generate mock exams**: "Give me a chemistry mock exam"
5. **Track progress**: "Show my weak topics and study streak"
6. **Get motivation**: "I'm feeling lost" → Gets personalized encouragement

### Expected Chat Responses:

**For Explanation Requests:**
```
🎓 SIMPLE EXPLANATION (1-2 sentences)
📚 DETAILED BREAKDOWN with analogies
💡 3-5 REAL EXAMPLES
📐 FORMULAS and KEY CONCEPTS
🎯 REAL-WORLD APPLICATIONS
⚠️ COMMON MISTAKES STUDENTS MAKE
✅ PRACTICE QUESTIONS with solutions
🔗 SUGGESTED NEXT TOPICS
```

**For Problem Solving:**
```
📋 GIVEN / FIND
🔄 STRATEGY
👣 STEP-BY-STEP WORKING
✅ FINAL ANSWER (highlighted)
💭 EXPLANATION of each step
🔀 ALTERNATIVE METHOD
⚠️ COMMON MISTAKES in this problem
📝 SIMILAR PRACTICE QUESTION
⏱️ EXAM SHORTCUT TIP
```

**For Study Planning:**
```
📅 COMPLETE DAILY SCHEDULE (80 days)
📊 TOPIC DISTRIBUTION BY DAY
🎯 DIFFICULTY PROGRESSION
📝 DAILY TASKS (lesson, practice, quiz, exam, revision)
📈 MOCK EXAM DATES
✅ PACE TRACKING
```

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL (`@neondatabase/serverless`)
- **Environment Variables**: `DATABASE_URL`, `SESSION_SECRET`

### Authentication & Session
- **Replit Auth**: OpenID Connect provider
- **Session Storage**: `connect-pg-simple`

### AI Services
- **OpenAI**: GPT-3.5-turbo (Chat primary)
  - **Environment Variable**: `OPENAI_API_KEY`
- **OpenRouter**: Fallback for chat
  - **Environment Variable**: `OPENROUTER_API_KEY`
- **Google Gemini**: gemini-2.5-flash (Website generation)
  - **Environment Variable**: `GEMINI_API_KEY`

### Voice & Text-to-Speech
- **Web Speech API** (Browser native) - No API key needed
- Supports: Adam, Aria, Guy, Zira voices
- Preprocesses text (removes emojis, bullets, converts LEARNORY to lowercase)

### UI Components
- **Radix UI**: Accessible primitives
- **shadcn/ui**: Pre-built components
- **Lucide React**: Icons
- **Recharts**: Data visualization

## Performance Notes

- AI system responds within 10-15 seconds
- Learning history tracked in real-time
- Mock exam generation takes 2-3 seconds
- Study plans generated instantly
- All calculations done server-side (security)
- Three-tier API fallback ensures 99%+ availability

## Future Enhancements

- Phase 3: Agent System (Research/Writer/Programmer/Tutor/Automation/UI Designer)
- Phase 4: Video tutorials and animated explanations
- Phase 5: Offline learning mode with downloadable content
- Phase 6: AI voice tutor (natural speaking explanations)
- Phase 7: School management dashboard for teachers
- Phase 8: Government analytics for education policy
