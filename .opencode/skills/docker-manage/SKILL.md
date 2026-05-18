# Docker Management Skill

## Description
Manages Docker container lifecycle, Nginx configuration, and infrastructure troubleshooting.

## Docker Compose
- **File:** `scripts/docker/docker-compose.yml`
- **Project:** `qaf-lms`
- **Network:** `lms-network`

## Containers

| Service | Container Name | Ports | Purpose |
|---------|---------------|-------|---------|
| Nginx | `lms-qaf-nginx` | 80/443/8443 | Reverse proxy, SSL |
| App DB | `lms-qaf-app-db` | 5432 | PostgreSQL (app) |
| Keycloak DB | `lms-qaf-keycloak-db` | — | PostgreSQL (keycloak) |
| Redis | `lms-qaf-redis` | 6379 | Cache |
| MinIO | `lms-qaf-minio` | 9000/9001 | S3 storage |
| Keycloak | `lms-qaf-keycloak` | 8080 | Auth |

## Operations

### Start All Services
```bash
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml up -d
```

### Stop All Services
```bash
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml down
```

### Check Status
```bash
docker ps --filter "name=lms-qaf" --format "table {{.Names}}\t{{.Status}}"
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml ps
```

### View Logs
```bash
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml logs -f <service>
docker logs lms-qaf-<service> --tail 50
```

### Restart a Service
```bash
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml restart <service>
```

### Hard Reset (Destroys Volumes)
```bash
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml down -v
docker system prune -f
```

## Nginx
- Config: `scripts/docker/nginx/nginx.conf`
- SSL certs: `scripts/docker/nginx/ssl/`
- After config changes: `docker exec lms-qaf-nginx nginx -s reload`

## Troubleshooting
- **Port conflict:** `lsof -i :<port>` to find what's using the port
- **Container exits immediately:** `docker logs lms-qaf-<service>` for the error
- **Network issues:** `docker network inspect lms-network` to check connectivity
- **Disk space:** `docker system df` to check Docker disk usage
- **Container not healthy:** `docker inspect lms-qaf-<service>` and check `State.Health`
