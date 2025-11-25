# LERNORY ULTRA - Advanced AI-Powered EdTech Platform

## Overview
LERNORY ULTRA is a comprehensive EdTech platform that leverages multi-modal AI to transform education. It offers an 8D dashboard, advanced chat with AI tutoring modes, a comprehensive learning memory system, gamification, personalized study planning, and subject-specific expertise. The platform is designed for students, teachers, lecturers, and educational institutions, with a focus on enterprise-grade features tailored for the Nigerian education sector, aiming to provide a futuristic and engaging learning experience.

## User Preferences
Preferred communication style: Simple, everyday language. Prefers futuristic design with glassmorphism and neon effects. Wants faster, stronger backend logic without UI changes.

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
PostgreSQL (Neon Serverless) with Drizzle ORM. The schema supports users, chat sessions, learning history, study plans, memory entries, exam results, and generated content.

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
-   **Gemini Vision API Integration**: Supports OCR, content analysis, and extraction from images, PDFs, DOCX, DOC, and TXT files, providing structured outputs for text, summaries, key topics, and educational value.

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