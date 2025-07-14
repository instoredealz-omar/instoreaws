# Modal Background Interaction Guide

## Overview
The application now supports both blocking and non-blocking modals, giving you flexibility in how users interact with your UI when modals are open.

## Features

### Blocking Modals (Default)
- Prevents background scrolling
- Blocks interaction with background elements
- Darker overlay (bg-black/80)
- Traditional modal behavior

### Non-blocking Modals
- Allows background scrolling
- Allows interaction with background elements
- Lighter overlay (bg-black/20)
- Modern, less intrusive modal behavior

## Implementation Options

### Option 1: Using Regular Dialog Components with Props

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Blocking modal (default)
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Blocking Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Blocking Modal</DialogTitle>
    </DialogHeader>
    <p>Background interaction is blocked</p>
  </DialogContent>
</Dialog>

// Non-blocking modal
<Dialog allowBackgroundInteraction={true}>
  <DialogTrigger asChild>
    <Button>Open Non-blocking Modal</Button>
  </DialogTrigger>
  <DialogContent allowBackgroundInteraction={true}>
    <DialogHeader>
      <DialogTitle>Non-blocking Modal</DialogTitle>
    </DialogHeader>
    <p>Background interaction is allowed</p>
  </DialogContent>
</Dialog>
```

### Option 2: Using Dedicated Non-blocking Components

```tsx
import { 
  NonBlockingDialog, 
  NonBlockingDialogContent, 
  NonBlockingDialogHeader, 
  NonBlockingDialogTitle, 
  NonBlockingDialogTrigger 
} from '@/components/ui/non-blocking-dialog';

<NonBlockingDialog>
  <NonBlockingDialogTrigger asChild>
    <Button>Open Non-blocking Modal</Button>
  </NonBlockingDialogTrigger>
  <NonBlockingDialogContent>
    <NonBlockingDialogHeader>
      <NonBlockingDialogTitle>Non-blocking Modal</NonBlockingDialogTitle>
    </NonBlockingDialogHeader>
    <p>Background interaction is always allowed</p>
  </NonBlockingDialogContent>
</NonBlockingDialog>
```

### Option 3: Using the Hooks Directly

```tsx
import { useNonBlockingModal } from '@/hooks/use-non-blocking-modal';
import { useModalLock } from '@/hooks/use-modal-lock';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // For non-blocking behavior
  useNonBlockingModal(isModalOpen);
  
  // For blocking behavior
  useModalLock(isModalOpen);
  
  return (
    // Your custom modal implementation
  );
}
```

## Alert Dialogs

Alert dialogs also support the same functionality:

```tsx
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Blocking alert (default)
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button>Open Blocking Alert</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    {/* Alert content */}
  </AlertDialogContent>
</AlertDialog>

// Non-blocking alert
<AlertDialog allowBackgroundInteraction={true}>
  <AlertDialogTrigger asChild>
    <Button>Open Non-blocking Alert</Button>
  </AlertDialogTrigger>
  <AlertDialogContent allowBackgroundInteraction={true}>
    {/* Alert content */}
  </AlertDialogContent>
</AlertDialog>
```

## CSS Classes

The system uses these CSS classes for styling:

```css
/* Blocking modal state */
body[data-modal-open] {
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
}

/* Non-blocking modal state */
body[data-non-blocking-modal-open] {
  /* No restrictions - background remains interactive */
}

/* Blocking overlay */
.modal-overlay {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  pointer-events: auto;
}

/* Non-blocking overlay */
.modal-overlay-non-blocking {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(2px);
  pointer-events: none;
}
```

## Demo

Visit `/modal-demo` to see interactive examples of both blocking and non-blocking modals in action.

## Technical Details

### Blocking Modal Behavior
- Sets `body` position to `fixed` and `overflow` to `hidden`
- Stores and restores scroll position
- Overlay has `pointer-events: auto` to capture clicks
- Background elements become uninteractable

### Non-blocking Modal Behavior
- No restrictions on `body` element
- Allows natural scrolling and interaction
- Overlay has `pointer-events: none` to allow clicks through
- Background elements remain fully interactive

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `allowBackgroundInteraction` | `boolean` | `false` | Enables non-blocking modal behavior |

### Components That Support This Feature

- `Dialog` and all related components
- `AlertDialog` and all related components
- `NonBlockingDialog` (dedicated non-blocking version)

## Use Cases

### When to Use Blocking Modals
- Critical alerts that require immediate attention
- Forms where you want to prevent accidental navigation
- Confirmation dialogs for destructive actions
- Traditional modal workflows

### When to Use Non-blocking Modals
- Information overlays that don't require immediate action
- Help tooltips or contextual information
- Modals that work alongside other UI elements
- Modern, less intrusive user experiences
- Situations where users need to reference background content

## Best Practices

1. **Use blocking modals for critical interactions** that require user attention
2. **Use non-blocking modals for supplementary information** that enhances the experience
3. **Consider user context** - non-blocking modals work well when users need to reference background content
4. **Test on mobile devices** - non-blocking modals can be especially useful on smaller screens
5. **Provide clear visual cues** - ensure users understand what type of modal they're interacting with