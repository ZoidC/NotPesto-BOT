// Thanks to Kent C. Dodds
// https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
