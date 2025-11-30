/**
 * Question Bank Management (Phase 3.2)
 * Shared pool of reusable questions with tags and metadata
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'questionBank';

/**
 * Create a new question in the bank
 */
export async function createQuestion(questionData) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...questionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 1,
      usageCount: 0
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating question:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all questions from the bank
 */
export async function getAllQuestions(filters = {}) {
  try {
    let q = collection(db, COLLECTION);
    
    // Apply filters
    if (filters.topic) {
      q = query(q, where('tags', 'array-contains', filters.topic));
    }
    if (filters.difficulty) {
      q = query(q, where('difficulty', '==', filters.difficulty));
    }
    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters.createdBy) {
      q = query(q, where('createdBy', '==', filters.createdBy));
    }
    
    // Order by usage or creation date
    q = query(q, orderBy(filters.sortBy || 'createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    const questions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, data: questions };
  } catch (error) {
    console.error('Error fetching questions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a single question by ID
 */
export async function getQuestion(questionId) {
  try {
    const docRef = doc(db, COLLECTION, questionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Question not found' };
    }
    
    return { 
      success: true, 
      data: { id: docSnap.id, ...docSnap.data() } 
    };
  } catch (error) {
    console.error('Error fetching question:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing question
 */
export async function updateQuestion(questionId, updates) {
  try {
    const docRef = doc(db, COLLECTION, questionId);
    const current = await getDoc(docRef);
    
    if (!current.exists()) {
      return { success: false, error: 'Question not found' };
    }
    
    const currentVersion = current.data().version || 1;
    
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      version: currentVersion + 1,
      previousVersions: [
        ...(current.data().previousVersions || []),
        {
          version: currentVersion,
          data: current.data(),
          updatedAt: new Date()
        }
      ]
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating question:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId) {
  try {
    await deleteDoc(doc(db, COLLECTION, questionId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting question:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Duplicate a question
 */
export async function duplicateQuestion(questionId, newTitle) {
  try {
    const result = await getQuestion(questionId);
    if (!result.success) return result;
    
    const original = result.data;
    const duplicate = {
      ...original,
      question: newTitle || `${original.question} (Copy)`,
      duplicatedFrom: questionId,
      usageCount: 0
    };
    
    delete duplicate.id;
    delete duplicate.createdAt;
    delete duplicate.updatedAt;
    delete duplicate.version;
    delete duplicate.previousVersions;
    
    return await createQuestion(duplicate);
  } catch (error) {
    console.error('Error duplicating question:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Import questions from question bank into a quiz
 */
export async function importQuestionsToQuiz(questionIds, quizId) {
  try {
    const questions = [];
    
    for (const qId of questionIds) {
      const result = await getQuestion(qId);
      if (result.success) {
        questions.push(result.data);
        
        // Increment usage count
        const docRef = doc(db, COLLECTION, qId);
        const current = await getDoc(docRef);
        if (current.exists()) {
          await updateDoc(docRef, {
            usageCount: (current.data().usageCount || 0) + 1,
            lastUsedIn: quizId,
            lastUsedAt: serverTimestamp()
          });
        }
      }
    }
    
    return { success: true, data: questions };
  } catch (error) {
    console.error('Error importing questions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Search questions by text
 */
export async function searchQuestions(searchTerm) {
  try {
    const allQuestions = await getAllQuestions();
    if (!allQuestions.success) return allQuestions;
    
    const term = searchTerm.toLowerCase();
    const filtered = allQuestions.data.filter(q => 
      q.question?.toLowerCase().includes(term) ||
      q.tags?.some(tag => tag.toLowerCase().includes(term)) ||
      q.topic?.toLowerCase().includes(term)
    );
    
    return { success: true, data: filtered };
  } catch (error) {
    console.error('Error searching questions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all unique tags
 */
export async function getAllTags() {
  try {
    const result = await getAllQuestions();
    if (!result.success) return result;
    
    const tagsSet = new Set();
    result.data.forEach(q => {
      q.tags?.forEach(tag => tagsSet.add(tag));
    });
    
    return { 
      success: true, 
      data: Array.from(tagsSet).sort() 
    };
  } catch (error) {
    console.error('Error fetching tags:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk import questions from CSV/JSON
 */
export async function bulkImportQuestions(questions, createdBy) {
  try {
    const results = [];
    
    for (const q of questions) {
      const result = await createQuestion({
        ...q,
        createdBy,
        importedAt: serverTimestamp()
      });
      results.push(result);
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return { 
      success: true, 
      data: { 
        total: questions.length, 
        successful, 
        failed,
        results 
      } 
    };
  } catch (error) {
    console.error('Error bulk importing questions:', error);
    return { success: false, error: error.message };
  }
}
