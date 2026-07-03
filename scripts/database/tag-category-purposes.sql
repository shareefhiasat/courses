-- Tag CategoryTypes by purpose: CONTENT (activity/resource tabs) vs ACCESS_SCOPE (UCA/programs)
BEGIN;

UPDATE category_types
SET "categoryType" = 'CONTENT', "updatedAt" = NOW()
WHERE code IN (
  'LECTURE_NOTES', 'ASSIGNMENT', 'READING', 'REFERENCE', 'TUTORIAL',
  'EXAM_PREP', 'SUPPLEMENTARY', 'gggg', 'ZZZZ', 'ASDF'
);

UPDATE category_types
SET "categoryType" = 'ACCESS_SCOPE', "updatedAt" = NOW()
WHERE code IN ('ACADEMIC', 'ADMINISTRATIVE', 'TECHNICAL', 'GENERAL');

UPDATE category_types ct
SET "categoryType" = 'ACCESS_SCOPE', "updatedAt" = NOW()
WHERE ct.id IN (
  SELECT DISTINCT "categoryId" FROM programs WHERE "categoryId" IS NOT NULL
);

-- Re-point UCA rows that used a content category to ACADEMIC access scope
UPDATE user_category_access
SET "categoryId" = (SELECT id FROM category_types WHERE code = 'ACADEMIC' LIMIT 1),
    "updatedAt" = NOW()
WHERE "categoryId" IN (
  SELECT id FROM category_types WHERE "categoryType" = 'CONTENT'
);

COMMIT;

SELECT id, code, "nameEn", "categoryType",
  (SELECT COUNT(*) FROM programs p WHERE p."categoryId" = ct.id) AS program_count,
  (SELECT COUNT(*) FROM user_category_access u WHERE u."categoryId" = ct.id) AS uca_count
FROM category_types ct
ORDER BY id;
