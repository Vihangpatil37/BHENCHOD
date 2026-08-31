import { AIErrorCategory, RetryPolicy } from '../types/retry.types';

export function classifyAIError(error: any): AIErrorCategory {
  if (!error) return 'UNKNOWN';
  
  const status = error.response?.status || error.statusCode;
  const message = error.message?.toLowerCase() || '';
  const data = JSON.stringify(error.response?.data || '').toLowerCase();
  
  // Timeout
  if (
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    message.includes('timeout')
  ) {
    return 'TIMEOUT';
  }
  
  // Rate Limited
  if (
    status === 429 ||
    message.includes('rate limit') ||
    data.includes('rate limit') ||
    data.includes('insufficient_quota') ||
    data.includes('resource_exhausted') ||
    data.includes('quota exceeded')
  ) {
    return 'RATE_LIMITED';
  }
  
  // Overloaded
  if (
    status === 503 ||
    message.includes('service unavailable') ||
    message.includes('overloaded') ||
    data.includes('high demand')
  ) {
    return 'OVERLOADED';
  }
  
  // Auth Error
  if (
    status === 401 ||
    status === 403 ||
    message.includes('unauthorized') ||
    message.includes('invalid api key') ||
    message.includes('authentication')
  ) {
    return 'AUTH_ERROR';
  }
  
  // Invalid Request
  if (
    status === 400 ||
    status === 422 ||
    message.includes('bad request') ||
    message.includes('invalid')
  ) {
    return 'INVALID_REQUEST';
  }
  
  // Server Error
  if (status >= 500) {
    return 'SERVER_ERROR';
  }
  
  // Network Error
  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'EAI_AGAIN'
  ) {
    return 'NETWORK_ERROR';
  }
  
  return 'UNKNOWN';
}

export function getRetryPolicy(category: AIErrorCategory): RetryPolicy {
  switch (category) {
    case 'TIMEOUT':
    case 'NETWORK_ERROR':
      return {
        retrySameKey: false,
        nextKey: true,
        nextProvider: true,
      };
    case 'RATE_LIMITED':
    case 'OVERLOADED':
    case 'SERVER_ERROR':
    case 'UNKNOWN':
      return {
        retrySameKey: false,
        nextKey: true,
        nextProvider: true,
      };
    case 'AUTH_ERROR':
      return {
        retrySameKey: false,
        nextKey: true,
        nextProvider: true,
      };
    case 'INVALID_REQUEST':
      return {
        retrySameKey: false,
        nextKey: false,
        nextProvider: false, // Don't retry at all
      };
    default:
      return {
        retrySameKey: false,
        nextKey: true,
        nextProvider: true,
      };
  }
}
