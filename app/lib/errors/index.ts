import VError from "verror";

/**
 * Base HTTP Error class mimicking TRPCError.
 */
export class HttpError extends VError {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string, info?: Record<string, unknown>, cause?: Error) {
    super(
      {
        name: code,
        info,
        cause,
      },
      message
    );
    this.status = status;
    this.code = code;
  }
}

/**
 * NOT_FOUND error (404)
 * Use when a requested resource cannot be found.
 */
export class NotFoundError extends HttpError {
  constructor(message: string, info?: Record<string, unknown>, cause?: Error) {
    super(404, "NOT_FOUND", message, info, cause);
  }
}

/**
 * UNAUTHORIZED error (401)
 * Use when authentication is required and has failed or has not yet been provided.
 */
export class UnauthorizedError extends HttpError {
  constructor(message: string, info?: Record<string, unknown>, cause?: Error) {
    super(401, "UNAUTHORIZED", message, info, cause);
  }
}

/**
 * FORBIDDEN error (403)
 * Use when the client does not have access rights to the content.
 */
export class ForbiddenError extends HttpError {
  constructor(message: string, info?: Record<string, unknown>, cause?: Error) {
    super(403, "FORBIDDEN", message, info, cause);
  }
}

/**
 * PRECONDITION_FAILED error (412)
 * Use when access to the target resource has been denied.
 */
export class PreconditionFailedError extends HttpError {
  constructor(message: string, info?: Record<string, unknown>, cause?: Error) {
    super(412, "PRECONDITION_FAILED", message, info, cause);
  }
}
