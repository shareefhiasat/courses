# Keycloak Setup Guide for Military LMS

## Overview
Keycloak handles authentication and authorization for the Military LMS application. This guide shows how to set up Keycloak with the proper realm, client, and user configurations.

## Technology Stack
- **Database**: PostgreSQL (exclusively)
- **Authentication**: Keycloak
- **API**: REST (no GraphQL)
- **Backend**: Node.js/Express with Prisma ORM

## Quick Setup Options

### Option 1: Docker (Recommended)
```bash
# Start Keycloak with PostgreSQL
docker-compose -f docker-compose.keycloak.yml up -d

# Wait for Keycloak to start (2-3 minutes)
# Then access: http://localhost:8080
# Admin credentials: admin / admin123
```

### Option 2: Manual Installation
Download Keycloak from: https://www.keycloak.org/downloads

## Configuration Steps

### 1. Access Keycloak Admin Console
- URL: http://localhost:8080
- Username: `admin`
- Password: `admin123`

### 2. Create Military LMS Realm
1. Hover over "Master" realm in top-left
2. Click "Add realm"
3. Name: `military-lms`
4. Click "Create"

### 3. Create Client for Frontend
1. Navigate to "Clients" in the left menu
2. Click "Create"
3. Fill in client details:
   - **Client ID**: `military-lms-app`
   - **Client Protocol**: `openid-connect`
   - **Root URL**: `http://localhost:3000`
   - **Access Type**: `public`
   - **Standard Flow Enabled**: `ON`
   - **Direct Access Grants Enabled**: `ON`
   - **Valid Redirect URIs**: 
     ```
     http://localhost:3000/*
     http://localhost:3000/callback
     http://localhost:3000/silent-check-sso.html
     ```
   - **Web Origins**: `http://localhost:3000`
4. Click "Save"

### 4. Create Client for Backend API
1. Navigate to "Clients"
2. Click "Create"
3. Fill in client details:
   - **Client ID**: `military-lms-backend`
   - **Client Protocol**: `openid-connect`
   - **Access Type**: `confidential`
   - **Service Accounts Enabled**: `ON`
   - **Valid Redirect URIs**: `http://localhost:8081/*`
4. Click "Save"
5. Go to "Credentials" tab
6. Copy the "Secret" - you'll need this for backend configuration

### 5. Create Roles
1. Navigate to "Roles"
2. Click "Add Role"
3. Create the following roles:
   - `ADMIN` - Full system access
   - `INSTRUCTOR` - Can manage courses and students
   - `STUDENT` - Can view courses and enroll
   - `HR` - Can manage employees and training

### 6. Create Users
1. Navigate to "Users"
2. Click "Add user"
3. Create test users:

#### Admin User
- **Username**: `admin`
- **Email**: `admin@milmanylms.com`
- **First Name**: `System`
- **Last Name**: `Administrator`
- **Enabled**: `ON`
4. Go to "Credentials" tab
5. Set password: `admin123`
6. Go to "Role Mappings" tab
7. Assign `ADMIN` role

#### Instructor User
- **Username**: `instructor`
- **Email**: `instructor@milmanylms.com`
- **First Name**: `Test`
- **Last Name**: `Instructor`
- **Enabled**: `ON`
4. Set password: `instructor123`
5. Assign `INSTRUCTOR` role

#### Student User
- **Username**: `student`
- **Email**: `student@milmanylms.com`
- **First Name**: `Test`
- **Last Name**: `Student`
- **Enabled**: `ON`
4. Set password: `student123`
5. Assign `STUDENT` role

### 7. Configure Realm Settings
1. Navigate to "Realm Settings"
2. "Login" tab:
   - **User registration**: `OFF` (disable public registration)
   - **Forgot password**: `ON`
   - **Remember me**: `ON`
3. "Security Defenses" tab:
   - **X-Frame-Options**: `SAMEORIGIN`
   - **Content-Security-Policy**: `frame-src 'self';`
4. "Keys" tab:
   - Ensure RSA key pair is generated

## Environment Configuration

### Frontend (.env)
```env
# Keycloak Configuration
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=military-lms
VITE_KEYCLOAK_CLIENT_ID=military-lms-app
```

### Backend (.env)
```env
# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=military-lms
KEYCLOAK_CLIENT_ID=military-lms-backend
KEYCLOAK_CLIENT_SECRET=your-client-secret-here
```

## Testing the Setup

### 1. Frontend Test
1. Start frontend: `cd client && pnpm dev`
2. Navigate to http://localhost:3000
3. Click "Login"
4. You should be redirected to Keycloak login page
5. Login with test credentials (e.g., admin/admin123)
6. You should be redirected back to the application

### 2. Backend Test
1. Start backend: `pnpm api:dev`
2. Test protected endpoint with valid token
3. Test with invalid/missing token

## Common Issues & Solutions

### Issue: CORS Errors
**Solution**: Ensure Valid Redirect URIs and Web Origins include your frontend URL in Keycloak client settings.

### Issue: "Invalid parameter: redirect_uri"
**Solution**: Check that the redirect URI exactly matches one of the Valid Redirect URIs in Keycloak client configuration.

### Issue: "Client not enabled"
**Solution**: Ensure the client is enabled and has the correct access type (public for frontend, confidential for backend).

### Issue: Port Conflicts
**Solution**: 
- Backend API: Port 8081
- Frontend: Port 3000  
- Keycloak: Port 8080

## API Endpoints for Keycloak

### Token Endpoint
```
POST http://localhost:8080/realms/military-lms/protocol/openid-connect/token
```

### User Info Endpoint
```
GET http://localhost:8080/realms/military-lms/protocol/openid-connect/userinfo
```

### Logout Endpoint
```
POST http://localhost:8080/realms/military-lms/protocol/openid-connect/logout
```

## Security Considerations

1. **Change Default Passwords**: Change admin password and user passwords in production
2. **Use HTTPS**: Use HTTPS URLs in production environments
3. **Secure Client Secrets**: Store client secrets securely in production
4. **Token Expiration**: Configure appropriate token lifetimes
5. **Role-Based Access**: Implement proper role-based access control in your application

## Next Steps

1. [ ] Start Keycloak server
2. [ ] Create realm and clients as described
3. [ ] Create test users and roles
4. [ ] Update frontend Keycloak configuration
5. [ ] Test authentication flow
6. [ ] Implement role-based access control in frontend
7. [ ] Implement JWT validation in backend

## Support

- Keycloak Documentation: https://www.keycloak.org/documentation
- Military LMS Documentation: See ENVIRONMENT_SETUP.md
