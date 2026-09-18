/**
 * Entity-Aware RAG for the AI Assistant.
 *
 * Loads real-world entities from the database (students, programs, subjects,
 * classes, academic terms, lookup types) and converts them into natural-language
 * fact documents. These are embedded and stored in Qdrant so the LLM can resolve
 * names, codes, and relationships mentioned in natural-language questions.
 *
 * If Qdrant is unavailable, entity RAG is skipped; it does not keep an in-memory
 * cache of the full entity set because that could become very large.
 */

import { getEmbeddings } from './rag.js';
import { upsertVectors, searchVectors, clearVectors, QDRANT_ENTITY_COLLECTION } from './vectorStore.js';

let prisma = null;
async function getPrisma() {
  if (!prisma) {
    const mod = await import('../db/prismaClient.js');
    prisma = mod.prisma;
  }
  return prisma;
}

const ENTITY_BATCH_SIZE = parseInt(process.env.ENTITY_BATCH_SIZE || '32', 10);
const EMBED_TIMEOUT_MS = parseInt(process.env.ENTITY_EMBED_TIMEOUT_MS || '120000', 10);
const MAX_ENTITIES_PER_TYPE = parseInt(process.env.MAX_ENTITIES_PER_TYPE || '5000', 10);

let isEntityBuilding = false;

function nameValue({ firstName, lastName, firstNameAr, lastNameAr, displayName, displayNameAr, nameEn, nameAr, code }) {
  const enName = firstName || displayName || nameEn || '';
  const arName = firstNameAr || displayNameAr || nameAr || '';
  return {
    en: `${enName} ${lastName || ''}`.trim() || code,
    ar: `${arName} ${''}`.trim() || code,
    code,
  };
}

function joinNames(nameObj, includeCode = true) {
  const parts = [];
  if (nameObj.en) parts.push(nameObj.en);
  if (nameObj.ar && nameObj.ar !== nameObj.en) parts.push(`Arabic: ${nameObj.ar}`);
  if (includeCode && nameObj.code) parts.push(`(code: ${nameObj.code})`);
  return parts.join(' ');
}

function descriptionText(entity) {
  const en = entity.descriptionEn || entity.description || '';
  const ar = entity.descriptionAr || '';
  const parts = [];
  if (en) parts.push(`Description: ${en}.`);
  if (ar) parts.push(`Arabic description: ${ar}.`);
  return parts.join(' ');
}

/**
 * Build a single natural-language document for a user/student.
 */
export function buildUserDocument(user, roles = []) {
  const name = nameValue(user);
  const roleText = roles.length ? `Roles: ${roles.map((r) => r.code || r.nameEn).join(', ')}.` : '';
  const rankText = user.rankEn ? `Rank: ${user.rankEn}${user.rankAr ? ` / ${user.rankAr}` : ''}.` : '';
  const studentText = user.studentNumber ? `Student number: ${user.studentNumber}.` : '';
  const emailText = user.email ? `Email: ${user.email}.` : '';
  const activeText = user.isActive === false ? 'Status: inactive.' : 'Status: active.';

  return {
    id: `user_${user.id}`,
    text: `User ${joinNames(name)}. ${studentText} ${emailText} ${rankText} ${roleText} ${activeText}`.trim().replace(/\s+/g, ' '),
    topic: 'entity',
    entity: name.en || name.code || `User ${user.id}`,
    entityType: 'User',
    entityId: user.id,
  };
}

/**
 * Build documents for a generic named entity (Program, Subject, Class, etc.).
 */
export function buildNamedEntityDocument(entity, type) {
  const name = nameValue(entity);
  const descText = descriptionText(entity);
  return {
    id: `${type.toLowerCase()}_${entity.id}`,
    text: `${type} ${joinNames(name)}. ${descText}`.trim().replace(/\s+/g, ' '),
    topic: 'entity',
    entity: name.en || name.code || `${type} ${entity.id}`,
    entityType: type,
    entityId: entity.id,
  };
}

/**
 * Build documents for lookup types (attendance status, penalty types, etc.).
 */
export function buildTypeDocument(entity, type) {
  const name = nameValue(entity);
  const descText = entity.description ? `Meaning: ${entity.description}.` : '';
  return {
    id: `type_${type.toLowerCase()}_${entity.id}`,
    text: `${type} ${joinNames(name)}. ${descText}`.trim().replace(/\s+/g, ' '),
    topic: 'entity',
    entity: name.en || name.code || `${type} ${entity.id}`,
    entityType: type,
    entityId: entity.id,
  };
}

/**
 * Load entities from the database and build natural-language documents.
 * Returns an object grouped by entity type.
 */
export async function buildEntityDocuments() {
  const db = await getPrisma();
  const docs = [];

  // Users (students, instructors, staff) - active only
  const users = await db.user.findMany({
    where: { isActive: true },
    take: MAX_ENTITIES_PER_TYPE,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      firstNameAr: true,
      lastNameAr: true,
      displayName: true,
      displayNameAr: true,
      studentNumber: true,
      rankEn: true,
      rankAr: true,
      isActive: true,
    },
  });

  // Fetch all role assignments in one query and build a map
  const roleAssignments = await db.userRoleAssignment.findMany({
    include: { role: { select: { code: true, nameEn: true } } },
  });
  const userRoles = new Map();
  for (const ra of roleAssignments) {
    if (!userRoles.has(ra.userId)) userRoles.set(ra.userId, []);
    userRoles.get(ra.userId).push(ra.role);
  }

  for (const user of users) {
    docs.push(buildUserDocument(user, userRoles.get(user.id) || []));
  }

  // Programs
  const programs = await db.program.findMany({
    take: MAX_ENTITIES_PER_TYPE,
    select: { id: true, code: true, nameEn: true, nameAr: true, descriptionEn: true, descriptionAr: true },
  });
  for (const program of programs) {
    docs.push(buildNamedEntityDocument(program, 'Program'));
  }

  // Subjects
  const subjects = await db.subject.findMany({
    take: MAX_ENTITIES_PER_TYPE,
    select: { id: true, code: true, nameEn: true, nameAr: true, descriptionEn: true, descriptionAr: true },
  });
  for (const subject of subjects) {
    docs.push(buildNamedEntityDocument(subject, 'Subject'));
  }

  // Classes
  const classes = await db.class.findMany({
    take: MAX_ENTITIES_PER_TYPE,
    select: { id: true, code: true, nameEn: true, nameAr: true, descriptionEn: true, descriptionAr: true },
  });
  for (const cls of classes) {
    docs.push(buildNamedEntityDocument(cls, 'Class'));
  }

  // Academic terms
  const academicTerms = await db.academicTerms.findMany({
    take: MAX_ENTITIES_PER_TYPE,
    select: { id: true, code: true, nameEn: true, nameAr: true },
  });
  for (const term of academicTerms) {
    docs.push(buildNamedEntityDocument(term, 'AcademicTerm'));
  }

  // Important lookup types
  const attendanceStatuses = await db.attendanceStatusTypes.findMany({
    take: MAX_ENTITIES_PER_TYPE,
    select: { id: true, code: true, nameEn: true, nameAr: true, description: true },
  });
  for (const s of attendanceStatuses) {
    docs.push(buildTypeDocument(s, 'AttendanceStatus'));
  }

  const penaltyTypes = await db.penaltyTypes.findMany({
    take: MAX_ENTITIES_PER_TYPE,
    select: { id: true, code: true, nameEn: true, nameAr: true, description: true },
  });
  for (const p of penaltyTypes) {
    docs.push(buildTypeDocument(p, 'PenaltyType'));
  }

  const behaviorTypes = await db.behaviorTypes.findMany({
    take: MAX_ENTITIES_PER_TYPE,
    select: { id: true, code: true, nameEn: true, nameAr: true, description: true },
  });
  for (const b of behaviorTypes) {
    docs.push(buildTypeDocument(b, 'BehaviorType'));
  }

  const enrollmentStatuses = await db.enrollmentStatusTypes.findMany({
    take: MAX_ENTITIES_PER_TYPE,
    select: { id: true, code: true, nameEn: true, nameAr: true, description: true },
  });
  for (const e of enrollmentStatuses) {
    docs.push(buildTypeDocument(e, 'EnrollmentStatus'));
  }

  return docs;
}

/**
 * Embed and upsert all entity documents into Qdrant.
 */
export async function buildEntityEmbeddings() {
  if (isEntityBuilding) return [];
  isEntityBuilding = true;

  const docs = await buildEntityDocuments();
  const ENTITY_BATCH_SIZE = 8;
  const EMBED_TIMEOUT_MS = 300000;
  const results = [];
  const qdrantPoints = [];
  const start = Date.now();

  try {
    for (let i = 0; i < docs.length; i += ENTITY_BATCH_SIZE) {
      const batch = docs.slice(i, i + ENTITY_BATCH_SIZE);
      const texts = batch.map((d) => d.text);
      const embeddings = await getEmbeddings(texts, EMBED_TIMEOUT_MS);
      if (!embeddings) continue;

      for (let j = 0; j < batch.length; j++) {
        const doc = batch[j];
        const embedding = embeddings[j];
        if (!embedding || !Array.isArray(embedding)) continue;
        const enriched = { ...doc, embedding };
        qdrantPoints.push(enriched);
        results.push(enriched);
      }

      if (Date.now() - start > 1800000) {
        console.warn('[Entity RAG] Embedding build exceeded 30m, using partial results');
        break;
      }
    }

    if (qdrantPoints.length > 0) {
      await clearVectors(QDRANT_ENTITY_COLLECTION);
      await upsertVectors(qdrantPoints, QDRANT_ENTITY_COLLECTION);
    }
  } catch (err) {
    console.warn('[Entity RAG] Embedding build failed:', err.message);
  } finally {
    isEntityBuilding = false;
  }

  console.log('[Entity RAG] Cached', results.length, 'of', docs.length, 'entity documents in Qdrant');
  return results;
}

/**
 * Start warming entity embeddings in the background.
 */
export function warmupEntityRag() {
  if (!isEntityBuilding) {
    buildEntityEmbeddings().catch((err) =>
      console.warn('[Entity RAG] Background warmup failed:', err.message)
    );
  }
}

/**
 * Find the top-k most relevant entities for a user question.
 */
export async function findRelevantEntities(question = '', k = 8) {
  if (!question) return [];
  const results = await searchVectors(question, k, QDRANT_ENTITY_COLLECTION).catch(() => null);
  return results || [];
}

/**
 * Format entity context for the LLM prompt.
 */
export function formatEntitiesForPrompt(results = [], userLang = 'ar') {
  if (results.length === 0) return '';

  const header = userLang === 'ar'
    ? '## كيانات واقعية في النظام قد تكون متعلقة بالسؤال'
    : '## Real-world entities in the system that may be relevant to the question';

  const lines = results.map((d) => `- ${d.text}`);
  return [header, ...lines].join('\n');
}
