/** Normalizes error messages with a leading capital letter. */
export function formatErrorMessage(message?: string): string {
  if (!message) return 'An unexpected error occurred.';
  return message.charAt(0).toUpperCase() + message.slice(1);
}

/** Error for missing resources. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(formatErrorMessage(message));
    this.name = 'NotFoundError';
  }
}

/** Error for authentication or authorization failures. */
export class UnauthorisedError extends Error {
  constructor(message: string) {
    super(formatErrorMessage(message));
    this.name = 'UnauthorisedError';
  }
}

/** Error for input validation failures. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(formatErrorMessage(message));
    this.name = 'ValidationError';
  }
}
