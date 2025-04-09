# Alert System Usage Guide

This guide explains how to use the unified alert system across the SPUP Ethics Review Committee Platform.

## Alert Component Overview

The alert system provides a consistent way to display notifications to users. All alerts appear in the bottom-right corner of the screen by default, feature a progress indicator for auto-dismissal, include appropriate icons based on alert type, and can be customized with different styles.

## Key Features

- **Auto-closing with progress indicator**: All alerts automatically close after a certain duration, with a visual progress bar showing the remaining time.
- **Smart duration**: The system automatically calculates an appropriate duration based on the length of the message, ensuring users have enough time to read.
- **Consistent styling**: All alerts follow the Shadcn/UI styling principles, ensuring visual consistency across the application.
- **Multiple variants**: Supports different alert types (success, error, warning, info) for various scenarios.
- **Contextual icons**: Each alert variant includes an appropriate Lucide icon to enhance visual recognition.

## How to Use Alerts

### 1. Import the useAlerts hook

```tsx
import { useAlerts } from "@/components/shared/Alerts";
```

### 2. Use the hook in your component

```tsx
function MyComponent() {
  const { showAlert } = useAlerts();
  
  // Your component logic...
}
```

### 3. Show an alert

```tsx
const handleAction = () => {
  showAlert({
    title: "Success",
    message: "Operation completed successfully!",
    variant: "success",
    // Duration is automatically calculated based on message length
  });
};
```

## Alert Options

The `showAlert` function accepts an object with the following properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| title | string | No | The title of the alert |
| message | string | Yes | The main message to display |
| variant | string | No | The style variant of the alert: "default", "destructive", "success", "warning", "info" (default: "default") |
| duration | number | No | Custom time in milliseconds before the alert auto-dismisses. If not provided, a duration is calculated based on the message length |

## Alert Variants and Icons

- **default**: Basic alert with neutral styling (Badge Info icon)
- **destructive**: Red alert for errors or destructive actions (Alert Circle icon)
- **success**: Green alert for successful operations (Check Circle icon)
- **warning**: Yellow alert for warnings (Alert Triangle icon)
- **info**: Blue alert for informational messages (Info icon)

## Examples

### Success Alert

```tsx
showAlert({
  title: "Success",
  message: "Your protocol was submitted successfully.",
  variant: "success",
});
```

### Error Alert

```tsx
showAlert({
  title: "Error",
  message: "Failed to save changes. Please try again.",
  variant: "destructive",
});
```

### Warning Alert

```tsx
showAlert({
  title: "Warning",
  message: "You are about to delete this protocol.",
  variant: "warning",
});
```

### Info Alert

```tsx
showAlert({
  title: "Information",
  message: "New protocols are available for review.",
  variant: "info",
});
```

### Custom Duration Alert

```tsx
showAlert({
  title: "Important",
  message: "Please review all feedback before proceeding.",
  variant: "info",
  duration: 8000, // Custom 8-second duration
});
```

## Smart Duration Calculation

The alert system automatically calculates an appropriate duration based on the length of the message:

- Minimum duration: 3 seconds
- Maximum duration: 10 seconds
- Calculation based on average reading speed (200 words per minute)

This ensures that longer messages remain visible long enough for users to read them, while short messages don't stay on screen unnecessarily.

## Best Practices

1. **Use consistent alert types**: Use success alerts for successful operations, error alerts for failures, etc.
2. **Keep messages concise**: Alert messages should be brief and to the point, even though the duration adapts to length.
3. **Use titles effectively**: Titles should summarize the alert type, while the message provides details.
4. **Don't overuse alerts**: Too many alerts can overwhelm users. Use them judiciously.
5. **Let the system handle duration**: In most cases, allow the system to calculate the appropriate duration based on message length.

## Implementation Example

See `src/components/shared/AlertExample.tsx` for a complete implementation example of how to use the alert system. 