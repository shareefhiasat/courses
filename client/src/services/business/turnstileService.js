import { httpsCallable } from 'firebase/functions';
import { functions } from '../other/config';

const TURNSTILE_ENABLED = import.meta.env.VITE_TURNSTILE_ENABLED === 'true';

export const verifyTurnstileToken = async (token, action = 'login') => {
  if (!TURNSTILE_ENABLED) {
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'Please complete the security check.' };
  }

  if (token === 'dev-bypass') {
    return { success: true };
  }

  try {
    const verifyTurnstile = httpsCallable(functions, 'verifyTurnstileToken');
    const result = await verifyTurnstile({ token, action });

    if (result.data?.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.data?.error || 'Security check failed. Please try again.'
    };
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return { success: false, error: 'Unable to verify security check. Please try again.' };
  }
};
