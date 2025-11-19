# LERNORY Design Guidelines

## Design Philosophy
**Reference-Based Approach**: Inspired by Linear (clean typography, spatial organization), Stripe (purposeful animation), and Discord (voice-first UI), creating a futuristic EdTech platform.

**Core Principles**:
1. **Voice-First Interface**: Large tap targets, clear audio states, prominent mic controls
2. **Progressive Disclosure**: Complex features revealed through interaction
3. **Academic Professionalism with Energy**: Futuristic aesthetics balanced with educational credibility

---

## Typography

**Font Stack** (Google Fonts):
- **Inter** (400, 500, 600, 700): UI text, body, forms
- **Space Grotesk** (500, 700): Headings, hero text
- **JetBrains Mono** (400, 500): Code blocks

**Scale**:
- Hero: `text-6xl`/`text-7xl` (Space Grotesk, bold)
- Page Titles: `text-4xl`/`text-5xl` (Space Grotesk, bold)
- Sections: `text-2xl`/`text-3xl` (Space Grotesk, medium)
- Body: `text-base`/`text-lg` (Inter, normal)
- UI Labels: `text-sm` (Inter, medium)
- Captions: `text-xs` (Inter, normal)

---

## Layout & Spacing

**Spacing Scale** (Tailwind):
- Micro: 1-2 | Standard: 4-8 | Sections: 12-20 | Large: 24-32

**Containers**:
- Main content: `max-w-7xl`
- Dashboard widgets: `max-w-5xl`
- Forms: `max-w-3xl`
- Reading: `max-w-prose`

**Grid Patterns**:
- Dashboard: 12-column, widgets span 4-6 cols
- Course cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Features: `grid-cols-1 lg:grid-cols-2` (asymmetric)

---

## Components

### Navigation
**Top Nav**:
- Fixed, `h-16` mobile / `h-20` desktop
- Backdrop blur, subtle bottom border with glow
- Logo left, actions center, profile right

**Sidebar** (Dashboard):
- `w-64` expandable to `w-16` (icons-only)
- Active state with glow accent

### Cards
**Standard**: `rounded-xl`, `p-6` desktop / `p-4` mobile, subtle border + glow, hover `scale-105`

**Elevated**: Glass-morphism (`backdrop-blur-md`), animated gradient border, deeper shadows

**Dashboard Widgets**: Icon header, metrics, micro-graphs, pulsing status dots

### Forms & Inputs
**Text Inputs**: `h-12`, `rounded-lg`, floating labels, focus glow, inline validation

**Voice Button**: `w-16 h-16` circular, pulsing when recording, waveform overlay, prominent in Live Session

**File Upload**: Drag-drop zone, preview thumbnails, animated progress bar

### Buttons
**Primary CTA**: `h-12 px-8`, `rounded-full`, gradient + glow, hover lift (`translate-y`)

**FAB**: `w-14 h-14`, fixed `bottom-8 right-8`, circular gradient, pulsing animation, expands for quick actions

### Data Display
**Transcript Pane**: Speaker segmentation (color-coded avatars), clickable timestamps, keyword highlights, auto-scroll with override, export dropdown

**Progress**: 
- Circular (SVG animated stroke) for course completion
- Linear bars for current tasks
- Heatmaps for weak topics

**Charts**: Animated, minimal aesthetic, hover tooltips, time-range filters, export option

### Overlays
**Modals**: Centered, `backdrop-blur`, `max-w-2xl` standard / `max-w-4xl` complex, scale+fade entrance, top-right close, ESC support

**Toasts**: Fixed top-right, slide-in, 5s auto-dismiss with progress bar, icon + message + optional action

---

## Page Structures

### Landing Page
**Hero**: Full viewport (`min-h-screen`), WebGL/three.js 3D background, gradient headline, typing subheadline, dual CTAs, scroll indicator

**Features** (3 sections):
1. Voice-First: 2-col, animated transcript demo + feature list
2. AI Courses: Asymmetric grid, parallax scroll
3. CBT: Full-width exam preview, animated transitions

**Social Proof**: Logo marquee, 3-col testimonials, animated statistics counter

**CTA**: Full-width gradient, inline email signup, trust indicators

**Footer**: 4-col (Product, Company, Resources, Legal), newsletter, social links with glow, language selector

### Student Dashboard
- Hero: Today's schedule widget with countdown
- Quick Start: 3 action cards (Live Session, AI Tutor, Upload Notes)
- Progress: Circular completion + weak topics
- Recent Activity feed
- FAB for quick session start

### Teacher Dashboard
- Active sessions card (live count)
- Course management grid
- Student analytics
- Marketplace earnings widget
- FAB for new course/exam

### Live Session
**Layout**: Transcript pane (70%) + controls panel (30%), stacked mobile

**Transcript**: Speaker tags, clickable timestamps, real-time streaming, keyword highlights, "Save as Lesson" button

**Controls**: Large record/pause + waveform, timer, participant list, settings (language, speaker detection, AI level)

### Course Builder
**Topic Input**: Large textarea, AI prompts, example carousel, "Generate Syllabus" button

**Syllabus Editor**: Drag-drop timeline, inline editing, auto-save indicator, smooth add/remove transitions

**Preview**: Animated header, lesson timeline, expandable cards, enroll/purchase button

---

## Visual Assets

**Hero**: 3D knowledge network with particle effects (neon on dark)

**Features**: 
- Voice: Transcript interface mockup
- AI: Course card collage
- CBT: Exam interface screenshot

**Dashboard**: Heroicons (icon illustrations, no photos)

**Courses**: Subject-specific abstracts (geometric = math, molecular = science)

**Testimonials**: Abstract avatar gradients

---

## Animation

**Micro-interactions**:
- Button hover: `scale-[1.02]` + shadow (150ms ease-out)
- Card hover: Lift + shadow (200ms ease-out)
- Input focus: Border glow (150ms)
- FAB: Infinite pulse (2s ease-in-out)

**Page Transitions**:
- Scroll-reveal: Fade + slide up (IntersectionObserver)
- Stagger: 50ms delay between siblings
- Routes: 300ms fade out/in

**Loading**: Skeleton shimmer, circular spinner, progress bars

**Reduced Motion**: Respect `prefers-reduced-motion`, use instant states + simple fades

---

## Accessibility (WCAG AA)

- **Touch targets**: Minimum 44×44px (`w-11 h-11`)
- **Contrast**: 4.5:1 for normal text
- **Focus**: 2px outline with offset on all interactive elements
- **Screen readers**: Labels for icon-only buttons, aria-live for validation
- **Keyboard**: Logical tab order, ESC closes modals
- **Skip link**: Top of page