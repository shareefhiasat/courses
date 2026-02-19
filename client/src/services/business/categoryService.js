import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from '../other/config';
import { withPerformanceMonitoring, memoize } from '@utils/performance';

/**
 * Get all categories - with performance monitoring and memoization
 */
export const getCategories = withPerformanceMonitoring(
  memoize(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categories"));
      const categories = [];
      querySnapshot.forEach((d) => {
        const categoryData = { docId: d.id, ...d.data() };
        if (categoryData.createdAt?.toDate) {
          categoryData.createdAt = categoryData.createdAt.toDate();
        }
        categories.push(categoryData);
      });
      return { success: true, data: categories };
    } catch (error) {
      console.error("Error getting categories:", error);
      return { success: false, error: error.message };
    }
  }),
  'getCategories'
);

/**
 * Seed default categories
 */
export const seedDefaultCategories = async () => {
  try {
    const defaultCategories = [
      {
        docId: 'programming',
        name_en: 'Programming',
        name_ar: 'البرمجة',
        icon: 'code',
        description_en: 'Programming activities and resources',
        description_ar: 'الأنشطة والموارد البرمجية',
        color: '#3b82f6',
        order: 1
      },
      {
        docId: 'computing',
        name_en: 'Computing',
        name_ar: 'الحوسبة',
        icon: 'monitor',
        description_en: 'Computing fundamentals and concepts',
        description_ar: 'أساسيات ومفاهيم الحوسبة',
        color: '#0ea5e9',
        order: 2
      },
      {
        docId: 'algorithm',
        name_en: 'Algorithm',
        name_ar: 'الخوارزميات',
        icon: 'brain',
        description_en: 'Algorithm design and analysis',
        description_ar: 'تصميم وتحليل الخوارزميات',
        color: '#8b5cf6',
        order: 3
      },
      {
        docId: 'general',
        name_en: 'General',
        name_ar: 'عام',
        icon: 'folder',
        description_en: 'General activities and resources',
        description_ar: 'الأنشطة والموارد العامة',
        color: '#6b7280',
        order: 4
      }
    ];

    const results = [];
    for (const category of defaultCategories) {
      try {
        // Use setDoc with specific document ID instead of addDoc
        const categoryData = {
          name_en: category.name_en,
          name_ar: category.name_ar,
          icon: category.icon,
          description_en: category.description_en,
          description_ar: category.description_ar,
          color: category.color,
          order: category.order,
          updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, "categories", category.docId), categoryData);
        results.push({ action: 'created', category: category.docId, success: true });
      } catch (error) {
        console.error(`Error creating category ${category.docId}:`, error);
        results.push({ action: 'error', category: category.docId, success: false, error: error.message });
      }
    }

    return { success: true, data: results };
  } catch (error) {
    console.error("Error seeding categories:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Add a new category
 */
export const addCategory = async (categoryData) => {
  try {
    const convertedData = {
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, "categories"), convertedData);
    return { success: true, data: { docId: docRef.id, ...convertedData } };
  } catch (error) {
    console.error("Error adding category:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing category
 */
export const updateCategory = async (docId, categoryData) => {
  try {
    const convertedData = {
      ...categoryData,
      updatedAt: serverTimestamp()
    };
    await updateDoc(doc(db, "categories", docId), convertedData);
    return { success: true, data: { docId, ...convertedData } };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (docId) => {
  try {
    await deleteDoc(doc(db, "categories", docId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (docId) => {
  try {
    const docSnapshot = await getDoc(doc(db, "categories", docId));
    if (docSnapshot.exists()) {
      const categoryData = { docId: docSnapshot.id, ...docSnapshot.data() };
      if (categoryData.createdAt?.toDate) {
        categoryData.createdAt = categoryData.createdAt.toDate();
      }
      return { success: true, data: categoryData };
    } else {
      return { success: false, error: "Category not found" };
    }
  } catch (error) {
    console.error("Error getting category:", error);
    return { success: false, error: error.message };
  }
};
