/**
 * File and Image Validation Constants
 */

// Valid image types for user uploads
export const VALID_IMAGE_TYPES = ['profile', 'qid', 'military', 'additional'];

// Allowed MIME types for file uploads
export const VALID_FILE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
export const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

// Maximum file size for uploads (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Localized error messages
export const ERROR_MESSAGES = {
  en: {
    FILE_SIZE_ERROR: 'File size exceeds 5MB limit',
    INVALID_FILE_TYPE_ERROR: 'Invalid file type. Allowed: JPEG, PNG, PDF',
    NO_FILE_PROVIDED: 'No file provided',
    INVALID_IMAGE_TYPE: 'Invalid image type',
    VALID_TYPES: 'Valid types are: profile, qid, military, additional',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
    NO_UPLOAD_PERMISSION: 'You do not have permission to upload images for this user',
    USER_NOT_FOUND: 'User not found',
    FAILED_PREPARE_FOLDER: 'Failed to prepare upload folder',
    FAILED_UPLOAD_NEXTCLOUD: 'Failed to upload file to Nextcloud',
    IMAGE_UPLOADED_SUCCESS: 'Image uploaded successfully',
    IMAGE_NOT_FOUND: 'Image not found',
    FAILED_DELETE_NEXTCLOUD: 'Failed to delete file from Nextcloud',
    IMAGE_DELETED_SUCCESS: 'Image deleted successfully',
    INTERNAL_SERVER_ERROR: 'Internal server error'
  },
  ar: {
    FILE_SIZE_ERROR: 'حجم الملف يتجاوز حد 5 ميجابايت',
    INVALID_FILE_TYPE_ERROR: 'نوع الملف غير صالح. الأنواع المسموحة: JPEG، PNG، PDF',
    NO_FILE_PROVIDED: 'لم يتم توفير ملف',
    INVALID_IMAGE_TYPE: 'نوع الصورة غير صالح',
    VALID_TYPES: 'الأنواع الصالحة: profile، qid، military، additional',
    INSUFFICIENT_PERMISSIONS: 'أذونات غير كافية',
    NO_UPLOAD_PERMISSION: 'ليس لديك إذن لرفع الصور لهذا المستخدم',
    USER_NOT_FOUND: 'المستخدم غير موجود',
    FAILED_PREPARE_FOLDER: 'فشل في تحضير مجلد الرفع',
    FAILED_UPLOAD_NEXTCLOUD: 'فشل في رفع الملف إلى Nextcloud',
    IMAGE_UPLOADED_SUCCESS: 'تم رفع الصورة بنجاح',
    IMAGE_NOT_FOUND: 'الصورة غير موجودة',
    FAILED_DELETE_NEXTCLOUD: 'فشل في حذف الملف من Nextcloud',
    IMAGE_DELETED_SUCCESS: 'تم حذف الصورة بنجاح',
    INTERNAL_SERVER_ERROR: 'خطأ في الخادم الداخلي'
  }
};

// Get localized message based on language
export const getLocalizedMessage = (key, lang = 'en') => {
  const messages = ERROR_MESSAGES[lang] || ERROR_MESSAGES.en;
  return messages[key] || ERROR_MESSAGES.en[key] || key;
};

// Nextcloud System Tags for document classification
export const NEXTCLOUD_TAGS = {
  PROFILE: 'user-avatar',
  QID: 'user-qid',
  MILITARY: 'user-military-id',
  ADDITIONAL: 'user-additional'
};

// Map image types to Nextcloud tags
export const IMAGE_TYPE_TO_TAG = {
  profile: NEXTCLOUD_TAGS.PROFILE,
  qid: NEXTCLOUD_TAGS.QID,
  military: NEXTCLOUD_TAGS.MILITARY,
  additional: NEXTCLOUD_TAGS.ADDITIONAL
};
