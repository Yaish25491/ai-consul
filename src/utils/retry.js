/**
 * Retry configuration defaults
 */
export const DEFAULT_RETRY_CONFIG = {
  maxRetries: parseInt(process.env.AI_CONSUL_MAX_RETRIES) || 3,
  initialDelayMs: parseInt(process.env.AI_CONSUL_INITIAL_DELAY_MS) || 1000,
  maxDelayMs: parseInt(process.env.AI_CONSUL_MAX_DELAY_MS) || 60000,
  backoffMultiplier: 2,
  jitterMs: 500,
  retryableStatusCodes: [429, 500, 502, 503, 504],
  retryableErrorNames: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']
};

/**
 * Check if error is retryable
 */
export function isRetryableError(error, config = DEFAULT_RETRY_CONFIG) {
  // HTTP status code errors (Anthropic SDK format)
  if (error.status && config.retryableStatusCodes.includes(error.status)) {
    return true;
  }

  // Google Generative AI SDK format (different error structure)
  if (error.response?.status && config.retryableStatusCodes.includes(error.response.status)) {
    return true;
  }

  // Network errors
  if (error.code && config.retryableErrorNames.includes(error.code)) {
    return true;
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateDelay(attemptNumber, config = DEFAULT_RETRY_CONFIG) {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attemptNumber);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  const jitter = Math.random() * config.jitterMs;
  return Math.floor(cappedDelay + jitter);
}

/**
 * Execute function with retry logic
 *
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry configuration
 * @param {Function} onRetry - Optional callback(attemptNumber, error, delayMs)
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise} - Result of fn()
 */
export async function withRetry(fn, options = {}, onRetry = null, signal = null) {
  const config = { ...DEFAULT_RETRY_CONFIG, ...options };
  let lastError;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    // Check abort before attempting
    if (signal?.aborted) {
      const error = new Error('Request aborted');
      error.name = 'AbortError';
      throw error;
    }

    try {
      return await fn(signal);
    } catch (error) {
      lastError = error;

      // Don't retry abort errors
      if (error.name === 'AbortError') {
        throw error;
      }

      // Check if error is retryable
      const shouldRetry = isRetryableError(error, config) && attempt < config.maxRetries;

      if (!shouldRetry) {
        throw error; // Give up
      }

      // Calculate delay and notify
      const delayMs = calculateDelay(attempt, config);

      if (onRetry) {
        onRetry(attempt + 1, error, delayMs);
      }

      // Wait before retry (check for abort during wait)
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, delayMs);

        if (signal) {
          const abortHandler = () => {
            clearTimeout(timeout);
            const abortError = new Error('Request aborted during retry wait');
            abortError.name = 'AbortError';
            reject(abortError);
          };
          signal.addEventListener('abort', abortHandler, { once: true });
        }
      });
    }
  }

  // All retries exhausted
  throw lastError;
}
