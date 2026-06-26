import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { Buffer } from 'buffer';
import matter from 'gray-matter';
import { useLang } from '../contexts/LangContext';

// gray-matter needs Buffer in the browser
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

import enIndex from '/src/help/en/index.md?raw';
import enHome from '/src/help/en/home.md?raw';
import enDashboard from '/src/help/en/dashboard.md?raw';
import enQuizzes from '/src/help/en/quizzes.md?raw';
import enAttendance from '/src/help/en/attendance.md?raw';
import enChat from '/src/help/en/chat.md?raw';
import enNotifications from '/src/help/en/notifications.md?raw';
import enSmartDrive from '/src/help/en/smart-drive.md?raw';
import enWorkflow from '/src/help/en/workflow.md?raw';
import enScheduling from '/src/help/en/scheduling.md?raw';
import enProfile from '/src/help/en/profile.md?raw';

import arIndex from '/src/help/ar/index.md?raw';
import arHome from '/src/help/ar/home.md?raw';
import arDashboard from '/src/help/ar/dashboard.md?raw';
import arQuizzes from '/src/help/ar/quizzes.md?raw';
import arAttendance from '/src/help/ar/attendance.md?raw';
import arChat from '/src/help/ar/chat.md?raw';
import arNotifications from '/src/help/ar/notifications.md?raw';
import arSmartDrive from '/src/help/ar/smart-drive.md?raw';
import arWorkflow from '/src/help/ar/workflow.md?raw';
import arScheduling from '/src/help/ar/scheduling.md?raw';
import arProfile from '/src/help/ar/profile.md?raw';

const enArticles = {
  '/src/help/en/index.md': enIndex,
  '/src/help/en/home.md': enHome,
  '/src/help/en/dashboard.md': enDashboard,
  '/src/help/en/quizzes.md': enQuizzes,
  '/src/help/en/attendance.md': enAttendance,
  '/src/help/en/chat.md': enChat,
  '/src/help/en/notifications.md': enNotifications,
  '/src/help/en/smart-drive.md': enSmartDrive,
  '/src/help/en/workflow.md': enWorkflow,
  '/src/help/en/scheduling.md': enScheduling,
  '/src/help/en/profile.md': enProfile,
};

const arArticles = {
  '/src/help/ar/index.md': arIndex,
  '/src/help/ar/home.md': arHome,
  '/src/help/ar/dashboard.md': arDashboard,
  '/src/help/ar/quizzes.md': arQuizzes,
  '/src/help/ar/attendance.md': arAttendance,
  '/src/help/ar/chat.md': arChat,
  '/src/help/ar/notifications.md': arNotifications,
  '/src/help/ar/smart-drive.md': arSmartDrive,
  '/src/help/ar/workflow.md': arWorkflow,
  '/src/help/ar/scheduling.md': arScheduling,
  '/src/help/ar/profile.md': arProfile,
};

function parseModules(modules, lang) {
  const articles = [];
  for (const [path, raw] of Object.entries(modules)) {
    try {
      const { data, content } = matter(raw);
      const slug = path.split('/').pop().replace(/\.md$/, '');
      articles.push({
        slug,
        lang,
        title: data.title || slug,
        tags: data.tags || [],
        route: data.route || null,
        order: data.order ?? 999,
        content,
      });
    } catch {
      // skip malformed
    }
  }
  articles.sort((a, b) => a.order - b.order);
  return articles;
}

export function useHelpArticles() {
  const { lang } = useLang();
  const effectiveLang = lang === 'ar' ? 'ar' : 'en';

  const allArticles = useMemo(() => {
    const en = parseModules(enArticles, 'en');
    const ar = parseModules(arArticles, 'ar');
    return { en, ar };
  }, []);

  const articles = useMemo(() => {
    const primary = allArticles[effectiveLang];
    const fallback = allArticles['en'];
    // For each primary article, ensure it exists; if missing in ar, fall back to en
    if (effectiveLang === 'ar') {
      return primary.map((arArticle) => {
        if (!arArticle.content || arArticle.content.trim() === '') {
          const enMatch = fallback.find((en) => en.slug === arArticle.slug);
          if (enMatch) return { ...enMatch, lang: 'ar' };
        }
        return arArticle;
      });
    }
    return primary;
  }, [allArticles, effectiveLang]);

  const fuse = useMemo(() => {
    return new Fuse(articles, {
      keys: [
        { name: 'title', weight: 0.5 },
        { name: 'tags', weight: 0.3 },
        { name: 'content', weight: 0.2 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [articles]);

  const search = useMemo(() => {
    return (query) => {
      if (!query || query.trim().length < 2) return [];
      return fuse.search(query).map((r) => r.item);
    };
  }, [fuse]);

  const getArticle = useMemo(() => {
    return (slug) => articles.find((a) => a.slug === slug);
  }, [articles]);

  const getArticleByRoute = useMemo(() => {
    return (route) => articles.find((a) => a.route === route);
  }, [articles]);

  return { articles, search, getArticle, getArticleByRoute, lang: effectiveLang };
}
