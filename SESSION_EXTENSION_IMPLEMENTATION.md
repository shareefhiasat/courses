# Session Extension & Auto-Logout Implementation

## Overview
Implemented a system-wide session management feature that shows a pre-emptive warning dialog 5 minutes before the Keycloak access token expires, offering users the option to extend their session or logout, with automatic logout after 15 minutes of inactivity.

## Implementation Details

### Modified Files
- **`client/src/contexts/AuthContext.jsx`** - Added session extension logic

### Key Features

#### 1. **Pre-emptive Warning (5 minutes before expiry)**
- Calculates token expiry from `keycloak.tokenParsed.exp`
- Schedules a warning timer to show modal 5 minutes before token expires
- Logs expiry information for debugging

#### 2. **Session Extension Dialog**
- Uses existing `ConfirmModal` component for consistent UI/UX
- Two options:
  - **"Extend Session"** (primary button) - Refreshes the token
  - **"Logout"** (cancel button) - Logs the user out
- Shows loading state while refreshing token

#### 3. **Auto-Logout Timer (15 minutes)**
- When the modal appears, starts a 15-minute countdown
- If user doesn't respond within 15 minutes, automatically logs them out
- Timer is cleared if user takes action (extend or logout)

#### 4. **Token Refresh Mechanism**
- Uses Keycloak's built-in `updateToken(-1)` method to force refresh
- Updates `localStorage` with new token for API calls
- Reschedules warning timer based on new token expiry
- Falls back to logout if refresh fails

#### 5. **Timer Management**
- Uses `useRef` to store timer IDs (prevents memory leaks)
- Properly cleans up timers on component unmount
- Clears existing timers before scheduling new ones

### Code Structure

```javascript
// State
const [showSessionModal, setShowSessionModal] = useState(false);
const [isRefreshing, setIsRefreshing] = useState(false);

// Refs for timers
const warningTimerRef = useRef(null);
const autoLogoutTimerRef = useRef(null);

// Functions (wrapped in useCallback for performance)
- scheduleSessionWarning() - Schedules warning 5 min before expiry
- handleRefresh() - Refreshes token using Keycloak
- handleSessionModalClose() - Logs user out
```

### User Experience Flow

1. **User logs in** → Token expiry timer is scheduled
2. **5 minutes before expiry** → Modal appears with warning
3. **User has 15 minutes to respond**:
   - Click "Extend Session" → Token refreshed, modal closes, timer resets
   - Click "Logout" → User logged out immediately
   - No action → Auto-logout after 15 minutes
4. **After refresh** → New warning scheduled based on new token expiry

### Configuration

- **Warning Time**: 5 minutes before token expiry
- **Auto-Logout Time**: 15 minutes after modal appears
- **Token Refresh**: Uses Keycloak's `updateToken(-1)` for forced refresh

### Logging

The implementation includes comprehensive logging:
- 📅 Token expiry scheduled
- ⚠️ Showing session expiration warning
- ✅ Token refreshed successfully
- ⏱️ Starting 15-minute auto-logout timer
- ⏰ Auto-logout triggered after 15 minutes
- 🚪 User chose to logout from session modal
- ❌ Token refresh failed

### Error Handling

- If token refresh fails → User is logged out
- If token is already expired → Warning shown immediately
- All timers are properly cleaned up to prevent memory leaks

### Testing Recommendations

1. **Test token expiry warning**:
   - Configure Keycloak with short-lived tokens (e.g., 10 minutes)
   - Verify modal appears 5 minutes before expiry
   
2. **Test session extension**:
   - Click "Extend Session" and verify token is refreshed
   - Check localStorage for updated token
   - Verify new warning is scheduled
   
3. **Test auto-logout**:
   - Let modal appear and wait 15 minutes
   - Verify automatic logout occurs
   
4. **Test manual logout**:
   - Click "Logout" button in modal
   - Verify immediate logout

### Keycloak Configuration

Ensure Keycloak is configured with appropriate token lifespans:
- **Access Token Lifespan**: Recommended 30-60 minutes
- **SSO Session Idle**: Recommended 30 minutes
- **SSO Session Max**: Recommended 10 hours

This allows the 5-minute warning to work effectively without being too intrusive.

## Benefits

✅ **User-friendly**: Pre-emptive warning prevents unexpected logouts  
✅ **Secure**: Automatic logout after inactivity ensures security  
✅ **Seamless**: Token refresh happens in background without page reload  
✅ **Consistent**: Uses existing modal component for familiar UI  
✅ **Robust**: Proper error handling and timer cleanup  
✅ **Performant**: Uses useCallback to prevent unnecessary re-renders  

## Future Enhancements (Optional)

- Add countdown timer in modal showing time remaining
- Make warning/auto-logout times configurable via environment variables
- Add toast notification when token is refreshed successfully
- Track user activity to reset idle timer on interaction
