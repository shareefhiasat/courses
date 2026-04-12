console.log(`
🔧 Keycloak Admin Credentials Setup Guide

To sync users with Keycloak, you need to know the correct admin credentials.

Step 1: Access Keycloak Admin Console
- Open your browser and go to: http://localhost:8080
- Click on "Administration Console"

Step 2: Login with Admin Credentials
- Default credentials are usually:
  - Username: admin
  - Password: admin
- If these don't work, check your Keycloak setup or environment variables

Step 3: Check Realm Settings
- Make sure you're in the "military-lms" realm
- Go to Realm Settings → Login to verify the realm is active

Step 4: Update the Script
- Edit sync-users-to-keycloak.cjs
- Update these lines with correct credentials:
  username: 'YOUR_ADMIN_USERNAME',
  password: 'YOUR_ADMIN_PASSWORD'

Step 5: Run the Sync Again
- After updating credentials, run: node sync-users-to-keycloak.cjs

Alternative: Create a dedicated admin client
1. In Keycloak Admin Console → Clients → Create client
2. Client ID: "admin-cli"
3. Access Type: "confidential"
4. Enable "Service Accounts Enabled"
5. Go to Credentials tab and get the client secret
6. Use client credentials grant instead of password

Current script expects:
- Keycloak URL: http://localhost:8080
- Realm: military-lms
- Admin username/password: admin/admin (default)
`);

console.log('📝 Quick test - Check if Keycloak is running:');
console.log('Try opening http://localhost:8080 in your browser');
console.log('If it loads, Keycloak is running and you just need the right credentials');
