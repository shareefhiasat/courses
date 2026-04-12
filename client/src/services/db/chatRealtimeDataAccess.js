import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Chat Real-time Data Access
 * 
 * Replaces Firebase Storage with local storage and API calls
 */

export const getChatServerTimestampRaw = () => {
  return new Date().toISOString();
};

export const uploadChatFileRaw = async (filePath, file, metadata = undefined) => {
  // Mock implementation - replace with actual file upload API
  info('📁 File upload (mock):', { filePath, fileName: file.name, size: file.size });
  
  // For now, return a mock URL
  return { 
    fileUrl: URL.createObjectURL(file), 
    filePath: filePath 
  };
};

export const deleteChatFileRaw = async (filePath) => {
  // Mock implementation - replace with actual file delete API
  info('🗑️ File delete (mock):', { filePath });
  return true;
};

export const sendChatMessage = async (messageData) => {
  // Mock implementation - replace with actual API call
  info('💬 Send message (mock):', messageData);
  return { success: true, id: Date.now().toString() };
};

export const getChatMessages = async (chatId) => {
  // Mock implementation - replace with actual API call
  info('📋 Get messages (mock):', { chatId });
  return [];
};
