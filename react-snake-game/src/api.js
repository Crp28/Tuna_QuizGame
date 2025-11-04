/**
 * Assessment API utilities
 * Client-side functions for server-authoritative assessment flow
 */

const API_BASE = process.env.REACT_APP_API_BASE || '';

/**
 * Start a new assessment session
 * @param {string} folder - The question bank folder
 * @returns {Promise<{itemId, question, options, seq}>}
 */
export async function startAssessment(folder) {
  const response = await fetch(`${API_BASE}/api/assessments/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ folder })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start assessment');
  }
  
  return response.json();
}

/**
 * Submit an answer attempt
 * @param {string} itemId - The question item ID
 * @param {string} optionId - The selected option ID
 * @param {number} seq - The sequence number
 * @returns {Promise<{correct: boolean, nextItem?: {itemId, question, options, seq}}>}
 */
export async function submitAttempt(itemId, optionId, seq) {
  const response = await fetch(`${API_BASE}/api/assessments/attempt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ itemId, optionId, seq })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit attempt');
  }
  
  return response.json();
}

/**
 * Get the correct answer for the current question (used when game ends without selecting an answer)
 * @param {string} itemId - The question item ID
 * @param {number} seq - The sequence number
 * @returns {Promise<{correctAnswer: {optionId, label, text}}>}
 */
export async function revealCorrectAnswer(itemId, seq) {
  const response = await fetch(`${API_BASE}/api/assessments/reveal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ itemId, seq })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reveal correct answer');
  }
  
  return response.json();
}

/**
 * Retry wrapper with exponential backoff
 * @param {Function} fn - The async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise<any>}
 */
export async function retryWithBackoff(fn, maxRetries = 2, initialDelay = 200) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
