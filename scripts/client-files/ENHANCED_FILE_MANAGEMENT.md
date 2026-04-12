# Enhanced File Management System Documentation

## Overview
The Enhanced File Management System is a production-ready, enterprise-grade file handling solution built for the QAF Courses LMS. It combines MinIO object storage, document processing, version control, and secure sharing capabilities.

## 🚀 Key Features

### 1. **MinIO Object Storage Integration**
- Scalable S3-compatible storage
- Multiple bucket types for different use cases
- Automatic bucket management
- Storage class optimization

### 2. **Document Processing Pipeline**
- OCR (Optical Character Recognition)
- Thumbnail generation
- Preview creation
- Metadata extraction
- Page count detection

### 3. **Version Control System**
- Automatic version tracking
- Complete version history
- Rollback capabilities
- Parent-child relationships

### 4. **Digital Signatures**
- X.509 certificate support
- RFC 3161 timestamping
- Signature validation
- Audit trail maintenance

### 5. **Document Stamping**
- Custom stamp designs
- Approval workflows
- Watermarking capabilities
- Position-based placement

### 6. **Secure File Sharing**
- Token-based sharing
- Expiration controls
- Password protection
- Permission management

### 7. **Document Scanning**
- High-resolution scanning
- Multiple color modes
- Quality optimization
- Format conversion

## 📊 Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GraphQL API   │────│  File Service    │────│   MinIO Storage │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────▼────────┐
                       │ Document Process │
                       │   Service        │
                       └─────────────────┘
                                │
                       ┌────────▼────────┐
                       │   Database       │
                       │ (Prisma/MongoDB) │
                       └─────────────────┘
```

## 🗂️ Bucket Structure

### Primary Buckets

#### 1. `documents`
- **Purpose**: Primary document storage
- **Access**: Authenticated users only
- **Features**: Versioning, encryption, audit logging
- **Retention**: Permanent (unless manually deleted)

#### 2. `public-files`
- **Purpose**: Publicly accessible files
- **Access**: Anyone with URL
- **Features**: CDN integration ready, caching
- **Retention**: Configurable by policy

#### 3. `temp-uploads`
- **Purpose**: Temporary upload staging
- **Access**: Upload process only
- **Features**: Auto-cleanup after 24 hours
- **Retention**: 24 hours

#### 4. `thumbnails`
- **Purpose**: Generated thumbnails
- **Access**: Public
- **Features**: Auto-generation, multiple sizes
- **Retention**: Same as parent file

#### 5. `previews`
- **Purpose**: Document previews
- **Access**: Authenticated users
- **Features**: PDF conversion, OCR results
- **Retention**: Same as parent file

## 📝 File Model Schema

### Core Fields
```typescript
interface File {
  // Basic Information
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
  folder?: string;
  type?: string;
  status: string;
  downloads: number;
  lastAccessedAt?: Date;
  uploadedBy?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;

  // MinIO Integration
  bucketName?: string;
  objectKey?: string;
  etag?: string;
  checksum?: string;
  storageClass?: string;

  // Document Processing
  isProcessed: boolean;
  processedAt?: Date;
  extractedText?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  pageCount?: number;

  // Versioning & Workflow
  version: number;
  parentFileId?: string;
  isLatest: boolean;
  workflowStatus?: string;
  signedAt?: Date;
  signedBy?: string;
  stampedAt?: Date;
  stampedBy?: string;

  // Sharing & Security
  shareToken?: string;
  shareExpiresAt?: Date;
  canPreview: boolean;
  canDownload: boolean;
  passwordProtected: boolean;
  passwordHash?: string;
}
```

## 🔧 Configuration

### Environment Variables
```env
# MinIO Configuration
MINIO_ENDPOINT=localhost:9000
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_REGION=us-east-1

# Document Processing
OCR_ENABLED=true
SIGNATURE_ENABLED=true
STAMPING_ENABLED=true
SCANNING_ENABLED=true

# File Processing
BASE_URL=http://localhost:3000
MAX_FILE_SIZE=100MB
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,tiff,gif
```

### Storage Classes
- **STANDARD**: Default balanced performance
- **REDUCED_REDUNDANCY**: Lower cost, less durability
- **GLACIER**: Archive storage, slower access

## 🚀 API Usage

### 1. **Basic File Upload**
```graphql
mutation CreateFile($input: CreateFileInput!) {
  createFile(input: $input) {
    id
    name
    mimeType
    size
    status
    createdAt
  }
}
```

### 2. **MinIO Enhanced Upload**
```graphql
mutation CreateFileWithMinIO($input: CreateFileWithMinIOInput!) {
  createFileWithMinIO(input: $input) {
    id
    name
    bucketName
    objectKey
    etag
    checksum
    url
    thumbnailUrl
    previewUrl
  }
}
```

### 3. **Document Processing**
```graphql
mutation ProcessFile($fileId: ID!) {
  processFile(fileId: $fileId) {
    id
    isProcessed
    processedAt
    extractedText
    thumbnailUrl
    previewUrl
    pageCount
  }
}
```

### 4. **Version Management**
```graphql
mutation CreateFileVersion($parentFileId: ID!, $input: CreateFileVersionInput!) {
  createFileVersion(parentFileId: $parentFileId, input: $input) {
    id
    name
    version
    parentFileId
    isLatest
    createdAt
  }
}

query GetFileVersions($fileId: ID!) {
  getFileVersions(fileId: $fileId) {
    id
    name
    version
    isLatest
    createdAt
    parentFileId
  }
}
```

### 5. **Digital Signature**
```graphql
mutation SignDocument($fileId: ID!, $signatureData: SignatureInput!) {
  signDocument(fileId: $fileId, signatureData: $signatureData) {
    id
    workflowStatus
    signedAt
    signedBy
  }
}
```

### 6. **Document Stamping**
```graphql
mutation StampDocument($fileId: ID!, $stampData: StampInput!) {
  stampDocument(fileId: $fileId, stampData: $stampData) {
    id
    workflowStatus
    stampedAt
    stampedBy
  }
}
```

### 7. **Secure Sharing**
```graphql
mutation GenerateShareToken($fileId: ID!, $shareOptions: ShareOptionsInput!) {
  generateShareToken(fileId: $fileId, shareOptions: $shareOptions) {
    id
    shareToken
    shareExpiresAt
    canPreview
    canDownload
    passwordProtected
  }
}
```

### 8. **Document Scanning**
```graphql
mutation ScanDocument($scanData: ScanInput!) {
  scanDocument(scanData: $scanData) {
    success
    scannedAt
    pageCount
    resolution
    colorMode
    format
    fileSize
    quality
  }
}
```

## 🔄 Workflow Examples

### 1. **Document Upload & Processing**
```typescript
// 1. Upload file with MinIO
const uploadResult = await createFileWithMinIO({
  name: 'contract.pdf',
  originalName: 'Employment Contract.pdf',
  mimeType: 'application/pdf',
  size: 2048576,
  bucketName: 'documents',
  objectKey: 'contracts/2024/contract_001.pdf',
  // ... other fields
});

// 2. Process document (OCR, thumbnails, etc.)
const processedFile = await processFile(uploadResult.id);

// 3. Sign document
const signedFile = await signDocument(processedFile.id, {
  type: 'digital',
  certificate: 'cert_12345',
  timestamp: new Date().toISOString(),
  userId: 'user_123'
});

// 4. Generate share link
const sharedFile = await generateShareToken(signedFile.id, {
  canPreview: true,
  canDownload: false,
  expiryHours: 168
});
```

### 2. **Version Control Workflow**
```typescript
// 1. Upload initial version
const v1 = await createFileWithMinIO(initialData);

// 2. Create new version after edits
const v2 = await createFileVersion(v1.id, {
  name: 'contract_v2.pdf',
  version: 2,
  bucketName: 'documents',
  objectKey: 'contracts/2024/contract_002.pdf'
});

// 3. Get version history
const versions = await getFileVersions(v1.id);

// 4. Rollback to previous version if needed
const rollback = await updateFile(v2.id, {
  isLatest: false,
  workflowStatus: 'superseded'
});
```

### 3. **Document Approval Workflow**
```typescript
// 1. Upload draft document
const draft = await createFileWithMinIO(draftData);

// 2. Process and review
const processed = await processFile(draft.id);

// 3. Apply approval stamp
const stamped = await stampDocument(processed.id, {
  type: 'approval',
  text: 'APPROVED',
  position: { x: 100, y: 100, width: 200, height: 50 },
  userId: 'manager_123'
});

// 4. Final signature
const signed = await signDocument(stamped.id, {
  type: 'digital',
  certificate: 'exec_cert_67890',
  timestamp: new Date().toISOString(),
  userId: 'director_456'
});
```

## 📊 Performance Optimization

### 1. **Caching Strategy**
- **Browser Caching**: Static assets cached for 1 year
- **CDN Caching**: Edge caching for public files
- **Application Caching**: Redis for metadata

### 2. **Storage Optimization**
- **Compression**: Gzip for text files
- **Image Optimization**: Automatic resizing
- **PDF Optimization**: Size reduction

### 3. **Processing Optimization**
- **Async Processing**: Background job queue
- **Batch Processing**: Multiple files together
- **Progressive Enhancement**: Basic first, enhanced later

## 🔒 Security Features

### 1. **Access Control**
- **Role-based Permissions**: User, Admin, Super Admin
- **File-level Permissions**: Owner, viewer, editor
- **Bucket Policies**: MinIO IAM policies

### 2. **Data Protection**
- **Encryption**: Server-side encryption at rest
- **Transfer Security**: HTTPS/TLS for all transfers
- **Checksum Validation**: SHA-256 integrity checks

### 3. **Audit Trail**
- **Access Logging**: All file access logged
- **Change Tracking**: Version history maintained
- **Signature Audit**: Digital signature records

## 📈 Monitoring & Analytics

### 1. **Metrics to Track**
- **Upload Success Rate**: Percentage of successful uploads
- **Processing Time**: Average document processing duration
- **Storage Usage**: Bucket size and growth trends
- **Download Count**: File access patterns

### 2. **Health Checks**
- **MinIO Connectivity**: Storage service availability
- **Processing Queue**: Background job status
- **Database Health**: File metadata accessibility

### 3. **Alerting**
- **Storage Thresholds**: Low disk space warnings
- **Processing Failures**: Failed OCR/processing jobs
- **Security Events**: Unauthorized access attempts

## 🧪 Testing

### 1. **Unit Tests**
- File service functions
- MinIO integration
- Document processing
- Version control logic

### 2. **Integration Tests**
- End-to-end file workflows
- GraphQL mutations/queries
- MinIO bucket operations
- Database interactions

### 3. **Performance Tests**
- Large file uploads
- Concurrent processing
- Storage throughput
- API response times

### 4. **Test Suite Execution**
```bash
# Run basic file tests
npm run test:files

# Run enhanced file tests
npm run test:enhanced-files

# Run all file-related tests
npm run test:file-system
```

## 🚀 Deployment

### 1. **Development Setup**
```bash
# Start MinIO with Docker
docker-compose up -d minio

# Start GraphQL server
npm run graphql:dev

# Run tests
npm run test:enhanced-files
```

### 2. **Production Setup**
```bash
# Deploy MinIO cluster
kubectl apply -f k8s/minio-deployment.yaml

# Deploy application
kubectl apply -f k8s/app-deployment.yaml

# Verify deployment
kubectl get pods -l app=file-management
```

### 3. **Environment Configuration**
- **Development**: Local MinIO, debug logging
- **Staging**: Remote MinIO, comprehensive testing
- **Production**: MinIO cluster, full security

## 🔧 Troubleshooting

### Common Issues

#### 1. **MinIO Connection Failed**
```bash
# Check MinIO status
docker ps | grep minio

# Test connectivity
curl http://localhost:9000/minio/health/live

# Check credentials
echo $MINIO_ACCESS_KEY
```

#### 2. **File Processing Timeout**
```bash
# Check processing queue
docker logs file-management-processor

# Monitor memory usage
docker stats file-management-api
```

#### 3. **Version Control Issues**
```bash
# Check database consistency
npx prisma db validate

# Verify version relationships
npx prisma studio
```

## 📚 Additional Resources

### Documentation
- [MinIO Documentation](https://docs.min.io/)
- [GraphQL Documentation](https://graphql.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)

### Tools & Libraries
- [MinIO JavaScript SDK](https://github.com/minio/minio-js)
- [Sharp (Image Processing)](https://sharp.pixelplumbing.com/)
- [PDF-lib (PDF Manipulation)](https://pdf-lib.js.org/)
- [Tesseract.js (OCR)](https://github.com/naptha/tesseract.js)

### Support
- **Application Logs**: Check GraphQL server logs
- **MinIO Logs**: Check MinIO container logs
- **Database Logs**: Check Prisma query logs
- **Monitoring**: Use application monitoring tools

## 🎯 Best Practices

### 1. **File Organization**
- Use consistent folder structures
- Implement naming conventions
- Separate public and private files
- Regular cleanup of temporary files

### 2. **Performance**
- Implement lazy loading for large lists
- Use pagination for file browsing
- Optimize image sizes before upload
- Cache frequently accessed files

### 3. **Security**
- Validate all file uploads
- Implement virus scanning
- Use secure file sharing links
- Regular security audits

### 4. **Scalability**
- Design for horizontal scaling
- Implement load balancing
- Use CDN for static assets
- Monitor storage growth

This enhanced file management system provides a comprehensive, enterprise-grade solution for handling documents in the QAF Courses LMS, with features that scale from small deployments to large enterprise implementations.
