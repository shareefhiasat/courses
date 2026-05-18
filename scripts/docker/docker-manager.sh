#!/bin/bash
set -euo pipefail

COMPOSE_FILE="scripts/docker/docker-compose.yml"
PROJECT="qaf-lms"

cmd=${1:-status}

case "$cmd" in
  up|start)
    echo "Starting Docker services..."
    docker compose -p "$PROJECT" -f "$COMPOSE_FILE" up -d
    echo "Waiting for services..."
    sleep 10
    docker ps --filter "name=lms-qaf" --format "table {{.Names}}\t{{.Status}}"
    ;;
  down|stop)
    echo "Stopping Docker services..."
    docker compose -p "$PROJECT" -f "$COMPOSE_FILE" down
    ;;
  restart)
    "$0" down
    "$0" up
    ;;
  status|ps)
    docker compose -p "$PROJECT" -f "$COMPOSE_FILE" ps
    echo "---"
    docker ps --filter "name=lms-qaf" --format "table {{.Names}}\t{{.Status}}"
    ;;
  logs)
    shift
    docker compose -p "$PROJECT" -f "$COMPOSE_FILE" logs -f "$@"
    ;;
  reset)
    echo "WARNING: This will remove all containers and volumes!"
    docker compose -p "$PROJECT" -f "$COMPOSE_FILE" down -v
    docker system prune -f
    echo "Done. Run '$0 up' to recreate."
    ;;
  *)
    echo "Usage: $0 {up|down|restart|status|logs|reset}"
    exit 1
    ;;
esac
