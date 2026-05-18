# MinIO Management Skill

## Description
Manages MinIO S3-compatible object storage for file uploads.

## Connection Details
- **Console:** http://localhost:9001
- **API:** http://localhost:9000
- **Credentials:** `minioadmin` / `minioadmin`
- **Container:** `lms-qaf-minio`
- **Data volume:** `minio_data`

## Operations

### Check MinIO Status
```bash
curl -s http://localhost:9000/minio/health/live
curl -s http://localhost:9000/minio/health/cluster
```

### List Buckets (using MinIO Client or API)
```bash
docker exec lms-qaf-minio mc ls local/
```

### Create Bucket
```bash
docker exec lms-qaf-minio mc mb local/<bucket-name>
```

### List Objects in Bucket
```bash
docker exec lms-qaf-minio mc ls local/<bucket-name>/
```

### Upload a File
```bash
docker cp /local/path/file.txt lms-qaf-minio:/tmp/
docker exec lms-qaf-minio mc cp /tmp/file.txt local/<bucket-name>/
```

### Download a File
```bash
docker exec lms-qaf-minio mc cp local/<bucket-name>/<file> /tmp/
docker cp lms-qaf-minio:/tmp/<file> ./downloads/
```

### Set Bucket Policy (Public Read)
```bash
docker exec lms-qaf-minio mc policy set download local/<bucket-name>
```

### Check Bucket Disk Usage
```bash
docker exec lms-qaf-minio du -sh /data/<bucket-name>
```

### View MinIO Logs
```bash
docker logs lms-qaf-minio --tail 50
```

## Integration with App
- Files uploaded via the app are stored in MinIO buckets
- The app uses S3-compatible SDK to interact with MinIO
- Check the Prisma schema for file/attachment models
- Uploaded files are served through Nginx or direct MinIO URL

## Troubleshooting
- **Cannot connect:** verify container is running on port 9000/9001
- **Access denied:** check bucket policies and credentials
- **Upload fails:** check disk space: `docker exec lms-qaf-minio df -h`
- **Corrupted files:** verify checksums, check network stability
- **Permission errors:** ensure credentials match compose file
