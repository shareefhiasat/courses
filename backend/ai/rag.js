/**
 * Lightweight RAG (Retrieval-Augmented Generation) for the AI Assistant.
 *
 * No static question bank. The assistant learns directly from the live Prisma
 * schema via schemaRag.js and a vector store (Qdrant) that runs as a Docker
 * image. Ollama provides the embeddings.
 */

import { findRelevantSchema, formatSchemaForPrompt, warmupSchemaRag } from './schemaRag.js';
import { findRelevantEntities, formatEntitiesForPrompt, warmupEntityRag } from './entityRag.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text:latest';

async function requestOllamaEmbeddings(input, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${OLLAMA_URL}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Ollama embed returned ${res.status}`);
    }

    const data = await res.json();
    return data.embeddings || null;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[RAG] Embedding request timed out');
    } else {
      console.warn('[RAG] Embedding generation failed:', err.message);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch embedding vector from Ollama for a single text.
 */
export async function getEmbedding(text, timeoutMs = 30000) {
  const embeddings = await requestOllamaEmbeddings(text, timeoutMs);
  if (!embeddings) return null;
  return Array.isArray(embeddings[0]) ? embeddings[0] : embeddings;
}

/**
 * Fetch embedding vectors from Ollama for an array of texts.
 */
export async function getEmbeddings(texts, timeoutMs = 60000) {
  if (!Array.isArray(texts) || texts.length === 0) return null;
  const embeddings = await requestOllamaEmbeddings(texts, timeoutMs);
  if (!embeddings) return null;
  return Array.isArray(embeddings[0]) ? embeddings : [embeddings];
}

/**
 * Schema-aware + entity-aware RAG context.
 * No pre-defined questions. The LLM learns from the database schema and the
 * actual real-world entities stored in the system.
 */
export async function getRagContext(question = '', userLang = 'ar', schemaK = 8, entityK = 6) {
  if (!question || typeof question !== 'string') return '';
  const schemaLimit = Math.max(1, schemaK);
  const entityLimit = Math.max(1, entityK);
  warmupSchemaRag();
  warmupEntityRag();

  const [schemaResults, entityResults] = await Promise.all([
    findRelevantSchema(question, schemaLimit).catch(() => []),
    findRelevantEntities(question, entityLimit).catch(() => []),
  ]);

  const schemaText = formatSchemaForPrompt(schemaResults, userLang);
  const entityText = formatEntitiesForPrompt(entityResults, userLang);

  if (!schemaText && !entityText) return '';

  const guidance = userLang === 'ar'
    ? '## توجيهات\nأنت مساعد ذكي. افهم السؤال من سياق نظام إدارة التعلم العسكري، ثم اختر الأداة الصحيحة بناءً على المخطط والكيانات أدناه. لا تعتمد على أسئلة محفوظة.'
    : '## Guidance\nYou are a smart assistant. Understand the question in the context of the Military LMS, then choose the correct tool based on the schema and entities below. Do not rely on memorized questions.';

  return [guidance, schemaText, entityText].filter(Boolean).join('\n\n');
}
