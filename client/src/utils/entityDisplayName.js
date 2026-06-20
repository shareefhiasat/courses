/**
 * Unified display-name resolver for entities and users.
 *
 * Users: kind 'user' → localized bilingual name fields.
 * Lookups / scheduling entities: nameEn/nameAr (and code) per kind.
 */

import { getLocalizedName } from './languageHelpers.js';
import { getLocalizedUserName } from './localizedUserName.js';

function resolveProgramName(entity, lang) {
  if (!entity) return '';
  if (lang === 'ar' && entity.nameAr) return entity.nameAr;
  return entity.nameEn || entity.name || entity.code || '';
}

function resolveSubjectName(entity, lang) {
  if (!entity) return '';
  if (lang === 'ar' && entity.nameAr) return entity.nameAr;
  return entity.nameEn || entity.code || '';
}

function resolveClassName(entity, lang, fallback = '') {
  if (!entity) return fallback;
  if (lang === 'ar' && entity.nameAr) return entity.nameAr;
  return entity.nameEn || entity.name || entity.code || fallback;
}

function resolveClassroomName(entity, lang) {
  if (!entity) return '';
  if (lang === 'ar' && entity.nameAr) return entity.nameAr;
  return entity.nameEn || entity.code || '';
}

function resolveGenericName(entity, lang) {
  if (!entity) return '';
  if (lang === 'ar' && entity.nameAr) return entity.nameAr;
  if (entity.nameEn) return entity.nameEn;
  if (entity.name) return entity.name;
  if (entity.code) return entity.code;
  return '';
}

const KIND_RESOLVERS = {
  user: (entity, lang, fallback) => getLocalizedUserName(entity, lang, fallback),
  lookup: (entity, lang) => getLocalizedName(entity, lang),
  program: (entity, lang) => resolveProgramName(entity, lang),
  subject: (entity, lang) => resolveSubjectName(entity, lang),
  class: (entity, lang, fallback) => resolveClassName(entity, lang, fallback),
  classroom: (entity, lang) => resolveClassroomName(entity, lang),
};

/**
 * @param {object|null|undefined} entity
 * @param {object|string} [options]
 * @param {'user'|'lookup'|'program'|'subject'|'class'|'classroom'} [options.kind]
 * @param {'en'|'ar'|string} [options.lang='en']
 * @param {string} [options.fallback='—']
 */
export function getEntityDisplayName(entity, options = {}) {
  const opts = typeof options === 'string' ? { lang: options } : options;
  const { kind, lang = 'en', fallback = '—' } = opts;

  if (!entity) return fallback;

  const resolver = kind ? KIND_RESOLVERS[kind] : null;
  if (resolver) {
    const name = resolver(entity, lang, fallback);
    return name || fallback;
  }

  const generic = resolveGenericName(entity, lang);
  return generic || fallback;
}

export default getEntityDisplayName;
