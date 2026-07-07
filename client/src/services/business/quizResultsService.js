export const getQuizResults = async () => ({ success: true, data: [] });
export const getQuizResultsByUser = async () => ({ success: true, data: [] });
export const getQuizResultById = async () => ({ success: true, data: {} });
export const createQuizResult = async () => ({ success: true, data: {} });
export const updateQuizResult = async () => ({ success: true, data: {} });
export const deleteQuizResult = async () => ({ success: true });
export const batchUpdateQuizResults = async () => ({ success: true });
export default { getQuizResults, getQuizResultById, createQuizResult, updateQuizResult, deleteQuizResult, batchUpdateQuizResults };
