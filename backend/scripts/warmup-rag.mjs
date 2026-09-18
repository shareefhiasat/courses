#!/usr/bin/env node
/**
 * One-shot RAG warmup.
 *
 * Loads the Prisma schema and real-world entities, embeds them with Ollama,
 * and stores them in Qdrant. Run this when the app starts after a deploy or
 * after the vector store has been cleared.
 */

import '../loadEnv.js';
import { buildSchemaEmbeddings } from '../ai/schemaRag.js';
import { buildEntityEmbeddings } from '../ai/entityRag.js';

async function main() {
  console.log('[Warmup] Building schema embeddings...');
  await buildSchemaEmbeddings();
  console.log('[Warmup] Schema embeddings done.');

  console.log('[Warmup] Building entity embeddings...');
  await buildEntityEmbeddings();
  console.log('[Warmup] Entity embeddings done.');
}

main().catch((err) => {
  console.error('[Warmup] Failed:', err.message);
  process.exit(1);
});
