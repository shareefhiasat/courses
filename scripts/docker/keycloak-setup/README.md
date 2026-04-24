# Keycloak Security Implementation Guide

This guide explains the security enhancements made to Keycloak for the Military LMS application on a government red network environment.

## Changes Implemented

### 1. Fixed Redirect Flows
- **Post-login redirect**: Users now redirect directly to the app instead of Keycloak account console
- **Logout redirect**: Logout now redirects to app login page instead of Keycloak account console
- **Files modified**:
  - `client/src/providers/KeycloakProvider.jsx` - Added explicit redirectUri
  - `client/src/contexts/AuthContext.jsx` - Changed logout to use keycloak.logout() with app redirect

### 2. Custom Keycloak Theme
- **Location**: `scripts/docker/keycloak-setup/themes/military-lms/`
- **Features**:
  - Custom branding to match Military LMS
  - Hides Keycloak default UI elements (logo, footer, account console links)
  - RTL support for Arabic
  - Dark mode support
  - Simple math captcha for bot protection (offline-compatible)
- **Files created**:
  - `theme.properties` - Theme configuration
  - `css/login.css` - Custom styling
  - `login.ftl` - Custom login template with captcha
  - `messages/messages_en.properties` - English localization
  - `messages/messages_ar.properties` - Arabic localization

### 3. Security Enhancements
- **TOTP (Authenticator) Enabled**:
  - Users required to set up authenticator app (Google Authenticator, FreeOTP)
  - OTP policy: 6-digit codes, 30-second window, HmacSHA1 algorithm
  - Required action: CONFIGURE_TOTP for all users
- **Captcha Protection**:
  - Simple math captcha (offline-compatible, no external services)
  - Validates on form submission
  - Generates new challenge on failure
- **Account Restrictions**:
  - Registration disabled (users managed by administrators)
  - Password reset disabled (contact admins)
  - Username editing disabled
  - User managed access disabled
- **Internationalization**:
  - English and Arabic support
  - RTL support in theme
  - Default locale: English

### 4. Realm Configuration Updates
- **File**: `scripts/docker/keycloak/realm-military-lms.json`
- **Changes**:
  - Login theme: `military-lms`
  - Account theme: `military-lms`
  - Registration: `false`
  - Reset password: `false`
  - Edit username: `false`
  - OTP policy configured
  - Internationalization enabled
  - Backchannel logout configured

### 5. Docker Configuration
- **File**: `scripts/docker/docker-compose.dev.yml`
- **Change**: Added volume mount for custom theme
  ```yaml
  volumes:
    - ./keycloak-setup/themes:/opt/keycloak/themes/military-lms
  ```

## Applying the Changes

### Step 1: Restart Keycloak
```bash
cd scripts/docker
docker-compose -f docker-compose.dev.yml restart keycloak
```

### Step 2: Verify Theme is Loaded
1. Access Keycloak Admin Console: http://localhost:8080/admin
2. Login with admin credentials
3. Navigate to Realm Settings > Themes
4. Verify "military-lms" theme is available
5. Set Login Theme to "military-lms"
6. Set Account Theme to "military-lms"
7. Click Save

### Step 3: Import Realm Configuration (if needed)
If the realm doesn't have the updated configuration:
```bash
# Import the realm configuration
docker exec -it lms-qaf-keycloak kc.sh import \
  --file /opt/keycloak/data/import/realm-military-lms.json \
  --override false
```

### Step 4: Test Login Flow
1. Navigate to app: http://localhost:5174
2. You should be redirected to custom Keycloak login page
3. Verify:
   - Custom branding is displayed
   - Math captcha is shown
   - No Keycloak logo or footer
   - No account console links

### Step 5: Test Logout Flow
1. Log in to the app
2. Click logout
3. Verify:
   - You are redirected to app login page (NOT Keycloak account console)
   - No redirect loops occur
   - Session is properly cleared

### Step 6: Test TOTP Setup
1. Log in as a user
2. You should be prompted to set up TOTP
3. Scan QR code with authenticator app
4. Enter verification code
5. Verify TOTP works on subsequent logins

### Step 7: Test Captcha
1. On login page, solve the math captcha
2. Enter wrong answer - should show error and regenerate
3. Enter correct answer - should proceed to authentication

## Security Checklist for Penetration Testing

- [ ] Users never see Keycloak account console
- [ ] Login redirects directly to app
- [ ] Logout redirects to app login page (no loops)
- [ ] Custom branding matches app design
- [ ] TOTP enrollment and authentication works
- [ ] Captcha protects against bots
- [ ] Registration is disabled
- [ ] Password reset is disabled
- [ ] Username editing is disabled
- [ ] Session tokens are properly invalidated on logout
- [ ] No sensitive data in URLs
- [ ] No information leakage in error messages
- [ ] RTL support works for Arabic
- [ ] Theme works in both light and dark modes

## Troubleshooting

### Issue: Theme not showing
**Solution**: Ensure the theme volume is mounted correctly in docker-compose.yml and restart Keycloak

### Issue: Logout redirects to account console
**Solution**: Verify AuthContext.jsx uses `keycloak.logout({ redirectUri: window.location.origin + '/login' })`

### Issue: TOTP not required
**Solution**: Check that CONFIGURE_TOTP is set as required action in realm configuration

### Issue: Captcha not validating
**Solution**: Check browser console for JavaScript errors; ensure script is loading correctly

### Issue: Redirect loops on logout
**Solution**: 
1. Check that redirectUri in KeycloakProvider matches app origin
2. Verify keycloak.logout() is being called with correct redirectUri
3. Check browser network tab for redirect chain

## Notes for Government Red Network

- **Offline Compatibility**: Math captcha works without internet connection
- **No External Services**: TOTP uses standard algorithm (no external API calls)
- **Security**: All user management is handled by administrators
- **Penetration Testing**: Configuration is designed to pass security audits
