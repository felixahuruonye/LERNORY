# LERNORY ULTRA - Advanced AI-Powered EdTech Platform

## Overview
LERNORY ULTRA is a comprehensive EdTech platform that leverages multi-modal AI to transform education. It offers an 8D dashboard, advanced chat with AI tutoring modes, a comprehensive learning memory system, gamification, personalized study planning, and subject-specific expertise. The platform is designed for students, teachers, lecturers, and educational institutions, with a focus on enterprise-grade features tailored for the Nigerian education sector, aiming to provide a futuristic and engaging learning experience.

**Nov 28, 2025 - COMPLETE: AI Project Reading + Get Started Guide - AI reads projects & onboarding system!**

## User Preferences
Preferred communication style: Simple, everyday language. Prefers futuristic design with glassmorphism and neon effects. Wants faster, stronger backend logic without UI changes. Wants all learning data to persist permanently (auto-learned preferences, chat history, exam results, memory entries).

## System Architecture
### Frontend
The frontend is a React 18 application using TypeScript, Vite, Wouter for routing, TanStack Query for server state, and React hooks for local state. UI components are built with Radix UI and styled using shadcn/ui and Tailwind CSS, featuring a glassmorphic design that adapts to dark/light modes. The design emphasizes a voice-first interface, progressive disclosure, clean typography (Inter, Space Grotesn, JetBrains Mono), and purposeful animations.

### Backend
The backend is an Express.js application written in TypeScript, providing RESTful endpoints and WebSocket support. It incorporates 8 specialized modules for an advanced education ecosystem:
1.  **tutorSystem.ts**: AI tutor workflow, subject/difficulty detection, multi-format responses, weak topic detection, and learning insights.
2.  **learnorySystem.ts**: Master integrator, generates system prompts, personalizes responses, manages user dashboards, and coordinates gamification and tracking.
3.  **mockExamEngine.ts**: Auto-generates and marks mock exams, analyzes performance, identifies weak topics, predicts scores, and provides recommendations.
4.  **gamificationSystem.ts**: XP rewards, 50 levels, streak tracking (Bronze to Platinum), 15+ badge types, and unlockable tools.
5.  **motivationCoach.ts**: Personalized motivational messages, daily study reminders, exam-specific encouragement, and milestone celebrations.
6.  **personalizedPlanning.ts**: Generates custom study plans (90-day to 7-day), distributes subjects, sets difficulty progression, and tracks pace.
7.  **curriculumBrain.ts**: Complete curriculum for Nigerian exams (JAMB, WAEC, NECO), covering topics, key points, common mistakes, and study path recommendations.
8.  **advancedTutors.ts**: Six subject-specific tutor prompts (Mathematics, Physics, Chemistry, Biology, English, Government) with tailored strategies.

### Database & ORM
PostgreSQL (Neon Serverless) with Drizzle ORM. The schema supports users, chat sessions, learning history, study plans, memory entries, exam results, generated content, and projects.

### AI & External Services
A three-tier fallback system is implemented for AI:
-   **OpenAI** (GPT-3.5-turbo) for primary chat.
-   **OpenRouter** as a fallback for chat completions.
-   **Google Gemini** (gemini-2.5-flash) for website generation, file analysis, and Vision API capabilities.

### Key Architectural Patterns
-   **Monorepo structure** (`/client`, `/server`, `/shared`) for type safety.
-   **Integrated LEARNORY Ultra-Advanced System** coordinating all 8 modules.
-   **Subject auto-detection** from message content.
-   **Real-time learning analytics** with permanent memory.
-   **Multi-modal responses** (simple explanation → detailed → formulas → examples → applications → mistakes → practice).
-   **Personalization engine** adapting to user level and performance.
-   **Gemini Vision API Integration**: Supports OCR, content analysis, and extraction from images, PDFs, DOCX, DOC, and TXT files, providing structured outputs for text, summaries, key points, and educational value.
-   **AI Project Reading**: Advanced Chat detects "read my project workspace" requests and displays projects for AI discussion.

## External Dependencies
### Core Infrastructure
-   **Neon Database**: Serverless PostgreSQL (`@neondatabase/serverless`)

### Authentication & Session
-   **Replit Auth**: OpenID Connect provider
-   **Session Storage**: `connect-pg-simple`

### AI Services
-   **OpenAI**: GPT-3.5-turbo
-   **OpenRouter**: Fallback AI service
-   **Google Gemini**: gemini-2.5-flash

### Voice & Text-to-Speech
-   **Web Speech API** (Browser native)

### UI Components
-   **Radix UI**: Accessible primitives
-   **shadcn/ui**: Pre-built components
-   **Lucide React**: Icons
-   **Recharts**: Data visualization

## Recent Updates (Nov 28, 2025 - AI PROJECT READING + GET STARTED GUIDE)

### 🎯 PHASE 8: Get Started with LERNORY - Comprehensive Onboarding - COMPLETED ✅

**FEATURE:** Interactive step-by-step guide showing all LERNORY features to new users!

**HOW IT WORKS:**
1. User clicks "Get Started with LERNORY" button on dashboard
2. Opens interactive modal with 8 steps:
   - Welcome to LERNORY
   - Advanced Chat features
   - CBT Mode (exams)
   - Memory Panel
   - Project Workspace
   - Website Generator
   - Pro Tips
   - Ready to start

**FEATURES:**
- ✅ Step-by-step navigation (Next/Previous buttons)
- ✅ Progress indicators showing current step
- ✅ "Explore Now" buttons to jump to each feature
- ✅ Beautiful gradient backgrounds for each section
- ✅ Simple, clear explanations
- ✅ Shows benefits of each feature
- ✅ Guides users to start learning

**EACH STEP COVERS:**
- What the feature does
- Key benefits and capabilities
- How to use it
- Direct link to explore (except tips & welcome)

**LOCATION:** Button on AdvancedDashboard at top of page

### 🎯 PHASE 7: AI Project Reading in Advanced Chat - COMPLETED ✅

**FEATURE:** AI can now read your project workspace when you ask in chat!

**HOW IT WORKS:**
1. User says: "read my project workspace" or similar keywords
2. AI detects request BEFORE sending to backend
3. Shows project selector dialog with all user projects
4. User picks a project
5. AI loads project tasks and displays them
6. AI remembers project context for rest of conversation
7. User and AI can discuss the project together

**IMPLEMENTATION:**
- Frontend detection in AdvancedChat.tsx with keyword matching
- Keywords: "read my project", "show my projects", "my workspace", "read workspace", "project workspace", "read project"
- Bulletproof message interception: checks BEFORE sending to backend
- Dialog shows project list with names, descriptions, task counts
- Backend integration via `/api/projects` and `/api/projects/:projectId/tasks`
- Project context injected into AI system prompt for contextual responses

**DEEPEST BUG FIXED:**
- Original bug: AI was responding "I don't have access to your files"
- Root cause: Message was being sent to backend before frontend detection
- Fix: Added explicit early return when project reading detected
- Now: Message NEVER reaches backend if asking to read projects

**PROJECT WORKSPACE (`/project-workspace`) ALSO COMPLETED:**
- ✅ All buttons fully wired and functional
- ✅ Create projects with names
- ✅ Add/delete/complete tasks
- ✅ Real-time progress tracking
- ✅ Help/Instructions modal with 5-step guide
- ✅ Removed broken features (files, exports, editor)
- ✅ Route registered as `/workspace` and `/project-workspace`

**FEATURES WORKING:**
1. Project CRUD (Create, Read, Update, Delete)
2. Task management (Create, Update, Complete, Delete)
3. Progress percentage calculation
4. AI reads projects on request
5. Context-aware AI discussion about projects
6. Help system for new users

## Previous Updates (Nov 25, 2025)

### Phase 5: ASCII Diagrams in Homework Explanations - COMPLETED ✅

**ASCII DIAGRAM SYSTEM ENHANCEMENT:**
- ✅ Added ASCII diagram guidelines to core tutor system (tutorSystem.ts)
- ✅ Added subject-specific ASCII diagram examples for all 6 tutors
- ✅ Enhanced content structure to include visual ASCII art

**DIAGRAM TYPES BY SUBJECT:**

**Mathematics**: Geometry shapes, graphs, Venn diagrams, set operations
```
Parabola:        Triangle:
   /\              *
  /  \            /|\
_/____\          / | \  60°
```

**Physics**: Force diagrams, motion, circuits, electric fields
```
Force diagram:       Circuit:
    ↑ F1            ┌─[R1]─[R2]─┐
    |                │           │
← ──┼─ →     or     └─[Battery]─┘
    |
    ↓ F2
```

**Chemistry**: Molecular structures, reactions, electron movement
```
Methane:        Bonding:
    H           Na : Cl⁻ (ionic)
    |           H : H (covalent)
 H—C—H
    |
    H
```

**Biology**: Cells, processes, food chains, DNA
```
DNA:              Cell:
5'—A—T—3'        ┌─────────┐
  | |             │ Nucleus │
3'—T—A—5'        └─────────┘
```

**English**: Essay structure, narrative arc, character maps
```
Story Arc:          Essay:
Climax              ├─ Intro
  /\               ├─ Body 1
 /  \              ├─ Body 2
/____\            └─ Conclusion
```

**Government**: Institutional structures, processes, hierarchies
```
3 Arms:           Democratic Flow:
  Federal         Citizens → Vote → Laws
     |               ↑                ↓
  ┌─┼─┐         Accountability Loop ─┘
 Exec Leg Jud
```

**CONTENT STRUCTURE ENHANCED:**
- 📌 SIMPLE EXPLANATION
- 📐 ASCII DIAGRAMS ← NEW!
- 📚 DETAILED BREAKDOWN
- 💡 REAL-WORLD EXAMPLES
- 📊 FORMULAS & CONCEPTS
- 🎯 APPLICATIONS
- ⚠️ COMMON MISTAKES
- ✅ PRACTICE QUESTIONS
- 🔗 RELATED TOPICS

**BENEFITS:**
- Visual learning support with text-based diagrams
- Makes abstract concepts concrete and memorable
- Improves homework explanations for academic grading
- Supports all learning styles
- Helps students understand structural relationships
- Perfect for explaining complex systems and flows

All "Explain My Homework" responses now include ASCII diagrams where relevant!

### Phase 6: CBT Mode - Computer-Based Testing Simulation - IN PROGRESS 🚀

**CBT MODE FEATURE:**
- ✅ Real exam type selection: JAMB, WAEC, NECO
- ✅ Subject selection for customized testing
- ✅ Flexible time durations (30 min, 1 hour, 2 hours, 3 hours)
- ✅ Auto-logout on timer expiration
- ✅ Realistic computer monitor display
- ✅ Interactive keyboard and mouse simulation
- ✅ Question navigation (Previous/Next)
- ✅ Live timer countdown
- ✅ Exam submission handling

**FRONTEND COMPONENTS:**
- `CBTMode.tsx`: Main exam interface with:
  - Dashboard for exam configuration
  - Subject and time selection UI
  - Realistic monitor frame with exam questions
  - Keyboard and mouse visual indicators
  - Navigation controls and exam timer
  - Real-time countdown to auto-logout

**BACKEND INFRASTRUCTURE:**
- `GET /api/cbt/exams`: Fetch all available CBT exams
- `POST /api/cbt/sessions`: Create new exam session
- `GET /api/cbt/sessions/:sessionId`: Get session status
- `GET /api/cbt/questions/:examId`: Fetch questions for exam
- `POST /api/cbt/answers`: Save user answer
- `PATCH /api/cbt/sessions/:sessionId`: Update session status and scores

**DATABASE SCHEMA:**
- `cbtExams`: Stores exam metadata (type, subjects, duration)
- `cbtQuestions`: Question bank for exams
- `cbtSessions`: User exam attempt tracking
- `cbtAnswers`: User answers with correctness tracking

**FEATURES:**
- Real-time timer with automatic submission on expiration
- Multiple exam formats (JAMB, WAEC, NECO)
- Subject-based question filtering
- Realistic testing environment with computer interface
- Question flagging and review capabilities
- Performance tracking and scoring
- Session history for user review

**ROUTING:**
- `/cbt-mode`: Main CBT Mode dashboard and exam interface
