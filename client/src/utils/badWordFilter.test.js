// Test file for bad word filter
// Run this in browser console or Node.js to test

import { filterBadWords, containsBadWords, getDetectedBadWords } from './badWordFilter.js';

// Test cases
const testCases = [
  // English tests
  { input: "Hello world", expected: "Hello world", description: "Clean English text" },
  { input: "What the fuck is this", expected: "What the **** is this", description: "English profanity" },
  { input: "You are stupid and idiot", expected: "You are ****** and *****", description: "Multiple English bad words" },
  { input: "Don't be an asshole", expected: "Don't be an *******", description: "English insult" },
  
  // Arabic tests
  { input: "مرحبا بالعالم", expected: "مرحبا بالعالم", description: "Clean Arabic text" },
  { input: "انت غبي وحمار", expected: "انت *** و*****", description: "Arabic insults" },
  { input: "لا تكن كلبا", expected: "لا تكن ****", description: "Arabic animal insult" },
  { input: "ابن الحرام", expected: "*** ********", description: "Arabic family insult" },
  { input: "طيز وكس", expected: "**** ***", description: "Qatari profanity" },
  { input: "ابن الكلب وابن القحبة", expected: "*** ***** *** *** *****", description: "Gulf dialect insults" },
  { input: "يلعن أمك ويلعن أبوك", expected: "***** **** ***** ****", description: "Arabic curses" },
  { input: "شرموطه وقحابه", expected: "******** *****", description: "Arabic variations" },
  
  // Mixed tests
  { input: "Hello stupid انت غبي", expected: "Hello ****** انت ***", description: "Mixed English and Arabic" },
  { input: "FUCK you غبي", expected: "**** you ***", description: "Mixed case profanity" },
  
  // Edge cases
  { input: "stupidly", expected: "stupidly", description: "Word containing bad word but not exact match" },
  { input: "assassin", expected: "assassin", description: "Word containing bad word but not exact match" },
  { input: "", expected: "", description: "Empty string" },
  { input: null, expected: null, description: "Null input" },
  { input: undefined, expected: undefined, description: "Undefined input" }
];

// Run tests
console.log('=== Bad Word Filter Tests ===\n');

testCases.forEach((test, index) => {
  const result = filterBadWords(test.input);
  const passed = result === test.expected;
  
  console.log(`Test ${index + 1}: ${test.description}`);
  console.log(`Input: "${test.input}"`);
  console.log(`Expected: "${test.expected}"`);
  console.log(`Got: "${result}"`);
  console.log(`Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!passed) {
    console.log('❌ Test failed!');
  }
  
  console.log('---');
});

// Test containsBadWords function
console.log('\n=== containsBadWords Tests ===\n');
const containsTests = [
  { input: "Hello world", expected: false },
  { input: "What the fuck", expected: true },
  { input: "انت غبي", expected: true },
  { input: "Clean text", expected: false }
];

containsTests.forEach((test, index) => {
  const result = containsBadWords(test.input);
  const passed = result === test.expected;
  
  console.log(`Contains Test ${index + 1}: "${test.input}"`);
  console.log(`Expected: ${test.expected}, Got: ${result}`);
  console.log(`Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('---');
});

// Test getDetectedBadWords function
console.log('\n=== getDetectedBadWords Tests ===\n');
const detectedTests = [
  { input: "Hello world", expected: [] },
  { input: "What the fuck you stupid", expected: ["fuck", "stupid"] },
  { input: "انت غبي وكلب", expected: ["غبي", "كلب"] },
  { input: "FUCK stupid غبي كلب", expected: ["fuck", "stupid", "غبي", "كلب"] }
];

detectedTests.forEach((test, index) => {
  const result = getDetectedBadWords(test.input);
  const passed = JSON.stringify(result.sort()) === JSON.stringify(test.expected.sort());
  
  console.log(`Detected Test ${index + 1}: "${test.input}"`);
  console.log(`Expected: [${test.expected.join(', ')}]`);
  console.log(`Got: [${result.join(', ')}]`);
  console.log(`Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('---');
});

// Additional Qatari dialect tests
console.log('\n=== Qatari Dialect Specific Tests ===\n');
const qatariTests = [
  { input: "طيز وكس وخول", expected: "**** *** ****" },
  { input: "ابن القحبة والشرموط", expected: "*** ***** *********" },
  { input: "يلعن دينك ويلعن ربك", expected: "***** ***** ***** ****" },
  { input: "حقير ووسخ وقذر", expected: "***** **** *****" },
  { input: "منيوكة وشرموطه", expected: "******* *********" }
];

qatariTests.forEach((test, index) => {
  const result = filterBadWords(test.input);
  const passed = result === test.expected;
  
  console.log(`Qatari Test ${index + 1}: "${test.input}"`);
  console.log(`Expected: "${test.expected}"`);
  console.log(`Got: "${result}"`);
  console.log(`Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('---');
});

console.log('\n=== Test Complete ===');
