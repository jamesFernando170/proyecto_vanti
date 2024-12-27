export const logger = {
  log: (message: string) => console.log(message),
  error: (message: string, error?: unknown) => console.error(message, error),
};
