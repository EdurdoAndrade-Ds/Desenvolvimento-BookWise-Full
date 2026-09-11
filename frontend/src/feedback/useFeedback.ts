import { useContext } from 'react';
import { FeedbackContext, type FeedbackContextValue } from './feedbackContext';

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback deve ser usado dentro de FeedbackProvider');
  return context;
}
