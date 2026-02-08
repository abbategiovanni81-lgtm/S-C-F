# Ava AI Assistant - UI Guide

## Page Layout

### Ava Page (`/ava`)
The Ava page consists of two main sections:

```
┌─────────────────────────────────────────────────────────────┐
│                    Navigation Header                         │
├───────────┬─────────────────────────────────────────────────┤
│           │                                                   │
│ Sessions  │              Chat Interface                       │
│ Sidebar   │                                                   │
│           │   ┌─────────────────────────────────────────┐   │
│ ┌───────┐ │   │  Welcome Message / Chat Messages        │   │
│ │ New   │ │   │                                           │   │
│ │ Chat  │ │   │  [User Message]                          │   │
│ └───────┘ │   │                                           │   │
│           │   │  [Ava Response]                          │   │
│ ┌───────┐ │   │                                           │   │
│ │Session│ │   │  [Content Plan Card]                     │   │
│ │  #1   │ │   │                                           │   │
│ └───────┘ │   │  [User Feedback]                         │   │
│           │   │                                           │   │
│ ┌───────┐ │   │  [Ava Response]                          │   │
│ │Session│ │   │                                           │   │
│ │  #2   │ │   └─────────────────────────────────────────┘   │
│ └───────┘ │                                                   │
│           │   ┌─────────────────────────────────────────┐   │
│           │   │  Input: "Tell Ava what you want..."    │   │
│           │   │                                     [Send]│   │
│           │   └─────────────────────────────────────────┘   │
│           │                                                   │
└───────────┴───────────────────────────────────────────────────┘
```

## Component Hierarchy

```
Ava Page
├── Layout (Header + Sidebar Navigation)
├── Sessions Sidebar
│   ├── New Chat Button
│   └── Session Cards (clickable)
│       ├── Session Title
│       └── Last Updated Date
└── Chat Interface
    ├── AvaChat Component
    │   ├── ScrollArea (Messages)
    │   │   ├── Welcome Screen (if empty)
    │   │   │   ├── Greeting
    │   │   │   └── Quick Start Cards
    │   │   │       ├── "Create a Reel"
    │   │   │       ├── "Create a Carousel"
    │   │   │       ├── "Write a Blog Post"
    │   │   │       └── "Generate a Caption"
    │   │   └── Message List
    │   │       ├── User Messages (right-aligned, primary color)
    │   │       └── Ava Messages (left-aligned, muted background)
    │   │           ├── Text Messages
    │   │           ├── Content Plan Cards
    │   │           ├── Progress Cards
    │   │           ├── Preview Cards
    │   │           └── Schedule Cards
    │   └── Input Area
    │       ├── Text Input
    │       └── Send Button
    └── Typing Indicator (when Ava is responding)
```

## Card Components

### 1. Content Plan Card

**For Reels/Videos:**
```
┌─────────────────────────────────────────────────────┐
│ 🎬 Reel Plan                            [draft]     │
├─────────────────────────────────────────────────────┤
│ Duration: 30s                                       │
│                                                     │
│ Hook:                                              │
│ "Stop scrolling! This fitness tip will..."        │
│                                                     │
│ Scenes:                                            │
│ ┌─────────────────────────────────────────────┐   │
│ │ Scene 1                            3s        │   │
│ │ Close-up of person doing push-ups           │   │
│ │ "The secret to perfect form is..."          │   │
│ └─────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────┐   │
│ │ Scene 2                            5s        │   │
│ │ Demonstration of correct technique          │   │
│ │ "Watch how the back stays straight..."      │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ CTA:                                               │
│ "Follow for more fitness tips!"                   │
│                                                     │
│ [Approve & Generate]  [Edit Plan]                 │
└─────────────────────────────────────────────────────┘
```

**For Carousels:**
```
┌─────────────────────────────────────────────────────┐
│ 📱 Carousel Plan                    [square]       │
├─────────────────────────────────────────────────────┤
│ Format: Square                                      │
│                                                     │
│ Slides:                                            │
│ ┌─────────────────────────────────────────────┐   │
│ │ Slide 1                    [cover]           │   │
│ │ 5 Tips for Better Sleep                      │   │
│ │ Transform your nights starting tonight       │   │
│ └─────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────┐   │
│ │ Slide 2                    [content]         │   │
│ │ Tip #1: Consistent Schedule                  │   │
│ │ Go to bed at the same time every night      │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Caption:                                           │
│ "Better sleep = better life..."                   │
│                                                     │
│ [Approve & Generate]  [Edit Plan]                 │
└─────────────────────────────────────────────────────┘
```

### 2. Progress Card
```
┌─────────────────────────────────────────────────────┐
│ 🔄 Generating Video                                 │
├─────────────────────────────────────────────────────┤
│ Creating scenes and generating voiceover...        │
│                                                     │
│ [████████████░░░░░░░░░░░░░] 60%                  │
└─────────────────────────────────────────────────────┘
```

### 3. Preview Card
```
┌─────────────────────────────────────────────────────┐
│ 👁️  Preview                    [Open in Editor]    │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐   │
│ │                                              │   │
│ │         [Video Player]                       │   │
│ │                                              │   │
│ │              [▶ Play]                        │   │
│ │                                              │   │
│ │         Duration: 0:30                       │   │
│ │                                              │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 4. Schedule Card
```
┌─────────────────────────────────────────────────────┐
│ 📅 Schedule Your Post                              │
├─────────────────────────────────────────────────────┤
│ Select Date:                                       │
│ [📅 Tuesday, January 15, 2025      ▼]            │
│                                                     │
│ Select Time:                                       │
│ [🕐 14:30                           ▼]            │
│                                                     │
│ [Schedule Post]                                    │
│ [Add to Content Queue]                             │
└─────────────────────────────────────────────────────┘
```

## Color Scheme

- **User Messages**: Primary color background (purple/blue)
- **Ava Messages**: Muted background
- **Cards**: Card background with subtle borders
- **Buttons**: Primary action buttons in brand colors
- **Status Badges**: 
  - Draft: Amber/yellow
  - Approved: Green
  - Generating: Purple with pulse animation
  - Completed: Blue

## Avatars

- **User Avatar**: Circle with user icon, primary color background
- **Ava Avatar**: Circle with sparkles icon, purple gradient background

## Quick Start Cards (Empty State)

When no messages exist, display:
```
┌─────────────────────────────────────────────────────┐
│                   ✨                                 │
│             Hi! I'm Ava                             │
│                                                     │
│  I'm here to help you create amazing content       │
│  from scratch. Tell me what you'd like to          │
│  create, and I'll guide you through the entire     │
│  process!                                           │
│                                                     │
│  ┌─────────────┬─────────────┐                    │
│  │ 🎬 Create   │ 📱 Create   │                    │
│  │  a Reel     │  a Carousel │                    │
│  │ Generate    │ Multi-slide │                    │
│  │ short-form  │ Instagram   │                    │
│  │ video       │ post        │                    │
│  └─────────────┴─────────────┘                    │
│  ┌─────────────┬─────────────┐                    │
│  │ 📝 Write a  │ 💬 Generate │                    │
│  │  Blog Post  │  a Caption  │                    │
│  │ Long-form   │ Engaging    │                    │
│  │ content     │ social text │                    │
│  └─────────────┴─────────────┘                    │
└─────────────────────────────────────────────────────┘
```

## Responsive Behavior

### Desktop (1024px+)
- Full sidebar (256px width)
- Side-by-side layout
- All card details visible

### Tablet (768px - 1023px)
- Collapsible sidebar
- Full chat interface when sidebar collapsed
- Cards maintain full width

### Mobile (< 768px)
- Sessions in drawer/modal
- Full-width chat interface
- Stacked card layouts
- Larger touch targets

## Animation & Interactions

### Message Appearance
- Fade in with slight slide up
- Staggered animation for multiple messages

### Typing Indicator
- Three animated dots bouncing
- Appears when Ava is processing

### Card Interactions
- Hover effects on buttons
- Smooth transitions on expand/collapse
- Loading states with skeleton screens

### Auto-scroll
- Smooth scroll to bottom when new messages arrive
- Maintain scroll position when user is reading history

## Accessibility

- **Keyboard Navigation**: Full support with Tab and Enter
- **Screen Readers**: Proper ARIA labels on all interactive elements
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Clear focus states on all focusable elements
- **Error States**: Clear error messages with instructions

## State Management

### Loading States
- Initial session load: Spinner with "Creating your chat session..."
- Message sending: Disabled input, typing indicator
- Content generation: Progress card with percentage

### Error States
- API errors: Toast notification with retry option
- Invalid input: Inline error message
- Network issues: Persistent banner with retry

### Success States
- Message sent: Clear input, new message appears
- Plan approved: Success toast, status badge update
- Content scheduled: Confirmation toast with details
