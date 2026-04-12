# MinIO Object Storage Setup Guide

## Overview
This guide walks you through setting up MinIO for the enhanced file management system in the QAF Courses LMS.

## Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ installed
- Sufficient disk space for file storage

## Quick Setup with Docker

### 1. Create Docker Compose File
Create `docker-compose.yml` in your project root:

```yaml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: qaf-minio
    ports:
      - "9000:9000"
      - "9001:9001"  # MinIO Console
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
      MINIO_DOMAIN: localhost
    volumes:
      - minio_data:/data
      - minio_config:/root/.minio
    command: server /data --console-address ":9001"
    restart: unless-stopped

  createbuckets:
    image: minio/mc
    container_name: qaf-minio-setup
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      /usr/bin/mc alias set myminio http://minio:9000 minioadmin minioadmin123;
      /usr/bin/mc mb myminio/documents;
      /usr/bin/mc mb myminio/public-files;
      /usr/bin/mc mb myminio/temp-uploads;
      /usr/bin/mc mb myminio/thumbnails;
      /usr/bin/mc mb myminio/previews;
      /usr/bin/mc anonymous set public myminio/public-files;
      /usr/bin/mc anonymous set public myminio/thumbnails;
      exit 0;
      "
    restart: "no"

volumes:
  minio_data:
    driver: local
  minio_config:
    driver: local
```

### 2. Start MinIO
```bash
docker-compose up -d
```

### 3. Access MinIO Console
- URL: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin123`

## Environment Configuration

Update your `.env` file with MinIO configuration:

```env
# MinIO Object Storage Configuration
MINIO_ENDPOINT=localhost:9000
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_REGION=us-east-1

# Document Processing Configuration
OCR_ENABLED=true
SIGNATURE_ENABLED=true
STAMPING_ENABLED=true
SCANNING_ENABLED=true

# File Processing Configuration
BASE_URL=http://localhost:3000
MAX_FILE_SIZE=100MB
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,tiff,gif
```

## Production Setup

### 1. Security Configuration
For production, use strong credentials:

```bash
# Generate secure access key
openssl rand -base64 32

# Generate secure secret key
openssl rand -base64 32
```

Update your production environment:

```env
MINIO_ACCESS_KEY=your_secure_access_key_here
MINIO_SECRET_KEY=your_secure_secret_key_here
MINIO_USE_SSL=true
```

### 2. SSL/TLS Setup
For production with SSL:

```yaml
services:
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_SERVER_URL: https://minio.yourdomain.com
      MINIO_BROWSER_REDIRECT_URL: https://minio-console.yourdomain.com
    volumes:
      - ./ssl:/etc/ssl/certs:ro
      - minio_data:/data
    command: server /data --console-address ":9001"
```

### 3. Backup Strategy
Set up regular backups:

```bash
# Create backup script
cat > backup-minio.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker run --rm -v minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio_backup_$DATE.tar.gz -C /data .
EOF

chmod +x backup-minio.sh

# Add to cron for daily backups
echo "0 2 * * * /path/to/backup-minio.sh" | crontab -
```

## Bucket Structure

The system creates the following buckets automatically:

### 1. `documents`
- **Purpose**: Private document storage
- **Access**: Authenticated users only
- **Retention**: Permanent
- **Features**: Versioning, encryption

### 2. `public-files`
- **Purpose**: Publicly accessible files
- **Access**: Anyone with URL
- **Retention**: Configurable
- **Features**: CDN integration ready

### 3. `temp-uploads`
- **Purpose**: Temporary upload staging
- **Access**: Upload process only
- **Retention**: 24 hours auto-cleanup
- **Features**: Automatic cleanup

### 4. `thumbnails`
- **Purpose**: Generated thumbnails
- **Access**: Public
- **Retention**: Same as parent file
- **Features**: Auto-generation

### 5. `previews`
- **Purpose**: Document previews
- **Access**: Authenticated users
- **Retention**: Same as parent file
- **Features**: PDF conversion, OCR

## File Processing Features

### 1. OCR (Optical Character Recognition)
- **Supported Formats**: PDF, TIFF, JPEG, PNG
- **Languages**: English, Arabic (configurable)
- **Output**: Extracted text, searchable PDFs

### 2. Document Processing
- **Thumbnail Generation**: Images and PDFs
- **Preview Generation**: PDF to image conversion
- **Page Count**: Automatic page detection
- **Metadata Extraction**: Author, creation date, etc.

### 3. Version Control
- **Automatic Versioning**: On significant changes
- **Version History**: Complete audit trail
- **Rollback**: Restore previous versions
- **Comparison**: Version diff capabilities

### 4. Digital Signatures
- **Digital Certificates**: X.509 support
- **Timestamping**: RFC 3161 compliant
- **Validation**: Certificate chain verification
- **Audit Trail**: Signature logging

### 5. Document Stamping
- **Approval Stamps**: Custom stamp designs
- **Watermarks**: Text and image watermarks
- **Positioning**: Precise coordinate placement
- **Templates**: Reusable stamp templates

## Monitoring and Maintenance

### 1. Health Checks
```bash
# Check MinIO service
curl http://localhost:9000/minio/health/live

# Check bucket status
docker exec qaf-minio mc ls myminio
```

### 2. Storage Monitoring
```bash
# Check disk usage
docker exec qaf-minio du -h /data

# Monitor bucket sizes
docker exec qaf-minio mc du myminio/documents
```

### 3. Log Monitoring
```bash
# View MinIO logs
docker logs qaf-minio

# Monitor in real-time
docker logs -f qaf-minio
```

## Performance Optimization

### 1. Storage Classes
- **STANDARD**: Default, balanced performance
- **REDUCED_REDUNDANCY**: Lower cost, less durability
- **GLACIER**: Archive storage, slower access

### 2. Caching
- **CDN Integration**: CloudFront/CloudFlare ready
- **Edge Caching**: Static file caching
- **Browser Caching**: Proper cache headers

### 3. Compression
- **Gzip**: Text file compression
- **Image Optimization**: Automatic resizing
- **PDF Optimization**: Size reduction

## Troubleshooting

### Common Issues

#### 1. Connection Refused
```bash
# Check if MinIO is running
docker ps | grep minio

# Check ports
netstat -tlnp | grep 9000
```

#### 2. Access Denied
```bash
# Check credentials
echo $MINIO_ACCESS_KEY
echo $MINIO_SECRET_KEY

# Test connection
docker exec qaf-minio mc admin info myminio
```

#### 3. Bucket Not Found
```bash
# Create missing buckets
docker exec qaf-minio mc mb myminio/missing-bucket
```

#### 4. Permission Issues
```bash
# Check bucket policies
docker exec qaf-minio mc policy list myminio/documents

# Set bucket policy
docker exec qaf-minio mc policy set public myminio/public-files
```

## Security Best Practices

### 1. Network Security
- **Firewall**: Restrict MinIO ports
- **VPN**: Use VPN for remote access
- **TLS**: Enable SSL/TLS in production

### 2. Access Control
- **IAM**: Use MinIO IAM policies
- **Service Accounts**: Separate credentials per service
- **Rotation**: Regular key rotation

### 3. Data Protection
- **Encryption**: Server-side encryption
- **Backup**: Regular automated backups
- **Audit**: Access logging and monitoring

## Integration with Application

### 1. File Upload Flow
```
Client → GraphQL → File Service → MinIO → Database
```

### 2. File Download Flow
```
Client → GraphQL → File Service → MinIO → Client
```

### 3. Processing Flow
```
Upload → MinIO → Processing Service → Update Database → Notify Client
```

## API Examples

### Upload File
```javascript
const mutation = `
  mutation CreateFileWithMinIO($input: CreateFileWithMinIOInput!) {
    createFileWithMinIO(input: $input) {
      id
      name
      url
      thumbnailUrl
      previewUrl
    }
  }
`;
```

### Get File Versions
```javascript
const query = `
  query GetFileVersions($fileId: ID!) {
    getFileVersions(fileId: $fileId) {
      id
      name
      version
      isLatest
      createdAt
    }
  }
`;
```

### Sign Document
```javascript
const mutation = `
  mutation SignDocument($fileId: ID!, $signatureData: SignatureInput!) {
    signDocument(fileId: $fileId, signatureData: $signatureData) {
      id
      workflowStatus
      signedAt
    }
  }
`;
```

## Support and Resources

- **MinIO Documentation**: https://docs.min.io/
- **MinIO GitHub**: https://github.com/minio/minio
- **GraphQL Documentation**: https://graphql.org/
- **Node.js SDK**: https://github.com/minio/minio-js

For support with this implementation:
- Check application logs for detailed error messages
- Verify MinIO configuration and connectivity
- Test with the provided test suite
- Review environment variables and permissions
