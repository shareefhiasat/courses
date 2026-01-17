# Bad Word Filter Implementation

A simple, free, and lightweight bad word filter for English and Arabic languages implemented in the ChatPage component.

## Features

- **Free**: No third-party libraries or paid services required
- **Lightweight**: Pure JavaScript implementation with minimal overhead
- **Bilingual**: Supports both English and Arabic bad words
- **Real-time filtering**: Filters messages as they are sent
- **Non-destructive**: Replaces bad words with asterisks rather than blocking messages
- **User feedback**: Shows warning when content is filtered

## Files Added/Modified

### New Files
- `src/utils/badWordFilter.js` - Core filter implementation
- `src/utils/badWordFilter.test.js` - Test suite for validation

### Modified Files
- `src/pages/ChatPage.jsx` - Integrated filter into message sending and editing

## How It Works

### 1. Word Lists
The filter uses predefined lists of common profanity in:
- **English**: 27 common English bad words
- **Arabic**: 60+ Arabic bad words including:
  - Modern Standard Arabic profanity
  - Gulf/Qatari dialect specific terms
  - Common insults and curses
  - Regional variations and slang

### 2. Pattern Matching
- Creates regex patterns with word boundaries (`\b`) to match whole words only
- Case-insensitive matching for English
- Exact matching for Arabic script

### 3. Filtering Process
- Replaces detected bad words with asterisks of the same length
- Preserves original message structure
- Shows user warning when filtering occurs

### 4. Integration Points
- **New messages**: Applied in `handleSendMessage()` function
- **Message edits**: Applied in `handleSaveEdit()` function
- **Preview updates**: Updates last message previews with filtered content

## Usage Examples

### Before Filter
```
Input: "What the fuck is this stupid"
Output: "What the **** is this ******"
```

### Arabic Example
```
Input: "انت غبي وكلب"
Output: "انت *** و****"
```

### Qatari Dialect Example
```
Input: "طيز وكس وخول ابن القحبة"
Output: "**** *** **** *** *****"
```

### Mixed Language
```
Input: "Hello stupid انت غبي"
Output: "Hello ****** انت ***"
```

## API Reference

### `filterBadWords(text)`
Filters bad words from text by replacing them with asterisks.

**Parameters:**
- `text` (string): The text to filter

**Returns:**
- (string): The filtered text with bad words replaced by asterisks

### `containsBadWords(text)`
Checks if text contains any bad words.

**Parameters:**
- `text` (string): The text to check

**Returns:**
- (boolean): True if bad words are detected, false otherwise

### `getDetectedBadWords(text)`
Returns an array of detected bad words.

**Parameters:**
- `text` (string): The text to analyze

**Returns:**
- (array): Array of detected bad words (lowercase for English, original case for Arabic)

## Edge Cases Handled

- **Partial matches**: Words containing bad words but not exact matches are preserved (e.g., "stupidly" → "stupidly")
- **Empty/null input**: Safely handles empty strings, null, and undefined
- **Mixed languages**: Properly filters mixed English/Arabic content
- **Case sensitivity**: English filtering is case-insensitive

## Performance Considerations

- **Minimal overhead**: Simple regex patterns with O(n) complexity
- **Client-side only**: No server calls required
- **Small memory footprint**: Word lists are small and cached

## Customization

### Adding New Words
To add more bad words, edit the arrays in `badWordFilter.js`:

```javascript
const englishBadWords = [
  // existing words...
  'new_bad_word',
  'another_bad_word'
];

const arabicBadWords = [
  // existing words...
  'كلمة سيئة جديدة'
];
```

### Adjusting Filtering Behavior
- **More aggressive**: Add variations and slang terms
- **Less aggressive**: Remove milder words from lists
- **Different languages**: Add new language arrays and patterns

## Testing

Run the test suite to verify functionality:

```javascript
// In browser console or Node.js
import './badWordFilter.test.js';
```

The test suite includes:
- Clean text validation
- English profanity detection
- Arabic profanity detection
- Mixed language handling
- Edge case testing

## Limitations

- **Word boundaries**: May not catch profanity without spaces or with special characters
- **Evolving language**: Static word lists may not include new slang
- **Context unaware**: Cannot distinguish between profanity and legitimate usage
- **Language specific**: Only supports English and Arabic

## Future Enhancements

- Dynamic word list updates
- Machine learning-based detection
- More sophisticated pattern matching
- Additional language support
- User-configurable filter sensitivity

## Security Considerations

- **Client-side only**: Users can bypass the filter, so server-side validation is recommended for production
- **Word list exposure**: Bad word lists are visible in source code
- **Performance**: Large messages may need optimization

## Implementation Notes

This implementation prioritizes:
1. **Simplicity**: Easy to understand and maintain
2. **Performance**: Minimal impact on chat functionality
3. **User experience**: Non-blocking approach with feedback
4. **Cost**: Completely free with no external dependencies
