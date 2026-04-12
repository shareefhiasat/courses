# Shared Drive System Documentation

## Overview
The Shared Drive System is a **Google Drive-like** file management solution built on MinIO object storage. It provides each user with a personal drive, advanced sharing capabilities, and enterprise-grade security features.

## 🚀 Key Features

### 1. **Personal User Drives**
- Automatic drive creation for each user
- Pre-configured folder structure
- Hierarchical folder organization
- Path-based navigation

### 2. **Advanced Sharing System**
- **Public Sharing**: Anyone with the link can access
- **Private Sharing**: Password-protected access
- **Permission Control**: Preview-only or full download access
- **Expiration Control**: Time-limited sharing links
- **Share Tokens**: Secure, unique sharing tokens

### 3. **Folder Management**
- Create nested folder structures
- Default folders: Documents, Images, Videos, Audio, Archives
- Special folders: "Shared with me", "Public"
- Path-based folder operations

### 4. **Security & Permissions**
- **Owner Control**: Only owners can share their files
- **Access Control**: Granular permission settings
- **Password Protection**: Optional password for shared items
- **Token Security**: Cryptographically secure share tokens
- **Expiration Management**: Automatic link expiration

### 5. **Drive Statistics**
- File and folder counts
- Storage usage tracking
- Shared items monitoring
- Storage quota management

## 📁 Drive Structure

### Default Folder Structure
```
/users/{userId}/
├── Documents/          # Personal documents
├── Images/             # Image files
├── Videos/             # Video files
├── Audio/              # Audio files
├── Archives/           # Archive files
├── Shared with me/     # Items shared with user
└── Public/             # Publicly shared items
```

### Path-Based Organization
- **Root Path**: `/users/{userId}/`
- **Folder Paths**: `/users/{userId}/Documents/SubFolder/`
- **File Paths**: `/users/{userId}/Documents/file.pdf`
- **Path Navigation**: Hierarchical folder traversal

## 🔐 Security Model

### Sharing Permissions

#### **Public Sharing**
```json
{
  "isPublic": true,
  "canPreview": true,
  "canDownload": true,
  "passwordProtected": false,
  "shareExpiresAt": null
}
```

#### **Private Sharing**
```json
{
  "isPublic": false,
  "canPreview": true,
  "canDownload": false,
  "passwordProtected": true,
  "shareExpiresAt": "2024-01-20T12:00:00Z"
}
```

### Access Control Levels

| Permission Level | Preview | Download | Password | Expiration |
|------------------|---------|----------|----------|------------|
| **Public View** | ✅ | ❌ | ❌ | Optional |
| **Public Full** | ✅ | ✅ | ❌ | Optional |
| **Private View** | ✅ | ❌ | ✅ | Required |
| **Private Full** | ✅ | ✅ | ✅ | Required |

## 🛠️ API Operations

### User Drive Management

#### Create User Drive
```graphql
mutation CreateUserDrive($userId: String!) {
  createUserDrive(userId: $userId) {
    rootFolder {
      id
      name
      path
      type
    }
    subFolders {
      id
      name
      path
      type
    }
  }
}
```

#### Get User Drive
```graphql
query UserDrive($userId: String!, $folderPath: String) {
  userDrive(userId: $userId, folderPath: $folderPath) {
    folders {
      id
      name
      path
      type
      createdAt
    }
    files {
      id
      name
      mimeType
      size
      createdAt
    }
    currentPath
  }
}
```

#### Create Folder
```graphql
mutation CreateFolder($input: CreateFolderInput!) {
  createFolder(input: $input) {
    id
    name
    path
    folder
    type
  }
}
```

**Input:**
```json
{
  "userId": "user123",
  "folderName": "Project Files",
  "parentPath": "/users/user123/Documents"
}
```

### Sharing Operations

#### Share Item
```graphql
mutation ShareItem($input: ShareItemInput!) {
  shareItem(input: $input) {
    item {
      id
      name
      type
    }
    shareUrl
    shareToken
    expiresAt
    canPreview
    canDownload
  }
}
```

**Input:**
```json
{
  "fileId": "file123",
  "ownerId": "user123",
  "shareOptions": {
    "canPreview": true,
    "canDownload": true,
    "password": "secure123",
    "expiryHours": 168,
    "isPublic": false
  }
}
```

#### Access Shared Item
```graphql
query SharedItem($shareToken: String!, $password: String) {
  sharedItem(shareToken: $shareToken, password: $password) {
    item {
      id
      name
      type
    }
    canPreview
    canDownload
  }
}
```

#### Revoke Sharing
```graphql
mutation RevokeSharing($fileId: ID!, $ownerId: String!) {
  revokeSharing(fileId: $fileId, ownerId: $ownerId) {
    id
    name
    shareToken
    isPublic
  }
}
```

### Management Operations

#### Get User Shared Items
```graphql
query UserSharedItems($userId: String!) {
  userSharedItems(userId: $userId) {
    id
    name
    type
    shareToken
    shareExpiresAt
    canPreview
    canDownload
    isPublic
    passwordProtected
  }
}
```

#### Get Drive Statistics
```graphql
query DriveStatistics($userId: String!) {
  driveStatistics(userId: $userId) {
    totalFiles
    totalFolders
    totalSize
    sharedItems
    storageUsed
  }
}
```

## 🗄️ MinIO Integration

### Bucket Structure
```
user-drives/
├── users/
│   ├── user123/
│   │   ├── Documents/
│   │   ├── Images/
│   │   ├── Videos/
│   │   ├── Audio/
│   │   ├── Archives/
│   │   ├── Shared with me/
│   │   └── Public/
│   └── user456/
│       ├── Documents/
│       └── ...
└── temp-uploads/
    └── temp123/
```

### Object Key Format
- **Folders**: `users/{userId}/Documents/`
- **Files**: `users/{userId}/Documents/filename.pdf`
- **Thumbnails**: `users/{userId}/Documents/.thumbnails/filename_thumb.jpg`
- **Previews**: `users/{userId}/Documents/.previews/filename_preview.jpg`

## 📊 Usage Examples

### 1. **Setting up a New User Drive**
```javascript
// Create drive for new user
const result = await createUserDrive('user123');
console.log('Drive created:', result.rootFolder.name);

// Navigate to Documents folder
const documents = await getUserDrive('user123', '/users/user123/Documents');
console.log('Documents:', documents.files);
```

### 2. **Creating a Project Folder Structure**
```javascript
// Create main project folder
const projectFolder = await createFolder('user123', 'Q4 Project', '/users/user123/Documents');

// Create subfolders
const designs = await createFolder('user123', 'Designs', projectFolder.path);
const reports = await createFolder('user123', 'Reports', projectFolder.path);
const assets = await createFolder('user123', 'Assets', projectFolder.path);
```

### 3. **Sharing Files with Different Permissions**
```javascript
// Public sharing - anyone can view and download
const publicShare = await shareItem('file123', 'user123', {
  isPublic: true,
  canPreview: true,
  canDownload: true,
  expiryHours: 168 // 7 days
});

// Private sharing - password protected, preview only
const privateShare = await shareItem('file456', 'user123', {
  isPublic: false,
  canPreview: true,
  canDownload: false,
  password: 'secure123',
  expiryHours: 24 // 1 day
});
```

### 4. **Accessing Shared Files**
```javascript
// Access public file
const publicAccess = await accessSharedItem(shareToken);

// Access private file with password
const privateAccess = await accessSharedItem(shareToken, 'secure123');
```

### 5. **Monitoring Drive Usage**
```javascript
// Get user statistics
const stats = await getDriveStatistics('user123');
console.log(`Storage used: ${stats.storageUsed}`);
console.log(`Shared items: ${stats.sharedItems}`);

// Get all shared items
const sharedItems = await getUserSharedItems('user123');
console.log('Active shares:', sharedItems.length);
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

# Shared Drive Configuration
BASE_URL=http://localhost:3000
MAX_DRIVE_SIZE=10GB
MAX_FILE_SIZE=100MB
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,mp4,mp3,zip

# Security Configuration
SHARE_TOKEN_LENGTH=32
DEFAULT_SHARE_EXPIRY_HOURS=168
MAX_SHARE_EXPIRY_HOURS=8760
```

### Storage Classes
- **STANDARD**: Default for user drives
- **REDUCED_REDUNDANCY**: For temporary uploads
- **GLACIER**: For archived files

## 🚀 Performance Features

### 1. **Path-Based Navigation**
- Efficient folder traversal
- Hierarchical path resolution
- Fast folder listings

### 2. **Caching Strategy**
- Folder structure caching
- Share token caching
- Statistics caching

### 3. **Security Optimization**
- Token-based access control
- Password hashing
- Expiration management

### 4. **Storage Optimization**
- Automatic folder creation
- Path-based object keys
- Efficient bucket organization

## 🛡️ Security Considerations

### 1. **Access Control**
- **Owner Verification**: Only owners can share files
- **Token Security**: Cryptographically secure tokens
- **Password Hashing**: SHA-256 password hashing
- **Expiration Management**: Automatic link expiration

### 2. **Data Protection**
- **Path Isolation**: User-specific paths
- **Bucket Separation**: Dedicated buckets for user drives
- **Permission Validation**: Strict permission checks
- **Audit Logging**: Complete access logging

### 3. **Share Security**
- **Unique Tokens**: No predictable share tokens
- **Time Limits**: Configurable expiration times
- **Password Protection**: Optional password requirements
- **Access Revocation**: Immediate sharing revocation

## 📱 Frontend Integration

### React Components Structure
```
components/
├── SharedDrive/
│   ├── DriveExplorer.jsx      # Main drive interface
│   ├── FolderTree.jsx          # Folder navigation tree
│   ├── FileList.jsx            # File listing component
│   ├── ShareDialog.jsx         # Sharing interface
│   ├── CreateFolder.jsx       # Folder creation
│   ├── FilePreview.jsx         # File preview component
│   └── DriveStats.jsx          # Statistics display
```

### Key Features
- **Drag & Drop**: File upload and folder organization
- **Real-time Updates**: Live folder structure updates
- **Search**: File and folder search
- **Bulk Operations**: Multiple file operations
- **Preview**: Built-in file preview system

## 🔄 Migration Guide

### From Basic File System
1. **Create User Drives**: Initialize drives for existing users
2. **Migrate Files**: Move existing files to drive structure
3. **Update Paths**: Update file paths in database
4. **Create Folders**: Set up default folder structure
5. **Test Sharing**: Verify sharing functionality

### Data Migration Steps
```javascript
// 1. Create drives for existing users
const users = await getAllUsers();
for (const user of users) {
  await createUserDrive(user.id);
}

// 2. Migrate existing files
const files = await getAllFiles();
for (const file of files) {
  const newPath = `/users/${file.uploadedBy}/Documents/${file.name}`;
  await updateFilePath(file.id, newPath);
}
```

## 📊 Monitoring & Analytics

### Key Metrics
- **Drive Usage**: Storage consumption per user
- **Sharing Activity**: Number of shared items
- **Access Patterns**: File access frequency
- **Folder Structure**: Common folder organizations

### Performance Monitoring
- **API Response Times**: Drive operation latency
- **MinIO Performance**: Storage operation speed
- **Database Queries**: Query optimization
- **Cache Hit Rates**: Caching effectiveness

## 🚀 Future Enhancements

### Planned Features
1. **Collaborative Folders**: Multi-user folder sharing
2. **Version History**: File version tracking in drives
3. **Advanced Search**: Full-text search in drives
4. **Mobile App**: Native mobile drive application
5. **Sync Client**: Desktop synchronization client

### Scalability Improvements
1. **Horizontal Scaling**: Multi-node MinIO clusters
2. **CDN Integration**: Edge caching for shared files
3. **Load Balancing**: API load distribution
4. **Database Sharding**: User-based data partitioning

## 🎯 Best Practices

### For Developers
1. **Path Validation**: Always validate folder paths
2. **Permission Checks**: Verify ownership before operations
3. **Error Handling**: Comprehensive error management
4. **Logging**: Detailed operation logging
5. **Security**: Never expose internal paths

### For Users
1. **Folder Organization**: Use logical folder structures
2. **File Naming**: Use descriptive file names
3. **Sharing**: Share only necessary permissions
4. **Security**: Use strong passwords for private shares
5. **Storage**: Monitor storage usage regularly

## 📞 Support & Troubleshooting

### Common Issues
1. **Drive Creation Failed**: Check user permissions
2. **Sharing Not Working**: Verify ownership and permissions
3. **Access Denied**: Check share token and password
4. **Path Not Found**: Verify folder path format
5. **Storage Full**: Check user storage quotas

### Debugging Tips
1. **Check Logs**: Review detailed error logs
2. **Verify Paths**: Ensure correct path format
3. **Test Permissions**: Validate user permissions
4. **Check Tokens**: Verify share token validity
5. **Monitor Storage**: Check MinIO bucket status

This shared drive system provides a **Google Drive-like experience** with enterprise-grade security, scalability, and features. It's designed to handle thousands of users with millions of files while maintaining excellent performance and security standards.
