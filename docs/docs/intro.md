# Welcome to Military LMS Documentation

Welcome to the **Military Learning Management System** API documentation. This comprehensive guide will help you understand, integrate, and extend the LMS platform.

## 🎯 What is Military LMS?

Military LMS is a modern, scalable learning management system built with:

- **MongoDB** - NoSQL database for flexible data storage
- **Prisma** - Type-safe database ORM
- **Express.js** - Fast, minimalist web framework
- **React** - Modern UI framework
- **ELK Stack** - Centralized logging and monitoring

## 🚀 Quick Start

Get started with Military LMS in minutes:

```bash
# Clone the repository
git clone https://github.com/military-lms/lms.git

# Install dependencies
cd lms
pnpm install

# Start Docker services
cd scripts
./dev-start.ps1

# Start API server
cd ../client
pnpm run api

# Start frontend
pnpm run dev
```

## 📚 Key Features

### **Enterprise-Grade Architecture**
- **Service Layer Pattern** - Clean separation of concerns
- **Centralized Middleware** - Security, logging, error handling
- **Type Safety** - JSDoc and TypeScript support
- **API Documentation** - Auto-generated Swagger docs

### **Security First**
- **Rate Limiting** - Prevent abuse and DDoS attacks
- **Request Sanitization** - XSS and injection protection
- **JWT Authentication** - Secure token-based auth
- **Role-Based Access Control** - Fine-grained permissions

### **Monitoring & Logging**
- **ELK Stack Integration** - Centralized log management
- **Performance Tracking** - Request timing and metrics
- **Debug Levels** - Configurable logging (error, warn, info, debug, trace)
- **Security Events** - Audit trail for sensitive operations

### **Developer Experience**
- **Service Templates** - Quick scaffolding for new services
- **Consistent Patterns** - DRY principles throughout
- **Path Aliases** - Clean imports with `@services`, `@utils`
- **Hot Reload** - Fast development iteration

## 📖 Documentation Structure

### **Getting Started**
Learn how to set up your development environment, configure services, and run the application.

### **Architecture**
Understand the system design, service layers, database schema, and security model.

### **Services**
Detailed documentation for each service (Categories, Programs, Subjects, etc.).

### **API Development**
Learn how to create new services, use middleware, handle errors, and test your code.

### **Deployment**
Production deployment guides for Docker, ELK Stack, and monitoring setup.

### **Migration Guide**
Step-by-step guide for migrating from Firebase to MongoDB.

## 🔗 Quick Links

- [API Reference](/api) - Interactive API documentation
- [Service Templates](./api/creating-services) - Create new services
- [Middleware Guide](./api/middleware) - Security and logging
- [Migration Plan](./migration/firebase-to-mongodb) - Firebase to MongoDB

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React, Vite, TailwindCSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Prisma ORM |
| **Logging** | Winston, ELK Stack |
| **Security** | Helmet, Rate Limiting, JWT |
| **Documentation** | Swagger, Docusaurus |
| **DevOps** | Docker, Docker Compose |

## 📊 API Endpoints

### **Categories API**
```
GET    /api/v1/categories      - Get all categories
GET    /api/v1/categories/:id  - Get category by ID
POST   /api/v1/categories      - Create new category
PUT    /api/v1/categories/:id  - Update category
DELETE /api/v1/categories/:id  - Delete category
```

### **Programs API**
```
GET    /api/v1/programs        - Get all programs
GET    /api/v1/programs/:id    - Get program by ID
POST   /api/v1/programs        - Create new program
PUT    /api/v1/programs/:id    - Update program
DELETE /api/v1/programs/:id    - Delete program
```

[View Complete API Reference →](/api)

## 🎓 Learning Path

1. **Start Here** - Read the [Installation Guide](./getting-started/installation)
2. **Understand Architecture** - Review [Service Layers](./architecture/service-layers)
3. **Create Your First Service** - Follow [Creating Services](./api/creating-services)
4. **Deploy** - Use [Docker Setup](./deployment/docker)

## 💡 Best Practices

### **Code Organization**
- Use service layer pattern for business logic
- Keep database operations in DB services
- Use middleware for cross-cutting concerns
- Follow DRY principles

### **Security**
- Always validate user input
- Use rate limiting on public endpoints
- Log security events
- Implement proper authentication

### **Performance**
- Monitor slow queries (>100ms)
- Use connection pooling
- Implement caching where appropriate
- Track memory usage

### **Logging**
- Use structured logging with context
- Set appropriate log levels
- Include request IDs for tracing
- Monitor logs in Kibana

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines and submit pull requests.

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: You're reading it!
- **API Reference**: [Swagger UI](https://localhost:3000/api-docs)
- **Issues**: [GitHub Issues](https://github.com/military-lms/lms/issues)

---

**Ready to build?** Start with the [Installation Guide](./getting-started/installation) →
