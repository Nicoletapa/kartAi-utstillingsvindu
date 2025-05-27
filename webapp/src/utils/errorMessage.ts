export const appendErrorMessage = (currentMessage: string | null, newMessage: string): string => {
  if (!newMessage) return currentMessage ?? '';
  return currentMessage ? `${currentMessage}\n${newMessage}` : newMessage;
};