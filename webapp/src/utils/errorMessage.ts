export const appendErrorMessage = (
  currentMessage: string | null,
  newMessage: string,
): string => {
  if (!newMessage) return currentMessage ?? "";
  return currentMessage ? `${currentMessage}\n${newMessage}` : newMessage;
};

export function getErrorMessage(
  error: unknown,
  defaultMessage = "En uventet feil oppstod",
): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  if (typeof error === "string") {
    return error;
  }
  return defaultMessage;
}
