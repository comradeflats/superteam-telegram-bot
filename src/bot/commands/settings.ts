import { BotContext } from '../../types';
import { handleStartSettings } from './start';

export async function handleSettings(ctx: BotContext) {
  await handleStartSettings(ctx);
}
