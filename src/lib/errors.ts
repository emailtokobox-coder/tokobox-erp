/**
 * Shared error classes for the application.
 *
 * Usage:
 *   throw new AppError("Something went wrong", 500);
 *   throw new ValidationError("Invalid input", { field: "email" });
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, details);
    this.name = "ValidationError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 500, details);
    this.name = "DatabaseError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export type { AppError as ApiError };
