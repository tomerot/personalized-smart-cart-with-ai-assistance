# User Context Usage Guide

## Overview
The `UserContext` manages authenticated user state across the Kiosk application. It provides user data after OTP verification and persists it to sessionStorage.

## User Data Structure
```javascript
{
  phone: "+972541234567",    // International format
  allergies: ["peanuts"],     // Array of allergen strings
  dietary_needs: ["kosher"]   // Array of dietary preference strings
}
```

## Usage in Components

### Import the Hook
```javascript
import { useUser } from '@/context/UserContext';
```

### Access User Data
```javascript
function MyComponent() {
  const { user, isAuthenticated, login, logout, updateUser } = useUser();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.phone}</h1>
      <p>Allergies: {user.allergies.join(', ')}</p>
      <p>Dietary Needs: {user.dietary_needs.join(', ')}</p>
    </div>
  );
}
```

## Available Methods

### `login(userData)`
Called automatically after OTP verification. Stores user in context and sessionStorage.
```javascript
const { login } = useUser();
login({ phone: "+972541234567", allergies: [], dietary_needs: [] });
```

### `logout()`
Clears user data from context and sessionStorage.
```javascript
const { logout } = useUser();
logout();
```

### `updateUser(updates)`
Updates user data (e.g., when user changes preferences).
```javascript
const { updateUser } = useUser();
updateUser({ allergies: ["peanuts", "eggs"] });
```

## Example: Protected Route
```javascript
import { Navigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useUser();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/phone" replace />;
  }
  
  return children;
}

// Usage in App.jsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  } 
/>
```

## Example: Display User Info in Nav
```javascript
function Navigation() {
  const { user, isAuthenticated, logout } = useUser();

  return (
    <nav>
      {isAuthenticated && (
        <>
          <span>{user.phone}</span>
          <button onClick={logout}>Logout</button>
        </>
      )}
    </nav>
  );
}
```

## Persistence
- User data is automatically saved to `sessionStorage`
- Data persists across page refreshes
- Data is cleared when user logs out or closes the browser tab
- On app mount, the context automatically loads user data from sessionStorage if available

