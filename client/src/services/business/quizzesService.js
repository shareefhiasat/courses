export const getQuizzes = async () => ({ success: true, data: [] });
export const getQuizById = async () => ({ success: true, data: {} });
export const createQuiz = async () => ({ success: true, data: {} });
export const updateQuiz = async () => ({ success: true, data: {} });
export const deleteQuiz = async () => ({ success: true });
export default { getQuizzes, getQuizById, createQuiz, updateQuiz, deleteQuiz };
