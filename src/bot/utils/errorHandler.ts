import { BotContext } from '../../types';

export async function sendTemporaryError(ctx: BotContext, message: string = 'Sorry, there was an error. Please try again.', duration: number = 5000) {
  try {
    const errorMsg = await ctx.reply(message);
    
    // Auto-delete the error message after specified duration
    setTimeout(async () => {
      try {
        await ctx.deleteMessage(errorMsg.message_id);
      } catch (e) {
        // Message might already be deleted or we don't have permission
      }
    }, duration);
    
    return errorMsg;
  } catch (error) {
    // If we can't send/delete messages, just log it
    console.log('Could not send temporary error message:', error);
  }
}

export function createErrorHandler(handlerName: string) {
  return async (ctx: BotContext, error: any) => {
    console.error(`${handlerName} error:`, error);
    await sendTemporaryError(ctx, 'Sorry, there was an error. Please try again.', 5000);
  };
}
