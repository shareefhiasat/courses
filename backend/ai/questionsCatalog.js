/**
 * AI Quick-Questions Catalog (backend re-export)
 *
 * The canonical catalog lives in the client constants so the UI can import it
 * directly. The backend re-exports it here for use by the quick-query endpoint.
 */

export {
  AI_QUESTIONS,
  AI_QUESTION_CATEGORIES,
  getQuestionById,
  getQuestionLabel,
  getQuestionQuery,
  isQuestionAllowed,
  filterAiQuestions,
} from '../../client/src/constants/aiQuestions.js';
