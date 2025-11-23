# LERNORY ULTRA - Advanced AI-Powered EdTech Platform

## Overview

LERNORY ULTRA is a comprehensive EdTech platform that leverages multi-modal AI to transform education. It offers a 6K glassmorphic dashboard, advanced chat with various AI modes and agents, audio transcription, image generation, a project workspace, and an intelligent learning memory system. The platform is designed for students, teachers, lecturers, and educational institutions, with a focus on enterprise-grade features tailored for the Nigerian education sector. It aims to provide an innovative and engaging learning experience.

## User Preferences

Preferred communication style: Simple, everyday language. Prefers futuristic design with glassmorphism and neon effects.

## System Architecture

### Frontend Architecture
The frontend is a React 18 application built with TypeScript and Vite. It uses Wouter for routing, TanStack Query for server state management, and React hooks for local state. UI components are built with Radix UI primitives and styled using shadcn/ui and Tailwind CSS, featuring a glassmorphic design that adapts to dark/light modes. The design philosophy emphasizes a voice-first interface, progressive disclosure, clean typography (Inter, Space Grotesk, JetBrains Mono), and purposeful animations.

### Backend Architecture
The backend is an Express.js application written in TypeScript, providing RESTful endpoints and WebSocket support for real-time features. It handles file uploads via Multer and uses `express-session` with a PostgreSQL store for session management. Authentication is handled through Replit Auth (OpenID Connect) using Passport.js. The build system uses esbuild for production and tsx for development.

### Database & ORM
PostgreSQL, provided by Neon Serverless for scalable and efficient data management, serves as the primary database. Drizzle ORM, with `drizzle-kit` for migrations, provides type-safe database interactions. The comprehensive schema supports users (student, teacher, admin, lecturer, school roles), learning history, generated content, sessions, quizzes, chat messages, memory entries, payments, and file uploads. Session storage is also PostgreSQL-backed.

### AI & External Services
The platform heavily integrates AI capabilities primarily through OpenAI for GPT models (chat, tutoring, lesson generation), Whisper (audio transcription), and TTS (speech generation). OpenRouter serves as a fallback for chat completions to ensure resilience. Google Gemini (gemini-2.5-flash) is used specifically for the website generation feature.

### Key Architectural Patterns
The project utilizes a Monorepo structure (`/client`, `/server`, `/shared`) to ensure type safety across the full stack and reduce code duplication. It incorporates Replit blueprints for standardized integration. Centralized error handling, including API fallback mechanisms and authentication error detection, is implemented. Real-time features, such as live transcription sessions, are powered by a WebSocket server. The application is designed with progressive enhancement, gracefully degrading features when services are unavailable or environment variables are missing.

## Recent Updates (Nov 23, 2025)

### Phase 1: Chat System with History - COMPLETED ✅
- ✅ Original Chat component restored with all AI Tutor features
- ✅ Added **Chat History Sidebar** showing all previous chats
- ✅ Added **"New Chat" button** with message icon that creates new sessions
- ✅ Users can switch between chats by clicking in history
- ✅ Delete individual chats from history
- ✅ Collapsible sidebar (toggle button in header)
- ✅ Full feature set:
  - Message sending with AI responses
  - Text-to-speech for messages
  - Voice recording & transcription
  - Topic explanation with generated images
  - Image generation
  - Starter suggestions for new chats
  - Message display with stickers/emojis
  - Drag-and-drop file upload support

**KEY FEATURES:**
- Chat history persists in database
- Each new chat starts fresh with new input area
- Previous chats accessible in sidebar history
- Delete any chat from history
- All original AI Tutor functionality preserved
- Mobile-responsive sidebar (collapse/expand)

**BACKEND SUPPORT:**
- `/api/chat/sessions` - GET/POST/PATCH/DELETE for session management
- `/api/chat/messages` - Fetch all messages for user
- `/api/chat/send` - Send message and get AI response
- `/api/chat/transcribe-voice` - Voice transcription
- File upload analysis with Gemini → OpenAI → OpenRouter fallback

### Pending Phases
- Phase 2: AI Modes implementation with dynamic UI (Chat/Writing/Coding/Image)
- Phase 3: Agent System (Research/Writer/Programmer/Tutor/Automation/UI Designer)
- Phase 4: Advanced message features (highlighting, editing, rating, multi-select, bookmarks, folders)
- Phase 5: File analysis display and rich message formatting

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL (`@neondatabase/serverless`)
- **Environment Variables**: `DATABASE_URL`, `SESSION_SECRET`

### Authentication & Session
- **Replit Auth**: OpenID Connect provider
- **Environment Variables**: `REPL_ID`, `ISSUER_URL`
- **Session Storage**: `connect-pg-simple`

### AI Services
- **OpenAI**: GPT models, Whisper, TTS
  - **Environment Variable**: `OPENAI_API_KEY`
- **OpenRouter**: Fallback for chat completions
  - **Environment Variable**: `OPENROUTER_API_KEY`
- **Google Gemini**: **PRIMARY** for file/image analysis + Website generation
  - **Environment Variable**: `GEMINI_API_KEY`

### Payment Processing
- **Paystack**: Nigerian payment gateway
  - **Environment Variable**: `PAYSTACK_SECRET_KEY`

### UI Component Libraries
- **Radix UI**: Accessible primitives (accordion, dialog, dropdown, etc.)
- **Additional UI Libraries**: `cmdk`, `react-dropzone`, `vaul`, `embla-carousel`, `recharts`, `react-day-picker`

### Fonts (Google Fonts CDN)
- **Inter**: UI text
- **Space Grotesk**: Headings
- **JetBrains Mono**: Code blocks