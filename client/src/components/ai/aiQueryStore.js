/**
 * aiQueryStore
 *
 * Module-level store for the AI quick-question assistant.
 * Executes predefined questions directly and drives the loading + notification UX.
 */

import { askAiQuickAssistant } from '@services/business/aiQueryService';
import { getQuestionById, getQuestionQuery } from '@constants/aiQuestions';

const STORAGE_KEY = 'lms_ai_query_history_v1';

function loadMessages() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return [];
}

let state = {
  open: false,
  loading: false,
  messages: loadMessages(),
  input: '',
  copiedId: null,
  timeLeft: 0,
};

const listeners = new Set();
let countdownInterval = null;

function emit() {
  listeners.forEach((listener) => listener(state));
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages.slice(-30)));
  } catch {
    /* ignore storage quota */
  }
}

function setPartial(update) {
  state = { ...state, ...update };
  persist();
  emit();
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

async function requestNotificationPermission() {
  if (typeof window === 'undefined') return;
  if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    await Notification.requestPermission();
  }
}

function showNotification(text, lang) {
  if (typeof window === 'undefined') return;
  if ('Notification' in window && Notification.permission === 'granted') {
    const title = lang === 'ar' ? 'المساعد الذكي' : 'AI Assistant';
    const body = text.length > 100 ? `${text.slice(0, 97)}...` : text;
    const notification = new Notification(title, {
      body,
      requireInteraction: true,
      icon: '/favicon.ico',
      tag: 'ai-query-ready',
    });
    notification.onclick = () => {
      setOpen(true);
      notification.close();
    };
  }
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return state;
}

export function setOpen(value) {
  setPartial({ open: value });
}

export function clearHistory() {
  setPartial({ messages: [] });
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function copyMessage(id, text) {
  navigator.clipboard?.writeText(text);
  setPartial({ copiedId: id });
  setTimeout(() => setPartial({ copiedId: null }), 2000);
}

export async function startQuickQuestion(questionId, lang) {
  if (!questionId || state.loading) return;

  const question = getQuestionById(questionId);
  if (!question) return;

  const displayText = getQuestionQuery(question, lang);

  const userMsg = {
    id: `u_${Date.now()}`,
    role: 'user',
    text: displayText,
    timestamp: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
  };

  setPartial({
    input: '',
    open: true,
    loading: true,
    timeLeft: 0,
    messages: [...state.messages, userMsg],
  });

  await requestNotificationPermission();

  try {
    const res = await askAiQuickAssistant(questionId, lang);
    const aiMsg = {
      id: `ai_${Date.now()}`,
      role: 'ai',
      text: res.answer || (lang === 'ar' ? 'تمت معالجة الاستعلام.' : 'Query processed.'),
      tool: res.tool,
      success: res.success,
      fromCache: res.fromCache,
      cachedAt: res.cachedAt,
      timestamp: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    const wasOpen = state.open;
    setPartial({
      loading: false,
      messages: [...state.messages, aiMsg],
      open: true,
    });
    if (!wasOpen) {
      showNotification(aiMsg.text, lang);
    }
  } catch (err) {
    const errorMsg = {
      id: `err_${Date.now()}`,
      role: 'ai',
      text: lang === 'ar' ? 'حدث خطأ أثناء معالجة السؤال السريع.' : 'An error occurred while processing the quick question.',
      success: false,
      timestamp: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setPartial({
      loading: false,
      messages: [...state.messages, errorMsg],
      open: true,
    });
  } finally {
    stopCountdown();
  }
}
