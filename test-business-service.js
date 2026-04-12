import { createParticipation } from './client/src/services/business/participationService.js';

// Test the business service conversion
const testData = {
  userId: "6",
  classId: "58", 
  subjectId: "43",
  programId: "21",
  type: "EXCELLENT",
  descriptionEn: "Test participation from service",
  descriptionAr: "اختبار المشاركة من الخدمة",
  comment: "Test comment from service",
  isActive: true
};

console.log('Testing business service with data:', testData);

createParticipation(testData).then(result => {
  console.log('Business service result:', result);
}).catch(error => {
  console.error('Business service error:', error);
});
