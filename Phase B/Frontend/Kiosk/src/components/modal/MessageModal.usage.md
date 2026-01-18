# MessageModal Component Usage Guide

## Overview
A reusable modal component for displaying messages such as warnings, errors, info messages, or any type of notification. The modal features a backdrop blur/darkening effect, customizable icon, close button, and message text.

## Basic Usage

```jsx
import MessageModal from "@/components/modal/MessageModal";
import { ICONS } from "@/components/icons/icons.config";

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>Show Message</button>
      
      <MessageModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        icon={ICONS.BLOCK}
        message="This is a simple message"
      />
    </>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | - | **(Required)** Controls modal visibility |
| `onClose` | function | - | **(Required)** Callback when modal is closed |
| `icon` | string | - | **(Required)** Icon name from ICONS config |
| `message` | string\|array | - | **(Required)** Message text (string or array for multiple lines) |
| `iconColor` | string | "black" | Color for the icon |
| `iconSize` | number | 80 | Size of the icon in pixels |
| `backgroundColor` | string | "white" | Background color of modal |
| `textColor` | string | "black" | Color for message text |
| `closeIconColor` | string | "black" | Color for close button |
| `closeIconSize` | number | 32 | Size of close icon in pixels |
| `className` | string | "" | Additional CSS classes for the modal container |

## Examples

### Error Message (Multi-line)
```jsx
<MessageModal
  isOpen={showError}
  onClose={() => setShowError(false)}
  icon={ICONS.BLOCK}
  message={["Wrong verification code.", "Please try again."]}
  iconColor="black"
  textColor="black"
/>
```

### Warning Message (Custom Colors)
```jsx
<MessageModal
  isOpen={showWarning}
  onClose={() => setShowWarning(false)}
  icon={ICONS.HELP}
  message="Are you sure you want to proceed?"
  iconColor="#ff9800"
  textColor="#333"
  backgroundColor="#fff3cd"
/>
```

### Success Message
```jsx
<MessageModal
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  icon={ICONS.START}
  message="Operation completed successfully!"
  iconColor="#4caf50"
  textColor="#2e7d32"
  backgroundColor="#e8f5e9"
/>
```

### Info Message (Larger Icon)
```jsx
<MessageModal
  isOpen={showInfo}
  onClose={() => setShowInfo(false)}
  icon={ICONS.HELP}
  message="This is some important information you should know."
  iconColor="#2196f3"
  iconSize={100}
  textColor="#1565c0"
  backgroundColor="#e3f2fd"
/>
```

### Multi-line with Custom Styling
```jsx
<MessageModal
  isOpen={showMessage}
  onClose={() => setShowMessage(false)}
  icon={ICONS.SETTINGS}
  message={[
    "Your settings have been updated.",
    "Changes will take effect immediately.",
    "You can revert these changes anytime."
  ]}
  iconColor="#9c27b0"
  textColor="#4a148c"
  backgroundColor="#f3e5f5"
  className="border-4 border-purple-500"
/>
```

## Features

- ✅ **Responsive Design**: Automatically adjusts to different screen sizes
- ✅ **Backdrop Blur**: Blurs and darkens content behind the modal
- ✅ **Keyboard Support**: Press ESC to close the modal
- ✅ **Click Outside**: Click backdrop to close the modal
- ✅ **Body Scroll Lock**: Prevents scrolling when modal is open
- ✅ **Fade Animation**: Smooth fade-in animation
- ✅ **Fully Customizable**: Colors, sizes, and styling can be customized
- ✅ **Multi-line Support**: Pass an array of strings for multiple text lines
- ✅ **Accessibility**: Includes proper ARIA labels

## Available Icons

Import from `icons.config.js`:
- `ICONS.CART` - Shopping cart
- `ICONS.GROCERY_LIST` - List with checkmarks
- `ICONS.HELP` - Help/question mark
- `ICONS.LOGOUT` - Logout icon
- `ICONS.SETTINGS` - Settings gear
- `ICONS.START` - Start/play icon
- `ICONS.BACKSPACE` - Backspace icon
- `ICONS.CLOSE` - Close/X icon
- `ICONS.BLOCK` - Block/error icon

