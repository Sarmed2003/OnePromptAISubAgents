# DinoLab Web Application - Responsive Design Strategy

## Overview

This document outlines the responsive design strategy for the DinoLab web application. It serves as a comprehensive guide for developers and a test plan for QA teams to ensure consistent, accessible user experience across all device sizes and interaction modes.

## Table of Contents

1. [Breakpoints](#breakpoints)
2. [Layout Changes by Breakpoint](#layout-changes-by-breakpoint)
3. [Touch vs. Mouse Interactions](#touch-vs-mouse-interactions)
4. [Component-Specific Behavior](#component-specific-behavior)
5. [Testing Checklist](#testing-checklist)

---

## Breakpoints

DinoLab uses **Tailwind CSS breakpoints** as the standard for responsive design. The following breakpoints define layout transitions:

| Breakpoint | CSS Width | Device Type | Use Case |
|------------|-----------|-------------|----------|
| **xs** | < 640px | Mobile phones | Portrait phones, small screens |
| **sm** | ≥ 640px | Small tablets | Landscape phones, small tablets |
| **md** | ≥ 768px | Tablets | iPad, standard tablets |
| **lg** | ≥ 1024px | Small desktops | Laptops, smaller desktop monitors |
| **xl** | ≥ 1280px | Desktops | Standard desktop monitors |
| **2xl** | ≥ 1536px | Large desktops | Large monitors, ultra-wide displays |

### Primary Design Breakpoints

For DinoLab, we focus on three primary responsive tiers:

- **Mobile (xs-sm)**: < 640px — Optimized for touch, single-column layouts
- **Tablet (md-lg)**: 640px–1024px — Hybrid touch/mouse, transitional layouts
- **Desktop (xl+)**: ≥ 1024px — Optimized for mouse/keyboard, multi-column layouts

---

## Layout Changes by Breakpoint

### Mobile (xs-sm: < 640px)

#### Overall Layout
- **Single-column stack**: All major panels (AnatomyViewer, BoneDetailPanel, ScientificResearchConsole) stack vertically
- **Full-width panels**: Each panel spans 100% of viewport width
- **Reduced padding/margins**: Tighter spacing to maximize screen real estate (8px–12px gutters)
- **Bottom navigation/tabs**: Primary navigation moves to bottom for thumb-friendly access

#### AnatomyViewer Component
- **Dimensions**: Full width, height constrained to 50–60% of viewport height
- **Controls**: Simplified toolbar, icons only (no text labels)
- **Zoom/Pan**: Touch-friendly gesture controls (pinch-to-zoom, drag-to-pan)
- **Rotation**: Single-finger drag for rotation (no 3-button mouse emulation)
- **Canvas scaling**: Responsive canvas that maintains aspect ratio

#### BoneDetailPanel
- **Display**: Stacked below viewer, full width
- **Content**: Collapsed by default on mobile; expandable accordion sections
- **Text size**: Minimum 16px for readability and touch target sizing
- **Images/diagrams**: Single-column, 100% width with responsive aspect ratios

#### ScientificResearchConsole
- **Position**: Bottom of stack, full width
- **Table/data**: Horizontal scroll enabled for tables that exceed screen width
- **Charts**: Simplified, single-series or stacked layouts; responsive sizing

**Example**: On a 375px iPhone, the layout appears as:
```
┌─────────────────┐
│   Navigation    │
├─────────────────┤
│  AnatomyViewer  │ (300px height)
│   (3D canvas)   │
├─────────────────┤
│ BoneDetailPanel │ (collapsed/accordion)
├─────────────────┤
│  Research Cons. │ (scrollable table)
├─────────────────┤
│ Bottom Nav Tabs │
└─────────────────┘
```

---

### Tablet (md-lg: 640px–1024px)

#### Overall Layout
- **Two-column or hybrid layout**: Viewer on left/top, detail panel on right/bottom
- **Flexible grid**: Use CSS Grid or Flexbox to adapt panel proportions
- **Moderate padding**: 16px–20px gutters
- **Top navigation**: Horizontal navigation bar restored

#### AnatomyViewer Component
- **Dimensions**: 50–60% of viewport width, 400–500px height
- **Controls**: Full toolbar with icons + abbreviated text labels
- **Gestures**: Support both touch (pinch, drag) and mouse (scroll wheel zoom, click-drag rotation)
- **Canvas scaling**: Maintains 3D quality while adapting to available space

#### BoneDetailPanel
- **Display**: Adjacent to viewer (right side) or below (depending on orientation)
- **Content**: Expanded sections visible by default; collapsible for space management
- **Text size**: 14px–16px
- **Images**: Two-column layout where applicable

#### ScientificResearchConsole
- **Position**: Below panels or in a tabbed interface
- **Table/data**: Horizontal scroll for large tables; consider pagination
- **Charts**: Multi-series charts supported; responsive sizing

**Example**: On a 768px iPad in portrait, the layout appears as:
```
┌──────────────────────────────┐
│      Top Navigation          │
├──────────────┬───────────────┤
│  AnatomyView │ BoneDetailPan │
│  (3D canvas) │ (info + image)│
│  (400×400px) │               │
├──────────────┴───────────────┤
│  Research Console (tabs)     │
│  [Charts] [Data] [Export]    │
└──────────────────────────────┘
```

---

### Desktop (xl+: ≥ 1024px)

#### Overall Layout
- **Multi-column layout**: Optimal use of horizontal space
- **Three-panel or dashboard layout**: Viewer, detail panel, and console visible simultaneously
- **Generous padding**: 24px–32px gutters
- **Sidebar navigation**: Optional persistent sidebar for quick access

#### AnatomyViewer Component
- **Dimensions**: 500–700px width, 600px+ height (maintains 3D quality)
- **Controls**: Full toolbar with icons + descriptive text labels
- **Interactions**: Mouse-optimized (hover tooltips, right-click context menus)
- **Performance**: Render at full quality; no aggressive simplification

#### BoneDetailPanel
- **Display**: Right sidebar or dedicated panel
- **Content**: All sections expanded and visible
- **Text size**: 14px–15px
- **Images**: Multi-column grid (2–3 columns)
- **Scrollable area**: Internal scroll if content exceeds panel height

#### ScientificResearchConsole
- **Position**: Bottom panel or tabbed interface below viewer
- **Table/data**: Full-width tables with horizontal scroll for overflow
- **Charts**: Large, interactive charts; multiple series supported
- **Export**: Prominent export/download buttons

**Example**: On a 1440px desktop monitor, the layout appears as:
```
┌─────────────────────────────────────────────────────────┐
│                  Top Navigation Bar                     │
├──────────────────┬──────────────────┬──────────────────┤
│                  │                  │                  │
│  AnatomyViewer   │ BoneDetailPanel  │  Quick Actions   │
│  (3D canvas)     │ (expandable info)│  & Sidebar       │
│  (600×600px)     │                  │                  │
│                  │                  │                  │
├──────────────────┴──────────────────┴──────────────────┤
│                                                          │
│  Scientific Research Console (full-width)               │
│  [Charts Tab] [Data Tab] [Export] [Settings]            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Touch vs. Mouse Interactions

### Mobile & Tablet (Touch-First)

#### Interaction Patterns

| Interaction | Mobile/Tablet | Implementation |
|-------------|---------------|----------------|
| **Selection** | Tap (single-finger) | Tap to select bone, highlight with color change |
| **Rotation** | Drag (single-finger) | Drag across canvas to rotate 3D model |
| **Zoom** | Pinch (two-finger) | Pinch-to-zoom in/out on 3D viewer |
| **Pan** | Two-finger drag | Drag with two fingers to pan canvas |
| **Context menu** | Long-press (hold 1s) | Show context menu with options (copy, export, etc.) |
| **Scroll** | Vertical swipe | Scroll through detail panel and console |
| **Tab switching** | Tap tab label | Switch between console tabs |
| **Button activation** | Tap | Minimum 44×44px touch target size |

#### Visual Feedback
- **Active state**: Highlight background color (e.g., `bg-blue-100`)
- **Press state**: Darker background or opacity change (e.g., `opacity-80`)
- **No hover state**: Avoid hover-based interactions; use active/press states instead
- **Ripple effect**: Optional material-design ripple on button press

#### Touch-Specific CSS
```css
/* Remove tap highlight on iOS */
-webkit-tap-highlight-color: transparent;

/* Ensure touch targets are sized appropriately */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Disable text selection on interactive elements */
.interactive {
  user-select: none;
  -webkit-user-select: none;
}
```

---

### Desktop (Mouse-Optimized)

#### Interaction Patterns

| Interaction | Desktop | Implementation |
|-------------|---------|----------------|
| **Selection** | Click (left-mouse) | Click to select bone, highlight with color change |
| **Rotation** | Click-drag (left-mouse) | Click and drag to rotate 3D model smoothly |
| **Zoom** | Scroll wheel | Scroll up/down to zoom in/out |
| **Pan** | Middle-mouse drag or Shift+click-drag | Pan canvas without rotation |
| **Context menu** | Right-click | Show context menu with copy, export, inspect options |
| **Hover interaction** | Mouse over element | Show tooltip, highlight bone, preview info |
| **Keyboard shortcuts** | Key press | Ctrl+C (copy), Ctrl+S (save), Arrow keys (navigate) |
| **Double-click** | Double-click | Reset view, expand/collapse panel |

#### Visual Feedback
- **Hover state**: Subtle background color or border change (e.g., `hover:bg-gray-50`, `hover:border-blue-500`)
- **Active state**: Darker background, underline, or highlight (e.g., `bg-blue-600`, `text-white`)
- **Focus state**: Visible focus ring for keyboard navigation (e.g., `focus:ring-2 focus:ring-blue-500`)
- **Tooltip**: Show on hover after 200ms delay
- **Cursor changes**: Use context-specific cursors (`cursor-pointer`, `cursor-grab`, `cursor-zoom-in`)

#### Desktop-Specific CSS
```css
/* Hover states for desktop */
.interactive:hover {
  background-color: rgba(59, 130, 246, 0.1);
  cursor: pointer;
}

/* Tooltip on hover */
.interactive[title]:hover::after {
  content: attr(title);
  position: absolute;
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1000;
}

/* Focus ring for keyboard navigation */
.interactive:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

---

### Hybrid Interactions (Tablet in Landscape)

On tablets in landscape mode, support both touch and mouse (via trackpad or connected mouse):

- **Touch**: Primary interaction; all touch patterns apply
- **Mouse**: Secondary interaction; hover states available but not required
- **Fallback**: If hover is used, ensure all functionality is also accessible via tap/click
- **Cursor**: Show appropriate cursor (pointer on hover, grab on draggable)

---

## Component-Specific Behavior

### AnatomyViewer

#### Mobile (xs-sm)
- Canvas height: 50–60% of viewport height (max 400px)
- Toolbar: Icons only, arranged vertically or in a compact row
- Controls: Simplified rotation/zoom (no advanced options)
- Performance: Reduced mesh complexity if needed for smooth interaction

#### Tablet (md-lg)
- Canvas height: 400–500px
- Toolbar: Icons + abbreviated labels
- Controls: Full rotation, zoom, pan options
- Performance: Standard mesh complexity

#### Desktop (xl+)
- Canvas height: 600px+
- Toolbar: Icons + full descriptive labels, organized in logical groups
- Controls: Advanced options (lighting, shading, measurement tools)
- Performance: High-quality mesh, full detail

### BoneDetailPanel

#### Mobile (xs-sm)
- Display: Collapsed accordion by default
- Sections: One section expanded at a time
- Images: Single column, full width
- Scrollable: Yes, internal scroll

#### Tablet (md-lg)
- Display: Partially expanded (2–3 key sections visible)
- Sections: Multiple sections can be expanded
- Images: Two-column layout
- Scrollable: Yes, internal scroll

#### Desktop (xl+)
- Display: Fully expanded
- Sections: All sections visible and organized
- Images: Two-column or three-column grid
- Scrollable: Yes, with smooth scroll behavior

### ScientificResearchConsole

#### Mobile (xs-sm)
- Display: Tabbed interface (one tab visible at a time)
- Tables: Horizontal scroll for overflow
- Charts: Simplified, single-series or stacked
- Export: Icon button only

#### Tablet (md-lg)
- Display: Tabbed interface with visible tab labels
- Tables: Horizontal scroll, pagination optional
- Charts: Multi-series supported, responsive sizing
- Export: Button with icon + text

#### Desktop (xl+)
- Display: Full-width panel, tabs or split view
- Tables: Full-width, horizontal scroll for large tables
- Charts: Large, interactive, multi-series
- Export: Prominent button with dropdown options

---

## Testing Checklist

### Mobile Testing (xs-sm: < 640px)

#### Layout & Visibility
- [ ] All panels stack vertically in single-column layout
- [ ] No horizontal scrolling required for main content
- [ ] Text is readable at default zoom level (minimum 16px)
- [ ] Images scale responsively and maintain aspect ratio
- [ ] Navigation is accessible at bottom of screen (thumb-friendly)

#### AnatomyViewer Component
- [ ] 3D canvas renders and is interactive
- [ ] Single-finger drag rotates model smoothly
- [ ] Pinch-to-zoom zooms in/out correctly
- [ ] Model remains visible and interactive after zoom
- [ ] Toolbar buttons are at least 44×44px and tappable

#### BoneDetailPanel
- [ ] Panel is collapsed by default
- [ ] Accordion sections expand/collapse on tap
- [ ] Text is readable without zooming
- [ ] Images load and display correctly
- [ ] Scrolling works smoothly within panel

#### ScientificResearchConsole
- [ ] Tabs are tappable and switch content correctly
- [ ] Tables have horizontal scroll enabled
- [ ] Charts are visible and interactive (if applicable)
- [ ] Export button is accessible and functional
- [ ] Data is readable without excessive zooming

#### Touch Interactions
- [ ] No hover states are triggered by touch
- [ ] Long-press (1s) shows context menu if applicable
- [ ] Tap targets have adequate spacing (minimum 8px)
- [ ] No accidental selections when scrolling
- [ ] Gestures work as documented (drag, pinch, tap)

#### Performance
- [ ] Page loads within 3 seconds on 4G
- [ ] 3D viewer renders smoothly (30+ fps)
- [ ] Scrolling is smooth and responsive
- [ ] No layout shift after interaction
- [ ] Memory usage is reasonable (no excessive growth)

---

### Tablet Testing (md-lg: 640px–1024px)

#### Layout & Visibility
- [ ] Two-column or hybrid layout is displayed correctly
- [ ] Panels are proportionally sized and visible
- [ ] No unwanted horizontal scrolling
- [ ] Text is readable at default zoom level
- [ ] Images scale appropriately for screen size

#### AnatomyViewer Component
- [ ] 3D canvas is sized appropriately (50–60% width)
- [ ] Single-finger drag rotates model smoothly
- [ ] Pinch-to-zoom works on touch devices
- [ ] Mouse scroll wheel zooms (if mouse is connected)
- [ ] Toolbar is fully visible and accessible

#### BoneDetailPanel
- [ ] Panel displays adjacent to or below viewer
- [ ] Multiple sections can be expanded simultaneously
- [ ] Content is scrollable if it exceeds panel height
- [ ] Images are displayed in appropriate layout (1–2 columns)
- [ ] Panel can be collapsed to maximize viewer space

#### ScientificResearchConsole
- [ ] Console is visible in tab or split view
- [ ] Tabs switch content smoothly
- [ ] Tables are readable with horizontal scroll if needed
- [ ] Charts display correctly and are interactive
- [ ] Export functionality works

#### Hybrid Interactions
- [ ] Touch gestures work as expected
- [ ] Mouse hover shows tooltips (if connected)
- [ ] Click interactions work alongside touch
- [ ] No conflicts between touch and mouse events
- [ ] Cursor changes appropriately (pointer, grab, etc.)

#### Performance
- [ ] Page loads within 2 seconds on LTE
- [ ] 3D viewer renders smoothly (30+ fps)
- [ ] Scrolling and panning are responsive
- [ ] Switching tabs is instantaneous
- [ ] No memory leaks during extended use

---

### Desktop Testing (xl+: ≥ 1024px)

#### Layout & Visibility
- [ ] Multi-column layout displays all panels simultaneously
- [ ] Panels are sized appropriately and well-proportioned
- [ ] No unwanted scrolling (horizontal or vertical)
- [ ] Text is readable and properly sized (14px–16px)
- [ ] High-quality images and diagrams are displayed

#### AnatomyViewer Component
- [ ] 3D canvas is large and detailed (600px+ height)
- [ ] Left-mouse click-drag rotates model smoothly
- [ ] Scroll wheel zooms in/out accurately
- [ ] Right-click shows context menu
- [ ] Keyboard shortcuts work (if implemented)

#### BoneDetailPanel
- [ ] Panel displays all content without excessive scrolling
- [ ] Multiple sections are expanded and visible
- [ ] Images are displayed in grid layout (2–3 columns)
- [ ] Content is well-organized and easy to scan
- [ ] Scrolling within panel is smooth

#### ScientificResearchConsole
- [ ] Console displays full-width below panels
- [ ] Tables are fully visible with horizontal scroll for overflow
- [ ] Charts are large, interactive, and display multiple series
- [ ] Export options are prominent and functional
- [ ] Data is easily readable and analyzable

#### Mouse Interactions
- [ ] Hover states are visible and provide useful feedback
- [ ] Tooltips appear on hover (200ms delay)
- [ ] Focus rings are visible for keyboard navigation
- [ ] Right-click context menus work correctly
- [ ] Cursor changes appropriately for different interactions

#### Keyboard Navigation
- [ ] Tab key navigates through interactive elements
- [ ] Enter/Space activates buttons and controls
- [ ] Arrow keys navigate within lists or panels (if applicable)
- [ ] Escape closes modals or context menus
- [ ] Keyboard shortcuts are documented and functional

#### Performance
- [ ] Page loads within 1 second on broadband
- [ ] 3D viewer renders at full quality (60 fps)
- [ ] Interactions are instant and responsive
- [ ] No lag when switching tabs or expanding panels
- [ ] Memory usage is stable during extended sessions

---

### Cross-Breakpoint Testing

#### Responsive Transitions
- [ ] Layout adapts correctly when resizing browser window
- [ ] No content is hidden or lost during transitions
- [ ] Components reflow smoothly without jumps
- [ ] Images and canvas resize proportionally
- [ ] Text remains readable at all sizes

#### Orientation Changes
- [ ] Layout adapts when device is rotated (portrait ↔ landscape)
- [ ] Content is not lost or hidden during rotation
- [ ] Touch targets remain appropriately sized
- [ ] No layout shift or flickering
- [ ] Scroll position is preserved if possible

#### Accessibility
- [ ] Color contrast meets WCAG AA standards
- [ ] Touch targets are at least 44×44px on mobile
- [ ] Focus indicators are visible for keyboard navigation
- [ ] Alt text is provided for images
- [ ] Semantic HTML is used (buttons, links, headings)

#### Browser Compatibility
- [ ] Chrome/Edge (latest) on all breakpoints
- [ ] Firefox (latest) on all breakpoints
- [ ] Safari (latest) on all breakpoints
- [ ] Mobile Safari on iOS devices
- [ ] Chrome on Android devices

---

## Implementation Notes for Developers

### Global CSS Considerations

Ensure `global.css` includes:

```css
/* Responsive base styles */
body {
  font-size: 16px; /* Mobile default */
}

@media (min-width: 768px) {
  body {
    font-size: 15px; /* Tablet */
  }
}

@media (min-width: 1024px) {
  body {
    font-size: 14px; /* Desktop */
  }
}

/* Touch-friendly defaults */
button, a {
  min-height: 44px;
  min-width: 44px;
}

/* Disable tap highlight on mobile */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}
```

### Component Guidelines

- **AnatomyViewer**: Use responsive canvas sizing; consider performance on mobile
- **BoneDetailPanel**: Implement collapsible sections for mobile; expand on desktop
- **ScientificResearchConsole**: Use tabbed interface on mobile; consider split view on desktop
- **All components**: Test with real devices, not just browser emulation

---

## References

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Mobile-First CSS](https://www.nngroup.com/articles/mobile-first-css/)
- [Touch Target Size Guidelines](https://www.nngroup.com/articles/touch-target-size/)
- [WCAG 2.1 Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSS Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|----------|
| 1.0 | Initial | DinoLab Team | Created responsive design strategy and testing checklist |

---

## Questions & Support

For questions about responsive design implementation or testing, please refer to the development team or QA lead. This document will be updated as the application evolves and new breakpoints or interaction patterns are added.
