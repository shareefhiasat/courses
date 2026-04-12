# 🔐 Keycloak Integration Guide - Military LMS

## 📋 **OVERVIEW**

This guide will help you set up Keycloak authentication for the Military LMS without LDAP (for now). We'll create a super admin user, configure roles, and integrate with your existing login/signup flows.

---

## 🚀 **STEP 1: CREATE LMS REALM**

### **1.1 Create New Realm**
1. Go to Keycloak Admin: `http://localhost:8080/admin`
2. Login with: `admin` / `admin`
3. Click **"Master"** dropdown → **"Create Realm"**
4. **Realm name**: `military-lms`
5. **Enabled**: ✅ ON
6. Click **"Create"**

---

## 👥 **STEP 2: CREATE REALM ROLES**

### **2.1 Define LMS Roles**
Go to **Realm roles** → **Create role**

Create these roles:

| Role Name | Description |
|-----------|-------------|
| `super-admin` | Full system access - can manage everything |
| `admin` | Administrative access - can manage users and content |
| `hr` | HR access - can manage users and reports |
| `instructor` | Instructor access - can manage classes and students |
| `student` | Student access - can view content and submit work |

### **2.2 Create Each Role**
For each role above:
1. Click **"Create role"**
2. **Role name**: (from table above)
3. **Description**: (from table above)
4. Click **"Save"**

---

## 🔧 **STEP 3: CREATE CLIENT FOR LMS APP**

### **3.1 Create Client**
1. Go to **Clients** → **"Create client"**
2. **Client type**: `OpenID Connect`
3. **Client ID**: `military-lms-app`
4. Click **"Next"**

### **3.2 Capability Config**
- **Client authentication**: ✅ ON
- **Authorization**: ✅ ON
- **Authentication flow**:
  - ✅ Standard flow
  - ✅ Direct access grants
  - ✅ Service accounts roles
- Click **"Next"**

### **3.3 Login Settings**
- **Root URL**: `http://localhost:5173`
- **Home URL**: `http://localhost:5173`
- **Valid redirect URIs**: 
  - `http://localhost:5173/*`
  - `http://localhost:4001/*`
- **Valid post logout redirect URIs**: `http://localhost:5173/*`
- **Web origins**: `+` (allows all valid redirect URIs)
- Click **"Save"**

### **3.4 Get Client Secret**
1. Go to **Credentials** tab
2. Copy the **Client secret** (you'll need this later)
3. Save it somewhere safe: `YOUR_CLIENT_SECRET_HERE`

---

## 👤 **STEP 4: CREATE SUPER ADMIN USER**

### **4.1 Create User**
1. Go to **Users** → **"Add user"**
2. Fill in:
   - **Username**: `shareef.hiasat@gmail.com`
   - **Email**: `shareef.hiasat@gmail.com`
   - **Email verified**: ✅ ON
   - **First name**: `Shareef`
   - **Last name**: `Hiasat`
   - **Enabled**: ✅ ON
3. Click **"Create"**

### **4.2 Set Password**
1. Go to **Credentials** tab
2. Click **"Set password"**
3. **Password**: `Test123@`
4. **Password confirmation**: `Test123@`
5. **Temporary**: ❌ OFF
6. Click **"Save"**
7. Confirm **"Set password"**

### **4.3 Assign Roles**
1. Go to **Role mapping** tab
2. Click **"Assign role"**
3. **Filter by realm roles**
4. Select:
   - ✅ `super-admin`
   - ✅ `admin`
   - ✅ `instructor`
5. Click **"Assign"**

---

## 🔑 **STEP 5: CONFIGURE CLIENT SCOPES**

### **5.1 Add Custom Scopes**
1. Go to **Client scopes** → **"Create client scope"**
2. **Name**: `lms-roles`
3. **Type**: `Default`
4. **Protocol**: `OpenID Connect`
5. Click **"Save"**

### **5.2 Add Mapper for Roles**
1. In the `lms-roles` scope, go to **Mappers** tab
2. Click **"Add mapper"** → **"By configuration"**
3. Select **"User Realm Role"**
4. Fill in:
   - **Name**: `realm-roles`
   - **Mapper type**: `User Realm Role`
   - **Multivalued**: ✅ ON
   - **Token Claim Name**: `roles`
   - **Claim JSON Type**: `String`
   - **Add to ID token**: ✅ ON
   - **Add to access token**: ✅ ON
   - **Add to userinfo**: ✅ ON
5. Click **"Save"**

### **5.3 Assign Scope to Client**
1. Go to **Clients** → `military-lms-app`
2. Go to **Client scopes** tab
3. Click **"Add client scope"**
4. Select `lms-roles`
5. **Add as**: `Default`
6. Click **"Add"**

---

## 🔐 **STEP 6: CONFIGURE AUTHENTICATION FLOWS**

### **6.1 Enable Registration**
1. Go to **Realm settings** → **Login** tab
2. Enable:
   - ✅ **User registration**
   - ✅ **Forgot password**
   - ✅ **Remember me**
   - ✅ **Email as username**
3. Click **"Save"**

### **6.2 Configure Email Settings (Optional)**
1. Go to **Realm settings** → **Email** tab
2. Configure SMTP settings for password reset emails
3. For development, you can skip this and manually reset passwords

---

## 🔌 **STEP 7: INTEGRATE WITH YOUR APP**

### **7.1 Install Keycloak Adapter**
```bash
pnpm add keycloak-js @react-keycloak/web
```

### **7.2 Environment Variables**
Create/Update `.env`:
```env
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=military-lms
VITE_KEYCLOAK_CLIENT_ID=military-lms-app
```

### **7.3 Create Keycloak Config**
Create `src/config/keycloak.js`:
```javascript
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
```

### **7.4 Create Keycloak Provider**
Create `src/contexts/KeycloakContext.jsx`:
```javascript
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from '../config/keycloak';

const keycloakProviderInitConfig = {
  onLoad: 'check-sso',
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  pkceMethod: 'S256',
};

export const KeycloakProvider = ({ children }) => {
  const handleOnEvent = (event, error) => {
    console.log('Keycloak event:', event, error);
  };

  const handleOnTokens = (tokens) => {
    console.log('Keycloak tokens:', tokens);
    // Store tokens in localStorage or state management
    if (tokens.token) {
      localStorage.setItem('kc_token', tokens.token);
      localStorage.setItem('kc_refreshToken', tokens.refreshToken);
    }
  };

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={keycloakProviderInitConfig}
      onEvent={handleOnEvent}
      onTokens={handleOnTokens}
    >
      {children}
    </ReactKeycloakProvider>
  );
};
```

### **7.5 Create Auth Hook**
Create `src/hooks/useAuth.js`:
```javascript
import { useKeycloak } from '@react-keycloak/web';

export const useAuth = () => {
  const { keycloak, initialized } = useKeycloak();

  const login = () => {
    keycloak.login();
  };

  const logout = () => {
    keycloak.logout();
  };

  const register = () => {
    keycloak.register();
  };

  const hasRole = (role) => {
    return keycloak.hasRealmRole(role);
  };

  const isSuperAdmin = () => hasRole('super-admin');
  const isAdmin = () => hasRole('admin') || hasRole('super-admin');
  const isHR = () => hasRole('hr');
  const isInstructor = () => hasRole('instructor');
  const isStudent = () => hasRole('student');

  return {
    initialized,
    authenticated: keycloak.authenticated,
    user: keycloak.tokenParsed,
    token: keycloak.token,
    refreshToken: keycloak.refreshToken,
    login,
    logout,
    register,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isHR,
    isInstructor,
    isStudent,
    keycloak,
  };
};
```

### **7.6 Update Main App**
Update `src/main.jsx`:
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { KeycloakProvider } from './contexts/KeycloakContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <KeycloakProvider>
      <App />
    </KeycloakProvider>
  </React.StrictMode>
);
```

### **7.7 Create Protected Route Component**
Create `src/components/ProtectedRoute.jsx`:
```javascript
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, roles = [] }) => {
  const { initialized, authenticated, hasRole } = useAuth();

  if (!initialized) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0) {
    const hasRequiredRole = roles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};
```

---

## 🎯 **STEP 8: UPDATE YOUR FLOWS**

### **8.1 Login Flow**
Your existing login page should now:
1. Check if user is authenticated via Keycloak
2. If not, redirect to Keycloak login
3. After successful login, redirect back to app
4. Extract user info and roles from JWT token

**Example Login Page**:
```javascript
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const { authenticated, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated) {
      navigate('/dashboard');
    }
  }, [authenticated, navigate]);

  return (
    <div className="login-container">
      <h1>Military LMS</h1>
      <button onClick={login}>Login with Keycloak</button>
    </div>
  );
};
```

### **8.2 Signup Flow**
**Option 1: Keycloak Registration (Recommended)**
```javascript
import { useAuth } from '../hooks/useAuth';

export const SignupPage = () => {
  const { register } = useAuth();

  return (
    <div className="signup-container">
      <h1>Create Account</h1>
      <button onClick={register}>Register with Keycloak</button>
    </div>
  );
};
```

**Option 2: Custom Registration + Keycloak Sync**
1. User fills out custom registration form
2. Create user in MongoDB
3. Create user in Keycloak via Admin API
4. Assign default `student` role
5. Send verification email

### **8.3 Password Reset Flow**
Keycloak handles this automatically:
1. User clicks "Forgot Password"
2. Redirects to Keycloak reset page
3. User receives email with reset link
4. User sets new password
5. Redirects back to app

**Example**:
```javascript
import { useAuth } from '../hooks/useAuth';

export const ForgotPasswordPage = () => {
  const { keycloak } = useAuth();

  const handleResetPassword = () => {
    const resetUrl = `${keycloak.authServerUrl}/realms/${keycloak.realm}/login-actions/reset-credentials`;
    window.location.href = resetUrl;
  };

  return (
    <div className="forgot-password-container">
      <h1>Reset Password</h1>
      <button onClick={handleResetPassword}>Reset via Keycloak</button>
    </div>
  );
};
```

### **8.4 Users Dashboard Integration**
Your existing Users page should now:
1. Display users from MongoDB (for data)
2. Sync roles with Keycloak
3. When admin creates user:
   - Create in MongoDB
   - Create in Keycloak
   - Assign appropriate roles
   - Send welcome email

---

## 🔄 **STEP 9: SYNC EXISTING USERS TO KEYCLOAK**

### **9.1 Create Sync Script**
Create `scripts/sync-users-to-keycloak.js`:
```javascript
// Script to sync existing MongoDB users to Keycloak
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const kcAdminClient = new KcAdminClient({
  baseUrl: 'http://localhost:8080',
  realmName: 'military-lms',
});

async function syncUsers() {
  // Authenticate as admin
  await kcAdminClient.auth({
    username: 'admin',
    password: 'admin',
    grantType: 'password',
    clientId: 'admin-cli',
  });

  // Get all users from MongoDB
  const users = await prisma.user.findMany();

  for (const user of users) {
    try {
      // Create user in Keycloak
      const kcUser = await kcAdminClient.users.create({
        realm: 'military-lms',
        username: user.email,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        enabled: !user.isDisabled,
        emailVerified: true,
      });

      // Set password
      await kcAdminClient.users.resetPassword({
        realm: 'military-lms',
        id: kcUser.id,
        credential: {
          temporary: false,
          type: 'password',
          value: 'ChangeMe123!', // Users will need to reset
        },
      });

      // Assign roles
      const roles = [];
      if (user.isAdmin) roles.push('admin');
      if (user.isHR) roles.push('hr');
      if (user.isInstructor) roles.push('instructor');
      if (user.isStudent) roles.push('student');

      for (const roleName of roles) {
        const role = await kcAdminClient.roles.findOneByName({
          realm: 'military-lms',
          name: roleName,
        });
        
        if (role) {
          await kcAdminClient.users.addRealmRoleMappings({
            realm: 'military-lms',
            id: kcUser.id,
            roles: [{ id: role.id, name: role.name }],
          });
        }
      }

      console.log(`✅ Synced user: ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to sync user ${user.email}:`, error.message);
    }
  }

  console.log('🎉 User sync complete!');
}

syncUsers();
```

---

## 🎨 **STEP 10: CUSTOM JWT CLAIMS**

### **10.1 Add Custom User Attributes**
1. Go to **Users** → Select user
2. Go to **Attributes** tab
3. Add custom attributes:
   - `studentNumber`: `12345`
   - `phoneNumber`: `+1234567890`
   - `department`: `Engineering`
4. Click **"Save"**

### **10.2 Create Mapper for Custom Claims**
1. Go to **Client scopes** → `lms-roles`
2. Go to **Mappers** tab
3. Click **"Add mapper"** → **"By configuration"**
4. Select **"User Attribute"**
5. Fill in:
   - **Name**: `student-number`
   - **User Attribute**: `studentNumber`
   - **Token Claim Name**: `studentNumber`
   - **Claim JSON Type**: `String`
   - **Add to ID token**: ✅ ON
   - **Add to access token**: ✅ ON
6. Repeat for other custom attributes

---

## 🔒 **STEP 11: SECURE YOUR GRAPHQL API**

### **11.1 Install JWT Verification**
```bash
pnpm add jsonwebtoken jwks-rsa
```

### **11.2 Create Auth Middleware**
Create `src/middleware/auth.js`:
```javascript
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `http://localhost:8080/realms/military-lms/protocol/openid-connect/certs`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

export const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      audience: 'military-lms-app',
      issuer: 'http://localhost:8080/realms/military-lms',
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = await verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### **11.3 Update GraphQL Context**
Update `working-graphql-server.cjs`:
```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const user = await verifyToken(token);
        return { user };
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }
    
    return { user: null };
  },
});
```

---

## ✅ **STEP 12: TEST YOUR SETUP**

### **12.1 Test Super Admin Login**
1. Start your app: `npm run dev`
2. Go to: `http://localhost:5173`
3. Click **"Login"**
4. Should redirect to Keycloak
5. Login with:
   - **Username**: `shareef.hiasat@gmail.com`
   - **Password**: `Test123@`
6. Should redirect back to app
7. Check console for JWT token with roles

### **12.2 Test Role-Based Access**
```javascript
// In your component
const { isSuperAdmin, isAdmin, isInstructor } = useAuth();

if (isSuperAdmin()) {
  // Show super admin features
}

if (isAdmin()) {
  // Show admin features
}

if (isInstructor()) {
  // Show instructor features
}
```

### **12.3 Test API with Token**
```javascript
const { token } = useAuth();

const response = await fetch('http://localhost:4001/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    query: '{ users(first: 5) { edges { node { id email } } } }'
  })
});
```

---

## 🎯 **SUMMARY: YOUR NEW AUTHENTICATION FLOW**

### **Before (Local Database)**
1. User enters email/password
2. Check against MongoDB
3. Create session
4. Store in localStorage

### **After (Keycloak)**
1. User clicks "Login"
2. Redirect to Keycloak
3. Keycloak validates credentials
4. Returns JWT token with roles
5. App extracts user info from token
6. GraphQL API validates token
7. MongoDB stores user data (synced with Keycloak)

### **Benefits**
- ✅ **Centralized Authentication**: Single source of truth
- ✅ **Role-Based Access**: Managed in Keycloak
- ✅ **JWT Tokens**: Stateless authentication
- ✅ **SSO Ready**: Easy to add LDAP later
- ✅ **Password Reset**: Built-in flows
- ✅ **MFA Ready**: Can enable 2FA easily
- ✅ **Audit Logs**: Keycloak tracks all auth events

---

## 🔮 **FUTURE: LDAP INTEGRATION**

When you're ready to add LDAP:

1. Go to **User federation** → **Add provider** → **LDAP**
2. Configure LDAP connection
3. Map LDAP attributes to Keycloak
4. Sync users automatically
5. Keep role management in Keycloak

---

## 📞 **NEED HELP?**

- **Keycloak Docs**: https://www.keycloak.org/documentation
- **React Keycloak**: https://github.com/react-keycloak/react-keycloak
- **JWT Debugger**: https://jwt.io

---

**🎉 You're now ready to use Keycloak with your Military LMS!**
