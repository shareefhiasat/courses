# Military LMS Backend API

Standalone backend API server with Swagger documentation for the Military Learning Management System.

## 🏗️ Architecture

```
Frontend (Vite) → Backend API → Business Services → DB Services → Prisma → PostgreSQL
```

### **Architecture Layers**

```
┌─────────────────┐
│   server.js     │ ← Loads .env, starts Express, mounts routes
│  (Environment)  │
└─────────────────┘
         ↓
┌─────────────────┐
│     Routes      │ ← HTTP endpoint definitions (/api/v1/*)
│   (Express)     │
└─────────────────┘
         ↓
┌─────────────────┐
│  Controllers    │ ← HTTP request/response handling
│   (HTTP Logic)  │
└─────────────────┘
         ↓
┌─────────────────┐
│   Services      │ ← Business logic, validation, rules
│ (Business)      │
└─────────────────┘
         ↓
┌─────────────────┐
│  DB Services    │ ← Direct Prisma/PostgreSQL operations
│ (Database)      │
└─────────────────┘
         ↓
┌─────────────────┐
│   PostgreSQL    │ ← Data persistence
│   Database      │
└─────────────────┘
```

## ✨ Features

- **🌐 RESTful API**: Clean REST endpoints for all operations
- **📚 Swagger Documentation**: Auto-generated API docs at `/api-docs`
- **🧠 Business Logic Layer**: Separated business and database concerns
- **🛡️ Error Handling**: Comprehensive error handling and logging
- **🔒 Type Safety**: Full JavaScript with proper interfaces
- **🗄️ Database**: PostgreSQL with Prisma ORM
- **🔍 Search & Filter**: Advanced querying capabilities
- **📄 Pagination**: Efficient data pagination
- **👥 User Relationships**: Creator/updater tracking
- **🌍 Bilingual Support**: English/Arabic fields

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Prisma configured

### Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up environment variables in `../.env`:
```env
DATABASE_URL="postgresql://military_lms:military_lms123@localhost:5432/military_lms"
PORT=8081
API_VERSION=v1
NODE_ENV=development
```

3. Start the server:
```bash
node server.js
```

4. Access the API:
- **API Base URL**: http://localhost:8081/api/v1
- **Swagger Docs**: http://localhost:8081/api-docs
- **Health Check**: http://localhost:8081/api/health

## 📋 Available Endpoints

### **Programs**
- `GET /api/v1/programs` - List all programs
- `GET /api/v1/programs/:id` - Get program by ID
- `POST /api/v1/programs` - Create program
- `PUT /api/v1/programs/:id` - Update program
- `DELETE /api/v1/programs/:id` - Delete program

### **Subjects**
- `GET /api/v1/subjects` - List all subjects
- `GET /api/v1/subjects/:id` - Get subject by ID
- `POST /api/v1/subjects` - Create subject
- `PUT /api/v1/subjects/:id` - Update subject
- `DELETE /api/v1/subjects/:id` - Delete subject
- `GET /api/v1/subjects/program/:programId` - Get subjects by program

### **Classes** (Coming Soon)
- `GET /api/v1/classes` - List all classes
- `GET /api/v1/classes/:id` - Get class by ID
- `POST /api/v1/classes` - Create class
- `PUT /api/v1/classes/:id` - Update class
- `DELETE /api/v1/classes/:id` - Delete class
- `GET /api/v1/classes/program/:programId` - Get classes by program
- `GET /api/v1/classes/instructor/:instructorId` - Get classes by instructor

## 🏛️ Project Structure

```
backend/
├── server.js                 # Main server file
├── routes/                   # API route definitions
│   ├── programs-fixed.js     # Program routes
│   └── subjects.js           # Subject routes
├── controllers/              # HTTP request handlers
│   ├── programs.js           # Program controller
│   └── subjects.js           # Subject controller
├── services/                 # Business logic layer
│   ├── programs.js           # Program business logic
│   └── subjects.js           # Subject business logic
├── db/                       # Database service layer
│   ├── programs-postgres.js  # Program DB operations
│   └── subjects-postgres.js  # Subject DB operations
├── constants/                # Constants and utilities
│   └── prisma-errors.js      # Prisma error handling
└── utils/                    # Utility functions
    └── logger.js             # Logging utilities
```

## 🔧 Environment Variables

**✅ CORRECT Loading Pattern:**
- `server.js` loads environment variables at application startup
- All other modules inherit environment variables from `process.env`

**❌ INCORRECT Patterns:**
- DB Services should NOT load environment variables
- Business Services should NOT load environment variables  
- Controllers should NOT load environment variables

## 📊 API Response Format

All API responses follow this consistent format:

```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5,
  "message": "Operation successful"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## 🔍 Query Parameters

### **Pagination**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### **Search & Filter**
- `search` - Search term (searches multiple fields)
- `isActive` - Filter by active status (true/false)
- `programId` - Filter by program ID

### **Sorting**
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort order: asc/desc (default: desc)

## 🛡️ Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: 400 Bad Request
- **Not Found**: 404 Not Found  
- **Server Errors**: 500 Internal Server Error
- **Database Errors**: Proper Prisma error mapping

## 📝 Logging

All operations include structured logging:
- Request logging at controller level
- Business logic logging at service level
- Database operation logging at DB service level

## 🧪 Testing

```bash
# Test API endpoints
node test-programs-api.js
node test-subjects-api.js
```

## 🔒 Security Considerations

- Input validation at multiple layers
- SQL injection prevention via Prisma
- Error message sanitization
- CORS configuration

## 📈 Performance

- Database connection pooling via Prisma
- Efficient queries with proper indexing
- Pagination to prevent large data transfers
- Response caching where appropriate

## 🚀 Deployment

1. Set production environment variables
2. Build and deploy to your server
3. Run database migrations: `pnpm db:migrate`
4. Start the server: `node server.js`

## 🤝 Contributing

1. Follow the established architecture patterns
2. Add proper error handling and logging
3. Include comprehensive tests
4. Update documentation for new features

## 📞 Support

For issues and questions:
- Check Swagger docs at `/api-docs`
- Review server logs for detailed error information
- Verify database connection and schema

---

**Built with ❤️ for Military Education Management**
