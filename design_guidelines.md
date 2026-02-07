# Design Guidelines: CloudOffice Virtual Workspace & Marketplace

## Design Approach

**System:** Linear's minimalist productivity UX adapted for dark mode, combined with Discord's sophisticated glass-morphism and depth layering.

**Core Principles:**
1. Dark-first design with premium glass effects
2. Depth through layering, not harsh borders
3. Vibrant accents guide attention efficiently
4. Professional polish with futuristic edge
5. Clear information hierarchy in low-light

---

## Color Palette

**Backgrounds:**
- App Shell: #0B0F19 (deep charcoal)
- Cards/Panels: #151B2B with 40% opacity glass effect
- Elevated Elements: #1A2235 with subtle cyan glow
- Input Fields: #0F1419 with border glow on focus

**Accents:**
- Primary: Cyan #06B6D4 (interactive elements, CTAs)
- Secondary: Teal #14B8A6 (success states, confirmations)
- Gradient Overlays: Linear from cyan to teal at 45deg, 20% opacity
- Glow Effects: Cyan shadow with 24px blur on hover

**Text:**
- Primary: #F1F5F9 (near white)
- Secondary: #94A3B8 (slate gray)
- Muted/Labels: #64748B
- Disabled: #475569

**Functional:**
- Error: #EF4444, Warning: #F59E0B, Success: #10B981
- Borders: #1E293B with 30% opacity

---

## Typography

**Font:** Inter via Google Fonts

**Hierarchy:**
- Hero/Marketing: text-5xl font-bold with cyan gradient text effect
- Page Titles: text-3xl font-semibold text-gray-50
- Section Headers: text-xl font-semibold
- Body: text-base font-normal leading-relaxed
- Labels: text-sm font-medium text-gray-400
- Metadata: text-xs text-gray-500

---

## Layout System

**Spacing Units:** 2, 4, 6, 8, 12, 16, 20, 24 (Tailwind scale)

**Shell Structure:**
- Sidebar: w-64, glass background with subtle border-r glow
- Top Bar: h-16, glass effect with bottom border glow
- Content: px-8 py-6, max-w-7xl containers
- Marketplace pages: Full-width hero with gradient overlay, contained content sections below

**Grid Patterns:**
- Dashboard: 3-column on lg, 2-column on md, stacked mobile
- Marketplace listings: 4-column grid (xl), 3-column (lg), masonry on mobile
- Task boards: Flexible column widths with gap-6

---

## Component Library

### Glass-Morphism Cards
- Background: bg-slate-900/40 with backdrop-blur-xl
- Border: 1px solid white/10 with subtle cyan glow
- Padding: p-6 for standard, p-8 for feature cards
- Rounded: rounded-xl
- Shadow: Drop shadow with cyan tint

### Buttons
- Primary: Solid cyan fill, white text, rounded-lg px-6 py-3, glow on hover
- Secondary: Glass background with cyan border, cyan text
- Ghost: Transparent with hover glass effect
- Icon buttons: p-2.5 rounded-lg with hover glow

### Navigation
- Sidebar items: Icon (20px Heroicons) + label, active state with cyan accent bar and glass background
- Logo area at top with gradient treatment
- User profile at bottom with status indicator ring

### Data Tables
- Glass header row (sticky)
- Alternating row opacity (bg-slate-800/20)
- Hover: Cyan glow from left edge
- Action buttons right-aligned, icon-only

### Forms
- Inputs: Dark fill with cyan border glow on focus, rounded-lg
- Labels: text-sm text-gray-300 above inputs
- Grouped sections: Glass panel with p-6
- Form actions: Right-aligned button group

### Marketplace Components
- Office Listing Cards: Large preview image (aspect-video), glass overlay with pricing badge (top-right), amenities icons row, "Book Tour" CTA
- Category filters: Horizontal pill navigation with active cyan underline glow
- Hero search bar: Large glass panel with location/date/capacity inputs, prominent search button

### Specialized Widgets
- KPI Cards: Large metric (text-4xl gradient), trend arrow, sparkline chart placeholder
- Activity Feed: Avatar with cyan ring for active users, glass message bubbles, timestamp positioning
- Meeting Cards: Glass panel with participant avatars (stacked), join button with pulse effect
- Status Stories: Circular avatars (64px) with gradient ring, horizontal scroll

### Chat Interface
- Left panel (w-80): Thread list with glass backgrounds
- Message area: Right-aligned sent (cyan accent), left-aligned received (glass)
- Input bar: Fixed bottom, glass with cyan focus glow
- Typing indicators: Animated dots in cyan

---

## Visual Effects

**Gradients:** Subtle overlays on hero sections, card backgrounds (10-20% opacity)
**Glow:** Cyan shadow (0 0 24px cyan/30) on hover states
**Glass:** backdrop-blur-xl with bg opacity 40%
**Borders:** 1px with 10% white opacity, cyan glow on interactive elements

---

## Images

**Hero Section:** Full-width (h-screen), futuristic office space imagery with dark gradient overlay (from transparent to charcoal). Search bar centered with glass treatment. CTAs use glass buttons with blurred backgrounds.

**Marketplace Listings:** High-quality office interior photos, aspect-video ratio

**Dashboard:** Placeholder charts/graphs with cyan accent colors

**Team/Profile:** Circular avatars with subtle cyan glow border for online status

---

## Accessibility

- Focus rings: 2px cyan outline
- Sufficient contrast (WCAG AA on dark backgrounds)
- Hover states: Subtle glow, no color-only indicators
- Disabled: 40% opacity with cursor-not-allowed

---

This dark-themed system creates a premium, professional workspace environment with futuristic sophistication suitable for both internal productivity tools and public marketplace presentation.