# Monitoring Skill

## Description
Monitoring infrastructure — Logstash, Grafana, Elasticsearch, and Allure reporting.

## Services
- **Elasticsearch:** search and analytics engine for logs
- **Logstash:** log ingestion and processing pipeline
- **Grafana:** metrics visualization and dashboards
- **Allure:** test report framework

## Operations

### Check Elasticsearch Health
```bash
curl -s http://localhost:9200/_cluster/health | python3 -m json.tool
```

### Search Elasticsearch Indices
```bash
curl -s http://localhost:9200/_cat/indices?v
```

### Query Logs from Elasticsearch
```bash
curl -s -X GET "http://localhost:9200/<index>/_search" \
  -H "Content-Type: application/json" \
  -d '{"query":{"match_all":{}},"size":10}'
```

### Check Logstash Pipeline
```bash
curl -s http://localhost:9600/_node/stats/pipelines | python3 -m json.tool
```

### Check Grafana Health
```bash
curl -s http://localhost:3000/api/health
```

### List Grafana Dashboards
```bash
curl -s http://localhost:3000/api/search \
  -H "Authorization: Bearer <api_key_or_admin:admin>" | python3 -m json.tool
```

### View Docker Service Logs
```bash
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml logs -f <service>
```

### Generate Allure Report
```bash
# After running tests with Allure results:
allure generate allure-results -o allure-report --clean
allure open allure-report
```

### Check Allure Results Directory
```bash
ls -la allure-results/ 2>/dev/null || echo "No allure-results directory"
```

## Configuration Files
- Logstash: `scripts/docker/logstash/`
- Grafana: `scripts/docker/grafana/`
- Prometheus: `scripts/docker/prometheus/`
- ELK stack: `scripts/docker/elk-stack.yml`

## Troubleshooting
- **Elasticsearch not responding:** container may need more memory
- **Logstash not ingesting:** check pipeline config in `scripts/docker/logstash/`
- **Grafana can't connect to data source:** verify datasource URL and credentials
- **No logs in Kibana:** check Logstash input configuration and filebeat/container logs
- **Allure report empty:** ensure tests are configured with Allure annotations
