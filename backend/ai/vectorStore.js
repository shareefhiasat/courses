/**
 * Vector store client for RAG.
 *
 * Uses Qdrant (https://qdrant.tech/) via its REST API. Qdrant is an open-source
 * vector database with an official Docker image. It stores schema and entity
 * document embeddings so the AI can retrieve relevant context for any
 * natural-language question.
 *
 * If Qdrant is not available, the code falls back to an in-memory cosine search
 * so tests and local dev still work without the extra container.
 */

import { getEmbedding } from './rag.js';
import { createHash } from 'crypto';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'lms_schema_rag';
export const QDRANT_ENTITY_COLLECTION = process.env.QDRANT_ENTITY_COLLECTION || 'lms_entity_rag';
const VECTOR_SIZE = parseInt(process.env.VECTOR_SIZE || '768', 10);

// Per-collection availability cache
const qdrantReady = new Map();

function defaultCollection(collection) {
  return collection || QDRANT_COLLECTION;
}

/**
 * Qdrant point ids must be unsigned integers or UUIDs.
 * Hash a string id to a deterministic unsigned integer.
 */
function pointId(id) {
  if (typeof id === 'number' && Number.isInteger(id) && id >= 0) return id;
  const hash = createHash('sha256').update(String(id)).digest('hex');
  return parseInt(hash.slice(0, 12), 16);
}

/**
 * Check if the Qdrant server is reachable.
 */
async function isQdrantReady() {
  if (qdrantReady.has('server')) return qdrantReady.get('server');
  try {
    const res = await fetch(`${QDRANT_URL}/healthz`, { method: 'GET' });
    qdrantReady.set('server', res.ok);
  } catch (err) {
    qdrantReady.set('server', false);
  }
  return qdrantReady.get('server');
}

/**
 * Ensure a collection exists.
 */
async function ensureCollection(collection) {
  const c = defaultCollection(collection);
  if (!(await isQdrantReady())) return false;

  try {
    const res = await fetch(`${QDRANT_URL}/collections/${c}`, { method: 'GET' });
    if (res.ok) return true;

    const createRes = await fetch(`${QDRANT_URL}/collections/${c}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      }),
    });
    if (!createRes.ok) {
      const errText = await createRes.text();
      console.warn('[Vector Store] Failed to create collection:', errText);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Vector Store] Error ensuring collection:', err.message);
    return false;
  }
}

/**
 * Store a batch of documents with their embeddings in Qdrant.
 */
export async function upsertVectors(points = [], collection) {
  if (points.length === 0) return false;
  const c = defaultCollection(collection);
  if (!(await ensureCollection(c))) return false;

  const payload = {
    points: points.map((p, i) => ({
      id: pointId(p.id || `doc_${i}`),
      vector: p.embedding,
      payload: {
        text: p.text,
        topic: p.topic,
        entity: p.entity,
        entityType: p.entityType,
        entityId: p.entityId,
      },
    })),
  };

  try {
    const res = await fetch(`${QDRANT_URL}/collections/${c}/points?wait=true`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Vector Store] Upsert failed:', errText);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Vector Store] Upsert error:', err.message);
    return false;
  }
}

/**
 * Search Qdrant for the top-k vectors similar to the question.
 */
export async function searchVectors(question = '', k = 10, collection) {
  const c = defaultCollection(collection);
  if (!(await isQdrantReady())) return null;

  const qEmbed = await getEmbedding(question);
  if (!qEmbed) return null;

  try {
    const res = await fetch(`${QDRANT_URL}/collections/${c}/points/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector: qEmbed,
        limit: k,
        with_payload: true,
        with_vector: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Vector Store] Search failed:', errText);
      return null;
    }

    const data = await res.json();
    return (data.result || []).map((r) => ({
      text: r.payload.text,
      topic: r.payload.topic,
      entity: r.payload.entity,
      score: r.score,
    }));
  } catch (err) {
    console.warn('[Vector Store] Search error:', err.message);
    return null;
  }
}

/**
 * Fetch all points from a collection (with payload and vector).
 */
export async function getAllPoints(collection) {
  const c = defaultCollection(collection);
  if (!(await isQdrantReady())) return [];

  try {
    const res = await fetch(`${QDRANT_URL}/collections/${c}/points/scroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        with_payload: true,
        with_vector: true,
        limit: 10000,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Vector Store] Scroll failed:', errText);
      return [];
    }

    const data = await res.json();
    return (data.result?.points || []).map((r) => ({
      id: r.id,
      embedding: r.vector,
      text: r.payload?.text,
      topic: r.payload?.topic,
      entity: r.payload?.entity,
      entityType: r.payload?.entityType,
      entityId: r.payload?.entityId,
    }));
  } catch (err) {
    console.warn('[Vector Store] Scroll error:', err.message);
    return [];
  }
}

/**
 * Clear all points from a collection.
 */
export async function clearVectors(collection) {
  const c = defaultCollection(collection);
  if (!(await isQdrantReady())) return false;

  try {
    const res = await fetch(`${QDRANT_URL}/collections/${c}/points/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filter: {} }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Vector Store] Clear error:', err.message);
    return false;
  }
}
