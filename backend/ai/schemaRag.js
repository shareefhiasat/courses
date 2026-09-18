/**
 * Schema-Aware RAG for the AI Assistant.
 *
 * Reads the Prisma schema file, parses models/fields/enums/relations, and
 * turns them into natural-language documents. Each document is embedded via
 * Ollama. At query time we retrieve the most relevant schema chunks and inject
 * them into the LLM system prompt so the model can "learn" the database on
 * the fly and answer free-form natural-language questions.
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { getEmbeddings } from './rag.js';
import { upsertVectors, searchVectors, clearVectors, getAllPoints } from './vectorStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMA_PATH = resolve(__dirname, '../../client/prisma/schema.prisma');

let schemaEmbeddingsCache = null;
let schemaEmbeddingsComplete = false;
let isSchemaBuilding = false;

/**
 * Parse the Prisma schema file into:
 * - enums: { name, values[] }
 * - models: { name, dbName?, fields[], relations[] }
 */
export async function parsePrismaSchema(path = SCHEMA_PATH) {
  const text = await readFile(path, 'utf-8');

  const enums = [];
  const enumRegex = /enum\s+(\w+)\s*\{([^}]*)\}/g;
  let m;
  while ((m = enumRegex.exec(text)) !== null) {
    const name = m[1];
    const values = m[2]
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('//'))
      .map((l) => l.replace(/\s+/g, ' ').split(' ')[0]);
    enums.push({ name, values });
  }

  const models = [];
  const modelRegex = /model\s+(\w+)\s*\{([^}]*)\}/g;
  while ((m = modelRegex.exec(text)) !== null) {
    const name = m[1];
    const body = m[2];
    const lines = body
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('//'));

    const dbNameMatch = lines.find((l) => l.startsWith('@@map('));
    const dbName = dbNameMatch ? dbNameMatch.match(/@@map\("([^"]+)"\)/)?.[1] : null;

    const fields = [];
    const relations = [];

    for (const line of lines) {
      // Skip model-level attributes
      if (line.startsWith('@@')) continue;

      // Relation field:  user       User?   @relation(fields: [userId], references: [id])
      const relationMatch = line.match(/^(\w+)\s+([A-Za-z][\w?]+)\s+(@relation\([^)]*\))?/);
      if (relationMatch && relationMatch[3]) {
        const [, fieldName, targetModel, relationAttr] = relationMatch;
        const fieldsMatch = relationAttr.match(/fields:\s*\[([^\]]+)\]/);
        const refsMatch = relationAttr.match(/references:\s*\[([^\]]+)\]/);
        relations.push({
          field: fieldName,
          target: targetModel.replace('?', ''),
          sourceFields: fieldsMatch ? fieldsMatch[1].split(',').map((s) => s.trim()) : [],
          targetFields: refsMatch ? refsMatch[1].split(',').map((s) => s.trim()) : [],
        });
        continue;
      }

      // Regular field:  id    Int    @id @default(autoincrement())
      const fieldMatch = line.match(/^(\w+)\s+([A-Za-z][\w?\[\]]*)\s*(.*)$/);
      if (fieldMatch) {
        const [, fieldName, type, attributes] = fieldMatch;
        const isOptional = type.endsWith('?');
        const isList = type.endsWith('[]');
        const baseType = type.replace(/[?\[\]]/g, '');
        const isId = attributes.includes('@id');
        const isUnique = attributes.includes('@unique');
        const defaultMatch = attributes.match(/@default\(([^)]+)\)/);
        const mapMatch = attributes.match(/@map\("([^"]+)"\)/);

        fields.push({
          name: fieldName,
          type: baseType,
          isOptional,
          isList,
          isId,
          isUnique,
          defaultValue: defaultMatch ? defaultMatch[1] : null,
          dbName: mapMatch ? mapMatch[1] : null,
          attributes,
        });
      }
    }

    models.push({ name, dbName, fields, relations });
  }

  return { models, enums };
}

function normalizeName(name) {
  return name.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * Convert a parsed model into one or more natural-language documents.
 */
export function buildModelDocuments(model) {
  const docs = [];
  const displayName = normalizeName(model.name);

  // 1. Model overview
  const fieldSummary = model.fields
    .map((f) => `${f.name} (${f.type}${f.isList ? '[]' : ''}${f.isOptional ? ', optional' : ''})`)
    .join(', ');

  docs.push({
    text: `Table ${model.name}${model.dbName ? ` (database name: ${model.dbName})` : ''} represents ${displayName}. It has columns: ${fieldSummary}.`,
    topic: 'table',
    entity: model.name,
  });

  // 2. Per-field details (only meaningful ones)
  for (const f of model.fields) {
    if (f.name === 'createdBy' || f.name === 'updatedBy' || f.name === 'createdAt' || f.name === 'updatedAt') continue;
    if (f.name.toLowerCase().includes('id') && !f.isId) continue; // skip FK columns, handled by relations

    let desc = `Column ${f.name} on table ${model.name} stores ${f.type} data.`;
    if (f.isId) desc += ' It is the primary key.';
    if (f.isUnique) desc += ' It has a unique constraint.';
    if (f.defaultValue) desc += ` Default value: ${f.defaultValue}.`;

    docs.push({
      text: desc,
      topic: 'column',
      entity: `${model.name}.${f.name}`,
    });
  }

  // 3. Relations
  for (const r of model.relations) {
    const source = r.sourceFields.join(', ');
    const target = r.targetFields.join(', ');
    docs.push({
      text: `Table ${model.name} links to ${r.target} through relation ${r.field}. The foreign key columns are ${source} referencing ${r.target}.${target}.`,
      topic: 'relation',
      entity: `${model.name}.${r.field}`,
    });
  }

  return docs;
}

/**
 * Convert enums to documents.
 */
export function buildEnumDocuments(enumDef) {
  return [{
    text: `Enum ${enumDef.name} has values: ${enumDef.values.join(', ')}.`,
    topic: 'enum',
    entity: enumDef.name,
  }];
}

/**
 * Build the full schema document set from the Prisma schema.
 */
export async function buildSchemaDocuments() {
  const { models, enums } = await parsePrismaSchema();
  const docs = [];
  for (const model of models) {
    docs.push(...buildModelDocuments(model));
  }
  for (const enumDef of enums) {
    docs.push(...buildEnumDocuments(enumDef));
  }
  return docs;
}

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return -1;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return -1;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Pre-compute and cache embeddings for schema documents.
 * Also upserts them into Qdrant for persistent/reactive vector search.
 */
export async function buildSchemaEmbeddings() {
  if (schemaEmbeddingsComplete) return schemaEmbeddingsCache;
  if (isSchemaBuilding) return schemaEmbeddingsCache || [];
  isSchemaBuilding = true;

  const docs = await buildSchemaDocuments();
  const BATCH_SIZE = 16;
  const EMBED_TIMEOUT_MS = 300000;
  const start = Date.now();

  // Resume from existing Qdrant points to avoid re-embedding.
  const existingPoints = await getAllPoints().catch(() => []);
  const existingTexts = new Set(existingPoints.map((p) => p.text));
  const results = [...existingPoints];
  const qdrantPoints = [];
  const docsToEmbed = docs.filter((d) => !existingTexts.has(d.text));
  const isResuming = existingPoints.length > 0;

  try {
    for (let i = 0; i < docsToEmbed.length; i += BATCH_SIZE) {
      const batch = docsToEmbed.slice(i, i + BATCH_SIZE);
      const texts = batch.map((d) => d.text);
      const embeddings = await getEmbeddings(texts, EMBED_TIMEOUT_MS);
      if (!embeddings) continue;

      for (let j = 0; j < batch.length; j++) {
        const doc = batch[j];
        const embedding = embeddings[j];
        if (!embedding || !Array.isArray(embedding)) continue;
        const enriched = { ...doc, embedding };
        qdrantPoints.push({
          id: `${doc.topic}_${doc.entity || j}`,
          embedding,
          text: doc.text,
          topic: doc.topic,
          entity: doc.entity || `${doc.topic}_${j}`,
        });
        results.push(enriched);
      }

      // Upsert each batch so partial progress is preserved.
      if (qdrantPoints.length > 0) {
        await upsertVectors(qdrantPoints);
        qdrantPoints.length = 0;
      }

      if (Date.now() - start > 1800000) {
        console.warn('[Schema RAG] Embedding build exceeded 30m, using partial results');
        break;
      }
    }

    schemaEmbeddingsComplete = results.length >= docs.length;
  } catch (err) {
    console.warn('[Schema RAG] Embedding build failed:', err.message);
  } finally {
    isSchemaBuilding = false;
  }

  schemaEmbeddingsCache = results;
  console.log('[Schema RAG] Cached embeddings for', results.length, 'of', docs.length, 'schema documents');
  return results;
}

/**
 * Start warming the schema embeddings in the background.
 */
export function warmupSchemaRag() {
  if (!schemaEmbeddingsComplete && !isSchemaBuilding) {
    buildSchemaEmbeddings().catch((err) =>
      console.warn('[Schema RAG] Background warmup failed:', err.message)
    );
  }
}

/**
 * Find the top-k most relevant schema documents for a user question.
 * Uses Qdrant when available; otherwise falls back to in-memory search.
 */
export async function findRelevantSchema(question = '', k = 10) {
  if (!question) return [];

  // Try Qdrant first
  const qdrantResults = await searchVectors(question, k).catch(() => null);
  if (qdrantResults && qdrantResults.length > 0) {
    return qdrantResults;
  }

  // Fallback: in-memory cache with cosine similarity
  if (!schemaEmbeddingsCache && !isSchemaBuilding) {
    warmupSchemaRag();
  }

  const docs = schemaEmbeddingsCache || [];
  if (docs.length === 0) return [];

  const qEmbed = await getEmbedding(question);
  if (!qEmbed) return [];

  const scored = docs
    .map((d) => ({ ...d, score: cosineSimilarity(qEmbed, d.embedding) }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, k);
}

/**
 * Format schema context for the LLM prompt.
 */
export function formatSchemaForPrompt(results = [], userLang = 'ar') {
  if (results.length === 0) return '';

  const header = userLang === 'ar'
    ? '## معلومات إضافية عن الجداول ذات الصلة بالسؤال'
    : '## Additional schema context relevant to the question';

  const lines = results.map((d) => `- ${d.text}`);
  return [header, ...lines].join('\n');
}
