# LERNORY ULTRA - Advanced AI-Powered EdTech Platform

## Overview

LERNORY ULTRA is a comprehensive, futuristic EdTech platform designed to revolutionize education through multi-modal AI interactions. The platform combines a 6K glassmorphic dashboard, advanced chat with AI modes & agents, audio transcription system, image generation, project workspace, and intelligent learning memory system. It serves students, teachers, lecturers, and educational institutions with enterprise-grade features and Nigerian education focus.

The application is built as a full-stack TypeScript application using React for the frontend and Express for the backend, with PostgreSQL as the primary database through Neon's serverless platform.

## User Preferences

Preferred communication style: Simple, everyday language. Prefers futuristic design with glassmorphism and neon effects.

## Recent Updates (November 23, 2025 - ULTRA BUILD)

### LERNORY ULTRA Core Systems (MASSIVE REBUILD)

#### 1. Advanced Dashboard (NEW)
- **Glassmorphism UI**: Futuristic 6K design with neon accents
- **Search Hub**: Search modes, projects, tutorials
- **AI Tools Hub**: 7 AI tools (Chat, Writing, Coding, Image Gen, Audio, Math, Research)
- **Quick Actions**: New Chat, New Project, Generate Image, Voice Session
- **Recent Projects**: Track ongoing work with last modified timestamps
- **User Goals**: Visual goal tracking with progress bars
- **Tutorials Widget**: Onboarding for first-time users
- **Dark/Light Mode**: Glassmorphism adapts to theme

#### 2. Advanced Chat System (NEW)
- **AI Modes**: 6 modes (Chat, Writing, Coding, Image Generation, Math, Research)
- **Agent Selection**: 6 agents (Tutor, Writer, Programmer, Researcher, Designer, Automation)
- **Message Interface**: 
  - Drag-drop file uploads
  - Voice input with real-time recording
  - Inline message editing
  - Response ratings (thumbs up/down)
  - Bookmark conversations
  - Copy message functionality
- **Conversation Sidebar**: 
  - List of recent conversations
  - Create new chat
  - Saved messages folder
  - Agent management
- **Real-time Typing**: Mode & agent status display

#### 3. Agent Management System (NEW)
- **6 Default Agents**:
  - AI Tutor: Explains concepts, creates exercises, grades assignments
  - Content Writer: Writes essays, blog posts, creative content
  - Code Expert: Debugs code, reviews, explains algorithms
  - Research Bot: Researches topics, finds sources, summarizes
  - UI Designer: Creates mockups, designs, gives feedback
  - Automation Bot: Automates workflows, schedules tasks
- **Agent Configuration**: 
  - Enable/disable agents
  - Customize per-agent settings
  - Global model selection (GPT-4, Claude 3)
  - Response timeout settings
  - Agent collaboration mode
- **Custom Agent Creation**: Support for creating user-defined agents
- **Activity Stats**: View active agents, total agents, custom agents

#### 4. Audio System (NEW)
- **Live Recording**: Real-time audio visualizer with waveform
- **Transcription**: Auto-transcribe with Whisper AI
- **Translation**: Multi-language support (English, Yoruba, Pidgin, Igbo, Hausa)
- **Summarization**: Generate summaries from audio
- **Audio Sessions**: 
  - Play/pause playback
  - Download audio files
  - Delete recordings
  - View transcripts
- **Recording Settings**:
  - Audio quality (Low, Medium, High)
  - Input device selection
  - Auto-transcribe on end option
- **Storage Management**: Visual storage quota tracker

#### 5. Image Generation Advanced (NEW)
- **Prompt Builder**: Detailed prompt input with examples
- **Style Templates**: 6 styles (Photorealistic, Illustrated, Sketch, 3D, Watercolor, Neon)
- **Aspect Ratio**: Multiple ratios (1:1, 4:3, 3:4)
- **Resolution Control**: 512p, 768p, 1024p options
- **Generation History**: 
  - Grid view of all generated images
  - Edit/delete options
  - Hover preview
- **Download & Export**: Download individual images
- **Preview Panel**: Latest generated image with metadata

#### 6. Project Workspace (NEW)
- **Project Grid**: Create/view projects
- **Project Details**:
  - File manager with upload
  - Code editor with syntax highlighting
  - Task list with progress tracking
  - Version history with changelog
- **Export Options**: PDF, DOCX, HTML exports
- **Project Metadata**: Last modified, file count, task count

#### 7. Memory System (NEW)
- **Visual Memory Management**: 6 categories:
  - Learning Preferences (style, pace, language)
  - Long-Term Goals (career, exam target, timeline)
  - Technical Skills (languages, level, focus)
  - Subjects of Interest (primary, secondary, hobbies)
  - Business & Education Details (school, course, experience)
  - Writing Style (tone, formality, audience)
- **Editable Preferences**: Click to edit any preference
- **Memory Toggle**: Enable/disable memory tracking
- **Data Management**: 
  - Export memory data
  - Create backups
  - Clear memory
  - Reset to defaults

#### 8. Settings Panel (NEW)
- **Theme Control**: Light, Dark, Neon modes
- **Notifications**: 
  - Message notifications
  - AI suggestions
  - Product updates
- **Privacy Controls**:
  - Data collection opt-in
  - Shared learning (for students)
- **Data Management**:
  - Export data
  - Download backups
  - Storage quota
- **Performance Settings**:
  - Low-end device mode
  - Reduce animations
- **Keyboard Shortcuts**: Customizable shortcuts
- **Danger Zone**: Account reset, account deletion

### Previous Features (Still Active)
- **Topic Explanation System**: Explains any topic with simple explanations, detailed breakdowns, examples, formulas, real-life applications, common mistakes, and practice questions
- **Image Generation**: Auto-generates educational images when explaining topics + "Create Image" button for custom image generation
- **Learning History Tracking**: Records all topics studied (subject, difficulty, completion status)
- **Focus Areas Analysis**: AI analyzes user's learning patterns to identify strength areas and weak topics
- **Data Export**: Export learning history and study materials as JSON (PDF-ready format)
- **Database Tables**:
  - `learningHistory` - Tracks all topics studied
  - `generatedImages` - Stores AI-generated images with context
  - `topicExplanations` - Caches detailed explanations for reuse
- **API Endpoints**:
  - `POST /api/explain-topic` - Generate comprehensive topic explanation with auto-generated image
  - `POST /api/generate-image` - Generate custom educational images
  - `GET /api/learning-history` - Fetch user's complete learning history
  - `GET /api/focus-areas` - Analyze user's strength areas and weak topics
  - `POST /api/export-data` - Export learning data as JSON/PDF
- **Chat UI Features**:
  - "Explain Topic" button - Opens form to select subject/topic
  - "Create Image" button - Opens panel for custom image generation
  - Both features integrated directly into Chat interface

### Website Generator (Previous)
- **Lovable AI-style Interface**: Split-view editor with live HTML/CSS/JS preview powered by Gemini API
- **Gemini Integration**: Uses gemini-2.5-flash model for intelligent website generation
- **Database Storage**: All generated websites stored in `generatedWebsites` table with metadata
- **Features**: Create from prompt, edit code, view live preview, favorite/delete websites, copy code
- **Route**: `/website-generator` page accessible via "Website" button in chat
- **API Endpoints**: 
  - `GET /api/websites` - List user's generated websites
  - `GET /api/websites/:id` - Get specific website with view count increment
  - `POST /api/websites/generate` - Generate new website from prompt
  - `PATCH /api/websites/:id` - Update website metadata or code
  - `DELETE /api/websites/:id` - Delete generated website

### AI Tutor Improvements
- **ChatGPT-like Responses**: Implemented expert system prompt with educational best practices
- **Voice-to-Text Chat Input**: Users can record voice, auto-transcribe to chat input, and send
- **OpenRouter Fallback**: AI Tutor uses OpenRouter as backup when OpenAI quota exceeded (only for chat, not Whisper)
- **Conversation Context**: AI Tutor maintains last 10 messages for better context-aware responses

### Live Session Features
- **Session Settings**: Configurable difficulty, language (English, Pidgin, Yoruba, Igbo, Hausa), AI model, recording timeout
- **Lesson Generation**: Auto-generate lessons from transcripts with objectives, key points, summary
- **Play/Pause Toggle**: Click recording's Play button to toggle playback
- **AI Fix Button**: Corrects text, provides summary, and extracts keywords

### API Endpoints Added
- `POST /api/chat/transcribe-voice` - Transcribe voice input to text in chat
- `POST /api/generate-lesson` - Generate structured lesson from transcript
- Enhanced `POST /api/chat/send` - Better system prompting for ChatGPT-like responses

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state, React hooks for local state
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens for light/dark themes
- **Design Philosophy**: Voice-first interface with progressive disclosure, inspired by Linear (clean typography), Stripe (purposeful animation), and Discord (voice-first UI)
- **Typography**: Google Fonts (Inter for UI, Space Grotesk for headings, JetBrains Mono for code)

**Rationale**: This stack provides a modern, performant developer experience with excellent TypeScript support. Radix UI ensures accessibility, while Tailwind enables rapid UI development. TanStack Query handles caching and synchronization elegantly.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful endpoints with WebSocket support for real-time features
- **File Upload**: Multer for handling multipart form data
- **Session Management**: express-session with PostgreSQL store (connect-pg-simple)
- **Authentication**: Replit Auth (OpenID Connect) using Passport.js strategy
- **Build System**: esbuild for production builds, tsx for development

**Rationale**: Express provides flexibility and a mature ecosystem. The monorepo structure (shared types between client/server) ensures type safety across the stack. WebSocket integration supports real-time transcription features.

### Database & ORM
- **Database**: PostgreSQL via Neon Serverless (WebSocket-based connection pooling)
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema**: Comprehensive schema covering users, courses, lessons, live sessions, transcripts, quizzes, chat messages, memory entries, purchases, analytics, file uploads, student profiles, and schools
- **Session Storage**: PostgreSQL-backed session table for authentication persistence

**Database Schema Highlights**:
- User roles: student, teacher, admin, lecturer, school
- Session states: active, paused, ended
- Quiz difficulties: easy, medium, hard
- Payment tracking with Paystack integration
- Comprehensive indexing on foreign keys and timestamps

**Rationale**: Drizzle provides type-safe database access with excellent TypeScript integration. Neon's serverless PostgreSQL eliminates connection management complexity and scales automatically. The schema supports multi-tenant scenarios (schools, teachers, students).

### AI & External Services

#### OpenAI Integration (Primary)
- **Services**: GPT models for chat/tutoring, Whisper for audio transcription, TTS for speech generation
- **Fallback Strategy**: OpenRouter as backup for chat completions (not for audio/Whisper)
- **Features**: Chat assistance, lesson generation, syllabus creation, quiz grading, audio transcription, speech synthesis, text summarization, flashcard generation

**Rationale**: OpenAI provides best-in-class models for educational AI features. The fallback mechanism ensures resilience against quota issues. Whisper is specifically retained on OpenAI as OpenRouter doesn't support audio processing.

#### Paystack Payment Integration
- **Market**: Specifically chosen for Nigerian market (NOT Stripe)
- **Features**: Payment initialization, transaction verification, webhook handling
- **Currency**: Nigerian Naira (kobo as smallest unit)

**Rationale**: User explicitly requested Paystack for the Nigerian education market. This decision prioritizes local payment method support and lower transaction fees for the target geography.

#### Replit Authentication
- **Protocol**: OpenID Connect (OIDC)
- **Session Strategy**: Server-side sessions stored in PostgreSQL
- **Cookie Security**: httpOnly, secure, 7-day TTL

**Rationale**: Replit Auth simplifies deployment on the Replit platform while providing standard OIDC authentication. PostgreSQL session storage ensures sessions persist across server restarts.

### Key Architectural Patterns

**Monorepo Structure**: 
- `/client` - React frontend
- `/server` - Express backend  
- `/shared` - Shared TypeScript types and schemas
- **Benefit**: Type safety across client-server boundary, reduced code duplication

**Blueprint Integration**: The codebase references specific Replit blueprints (javascript_database, javascript_openai, javascript_log_in_with_replit, javascript_websocket) indicating standardized integration patterns.

**Error Handling**: Centralized error handling with quota detection for API fallbacks, authentication error detection for automatic re-login flows.

**Real-time Features**: WebSocket server for live transcription sessions with connection state management.

**Progressive Enhancement**: Application gracefully handles missing environment variables and degrades features when services are unavailable.

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL with WebSocket support (`@neondatabase/serverless`)
- **Environment Variables Required**: `DATABASE_URL`, `SESSION_SECRET`

### Authentication & Session
- **Replit Auth**: OpenID Connect provider
- **Required Variables**: `REPL_ID`, `ISSUER_URL`
- **Session Store**: connect-pg-simple for PostgreSQL-backed sessions

### AI Services
- **OpenAI**: Primary AI provider
  - API Key: `OPENAI_API_KEY`
  - Services: GPT models, Whisper, TTS
- **OpenRouter**: Fallback for chat completions
  - API Key: `OPENROUTER_API_KEY`
  - Note: Only used for text-based chat, not audio
- **Google Gemini**: Website generation
  - API Key: `GEMINI_API_KEY`
  - Model: gemini-2.5-flash for fast website generation
  - Used for: Website Generator feature with code generation

### Payment Processing
- **Paystack**: Nigerian payment gateway
  - API Key: `PAYSTACK_SECRET_KEY`
  - Base URL: `https://api.paystack.co`
  - Critical: User explicitly chose this over Stripe for Nigerian market

### Development Tools
- **Vite Plugins**: 
  - Runtime error overlay
  - Cartographer (Replit integration)
  - Dev banner (Replit branding)
- **Build Tools**: esbuild, tsx for TypeScript execution

### UI Component Libraries
- **Radix UI**: Comprehensive set of accessible primitives (accordion, dialog, dropdown, popover, etc.)
- **Additional UI**: 
  - cmdk for command palette
  - react-dropzone for file uploads
  - vaul for drawer component
  - embla-carousel for carousels
  - recharts for data visualization
  - react-day-picker for calendars

### Fonts (Google Fonts CDN)
- Inter: UI text (400, 500, 600, 700)
- Space Grotesk: Headings (500, 700)
- JetBrains Mono: Code blocks (400, 500)