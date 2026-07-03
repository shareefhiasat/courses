/**
 * CategoryTypes serve two distinct purposes in the LMS:
 * - ACCESS_SCOPE — academic boundaries (UCA, programs, user access studio)
 * - CONTENT — home page activity/resource browsing tabs
 *
 * DB field `categoryType` stores the purpose. Legacy values are mapped below.
 */

export const CATEGORY_PURPOSE = {
  ACCESS_SCOPE: 'ACCESS_SCOPE',
  CONTENT: 'CONTENT',
};

/** Stored in CategoryTypes.categoryType for access / UCA rows */
export const ACCESS_SCOPE_CATEGORY_TYPES = new Set([
  'ACCESS_SCOPE',
  'ACADEMIC',
  'TRAINING',
  'HR_GROUP',
]);

/** Stored in CategoryTypes.categoryType for home activity/resource tabs */
export const CONTENT_CATEGORY_TYPES = new Set([
  'CONTENT',
  'TARGET_AUDIENCE',
]);

export const CATEGORY_PURPOSE_OPTIONS = [
  { value: CATEGORY_PURPOSE.ACCESS_SCOPE, labelKey: 'category_purpose_access_scope' },
  { value: CATEGORY_PURPOSE.CONTENT, labelKey: 'category_purpose_content' },
];

export function normalizeCategoryPurpose(categoryType) {
  const t = (categoryType || 'ACADEMIC').toUpperCase();
  if (CONTENT_CATEGORY_TYPES.has(t)) return CATEGORY_PURPOSE.CONTENT;
  if (ACCESS_SCOPE_CATEGORY_TYPES.has(t)) return CATEGORY_PURPOSE.ACCESS_SCOPE;
  return CATEGORY_PURPOSE.ACCESS_SCOPE;
}

export function isAccessScopeCategory(category) {
  if (!category) return false;
  return ACCESS_SCOPE_CATEGORY_TYPES.has((category.categoryType || 'ACADEMIC').toUpperCase());
}

export function isContentCategory(category) {
  if (!category) return false;
  return CONTENT_CATEGORY_TYPES.has((category.categoryType || '').toUpperCase());
}

/**
 * Filter categories by purpose. Optional programCategoryIds helps legacy rows
 * where categoryType was never set (defaults to ACADEMIC).
 */
export function filterCategoriesByPurpose(categories = [], purpose, { programCategoryIds = [] } = {}) {
  const programIds = new Set((programCategoryIds || []).map((id) => Number(id)));

  if (purpose === CATEGORY_PURPOSE.ACCESS_SCOPE) {
    return categories.filter((c) => {
      const type = (c.categoryType || '').toUpperCase();
      if (ACCESS_SCOPE_CATEGORY_TYPES.has(type)) {
        // Explicit content categories never appear in access pickers
        if (CONTENT_CATEGORY_TYPES.has(type)) return false;
        return true;
      }
      if (programIds.has(Number(c.id))) return true;
      return false;
    });
  }

  if (purpose === CATEGORY_PURPOSE.CONTENT) {
    return categories.filter((c) => {
      const type = (c.categoryType || 'ACADEMIC').toUpperCase();
      if (CONTENT_CATEGORY_TYPES.has(type)) return true;
      if (type === 'ACCESS_SCOPE') return false;
      // Program-linked categories belong to access scope, not activity tabs
      if (programIds.has(Number(c.id))) return false;
      // Legacy rows (ACADEMIC default, no program) → activity content tabs
      return true;
    });
  }

  return categories;
}

export function getCategoryPurposeLabelKey(category) {
  return normalizeCategoryPurpose(category?.categoryType) === CATEGORY_PURPOSE.CONTENT
    ? 'category_purpose_content'
    : 'category_purpose_access_scope';
}
