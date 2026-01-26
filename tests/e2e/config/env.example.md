# Test Environment Variables

Copy these to your `.env.test` file (create it in the root directory):

```env
# Base URL
BASE_URL=http://localhost:5174

# Super Admin Credentials
TEST_SUPERADMIN_EMAIL=shareef.hiasat@gmail.com
TEST_SUPERADMIN_PASSWORD=Jordan123$

# Admin Credentials (if different)
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=Test123!@#

# Mailtrap Configuration (for email testing)
# Get your API token from https://mailtrap.io/api-tokens
MAILTRAP_API_TOKEN=your_mailtrap_api_token_here
MAILTRAP_INBOX_ID=your_mailtrap_inbox_id_here

# Default password for test users
TEST_DEFAULT_PASSWORD=Test123!@#
```

## Setup Instructions

1. Create `.env.test` file in project root
2. Copy the variables above
3. Fill in your Mailtrap credentials (free tier is enough)
4. The config file will automatically read from these environment variables
