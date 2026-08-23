export type EngineErrorCode =
  | "MODEL_TIMEOUT"
  | "MODEL_RATE_LIMIT"
  | "MODEL_OUTPUT_INVALID"
  | "PROVIDER_AUTH_EXPIRED"
  | "PROVIDER_PERMISSION_LOST"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_TIMEOUT_AMBIGUOUS"
  | "MEDIA_UPLOAD_FAILED"
  | "CAPABILITY_UNAVAILABLE"
  | "APPROVAL_REQUIRED"
  | "POLICY_BLOCKED"
  | "SCHEDULE_EXPIRED"
  | "INTERNAL_ERROR";

export class EngineError extends Error {
  readonly code: EngineErrorCode;
  readonly retryable: boolean;
  readonly ownerActionRequired: boolean;
  readonly details: Record<string, unknown>;

  constructor(input: {
    code: EngineErrorCode;
    message: string;
    retryable?: boolean;
    ownerActionRequired?: boolean;
    details?: Record<string, unknown>;
    cause?: unknown;
  }) {
    super(input.message, { cause: input.cause });
    this.name = "EngineError";
    this.code = input.code;
    this.retryable = input.retryable ?? false;
    this.ownerActionRequired = input.ownerActionRequired ?? false;
    this.details = input.details ?? {};
  }
}

export function normalizeEngineError(error: unknown): EngineError {
  if (error instanceof EngineError) return error;
  return new EngineError({
    code: "INTERNAL_ERROR",
    message: error instanceof Error ? error.message : "Unknown workflow failure",
    retryable: false,
    cause: error,
  });
}
