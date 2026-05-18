# Development Guidelines for Military LMS

## Project Structure
- `backend/` - Express.js backend API
- `client/` - React frontend with Vite
- `scripts/docker/` - Docker compose configuration
- `backups/` - Database and Keycloak backups

## Key Commands

### Starting the app
```bash
# Start Docker services
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml up -d

# Start backend (port 8001)
node backend/server.js

# Start frontend (port 5174, HTTPS)
cd client && node node_modules/vite/bin/vite.js --host
```

### Database
```bash
# Generate Prisma client
npx prisma generate --schema=client/prisma/schema.prisma

# Access database
docker exec -it lms-qaf-app-db psql -U military_lms -d military_lms
```

### Common Issues
- 500 errors: Check backend logs with `tail -f /tmp/backend.log`
- Database issues: Restart containers `docker restart lms-qaf-app-db`
- Keycloak issues: Check `docker logs lms-qaf-keycloak`

## Testing Changes
1. Make changes to code
2. Restart affected service (backend or frontend)
3. Test in browser at https://localhost:5174
4. Create PR referencing the issue number