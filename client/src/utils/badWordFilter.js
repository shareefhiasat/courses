import { info, error, warn, debug } from '@services/utils/logger.js';

// Simple bad word filter for English and Arabic
// Free and lightweight solution

// English bad words list (common profanity)
const englishBadWords = [
  'fuck', 'shit', 'ass', 'bitch', 'bastard', 'damn', 'hell', 'crap',
  'dick', 'pussy', 'cock', 'cunt', 'whore', 'slut', 'idiot', 'stupid',
  'moron', 'retard', 'loser', 'jerk', 'asshole', 'motherfucker', 'son of a bitch'
];

// Arabic bad words list (common profanity in Arabic script)
const arabicBadWords = [
  // Common Arabic profanity
  'كس', 'زني', 'خنيث', 'قحب', 'شرموطة', 'حرامي', 'كلب', 'خنزير',
  'ابن الحرام', 'ابن العاهرة', 'متناك', 'منيوك', 'خرا', 'تبن', 'لبوة',
  'عاهرة', 'مومس', 'قواد', 'فاشخ', 'فاضي', 'غبي', 'حمار', 'حشري',
  
  // Gulf/Qatari dialect specific
  'طيز', 'نيك', 'مص', 'قحبة', 'شرموط', 'كسخ', 'خول', 'لوطي',
  'مخنث', 'حقير', 'حقيرة', 'وسخ', 'وسخة', 'قذر', 'قذرة',
  
  // More Qatari/Gulf common insults
  'ابن الكلب', 'ابن الخنزير', 'ابن القحبة', 'ابن الشرموطة',
  'أم العاهرة', 'أم القحبة', 'أم الشرموطة', 'أم الحرام',
  'يلعن أبوك', 'يلعن أمك', 'يلعن دينك', 'يلعن ربك',
  
  // Additional profanity
  'زق', 'طيزي', 'كسمك', 'كس أمك', 'كسخت', 'منكوح', 'منيوكة',
  'شرموطه', 'قحابه', 'عواهر', 'داعر', 'داعرة', 'مأبون',
  
  // Qatari slang variations
  'حچي', 'حچية', 'تبن', 'طيز', 'طياز', 'خاين', 'خاينة',
  'نصاب', 'نصابة', 'حرامية', 'سارق', 'سارقة',
  
  // More insults
  'حقير', 'حقيرة', 'وغد', 'وغدة', 'ساقط', 'ساقطة', 'رذيل', 'رذيلة',
  'خسيس', 'خسيسة', 'دنيء', 'دنيئة', 'لئيم', 'لئيمة'
];

// Create regex patterns for matching (case insensitive)
const createWordPattern = (words) => {
  return new RegExp('\\b(' + words.join('|') + ')\\b', 'gi');
};

const englishPattern = createWordPattern(englishBadWords);
const arabicPattern = createWordPattern(arabicBadWords);

// Filter function to replace bad words with asterisks
export const filterBadWords = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  let filteredText = text;
  
  // Filter English bad words
  filteredText = filteredText.replace(englishPattern, (match) => {
    return '*'.repeat(match.length);
  });
  
  // Filter Arabic bad words
  filteredText = filteredText.replace(arabicPattern, (match) => {
    return '*'.repeat(match.length);
  });
  
  return filteredText;
};

// Check if text contains bad words
export const containsBadWords = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  return englishPattern.test(text) || arabicPattern.test(text);
};

// Get list of detected bad words (for moderation purposes)
export const getDetectedBadWords = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const detected = [];
  
  // Check English words
  const englishMatches = text.match(englishPattern);
  if (englishMatches) {
    detected.push(...englishMatches.map(word => word.toLowerCase()));
  }
  
  // Check Arabic words
  const arabicMatches = text.match(arabicPattern);
  if (arabicMatches) {
    detected.push(...arabicMatches);
  }
  
  return [...new Set(detected)]; // Remove duplicates
};
