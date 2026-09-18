#!/usr/bin/env node
/**
 * Quick RAG smoke test.
 *
 * Verifies Ollama embedding, Qdrant upsert/search, and getRagContext
 * with only a few schema and entity documents so it finishes fast.
 */

import '../loadEnv.js';
import { getEmbedding, getEmbeddings, getRagContext } from '../ai/rag.js';
import { upsertVectors, searchVectors } from '../ai/vectorStore.js';

const c = process.env.QDRANT_COLLECTION || 'lms_schema_rag';

async function main() {
  const texts = [
    'The User table stores first name, last name, email, student number, and rank.',
    'The Program table stores code, English name, Arabic name, and duration.',
    'The Attendance table records user attendance status for a specific date.',
  ];

  console.log('[Smoke] Embedding', texts.length, 'docs...');
  const embeddings = await getEmbeddings(texts, 120000);
  if (!embeddings) {
    console.error('[Smoke] Failed to get embeddings');
    process.exit(1);
  }

  const points = texts.map((text, i) => ({
    id: `smoke_${i}`,
    embedding: embeddings[i],
    text,
    topic: 'smoke',
    entity: `smoke_${i}`,
  }));

  console.log('[Smoke] Upserting to Qdrant collection', c, '...');
  const ok = await upsertVectors(points, c);
  if (!ok) {
    console.error('[Smoke] Qdrant upsert failed');
    process.exit(1);
  }

  console.log('[Smoke] Searching Qdrant...');
  const results = await searchVectors('what is the Attendance table?', 2, c);
  if (!results || results.length === 0) {
    console.error('[Smoke] Qdrant search returned no results');
    process.exit(1);
  }

  console.log('[Smoke] Search results:');
  for (const r of results) {
    console.log('  -', r.text.substring(0, 80), '(score', r.score.toFixed(4) + ')');
  }

  console.log('[Smoke] getRagContext sample:');
  const ctx = await getRagContext('what is the Attendance table?', 'en', 2, 0);
  console.log(ctx.substring(0, 500));
  console.log('[Smoke] OK');
}

main().catch((err) => {
  console.error('[Smoke] Failed:', err.message);
  process.exit(1);
});
