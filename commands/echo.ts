import { Message } from 'whatsapp-web.js';

/**
 * Echo command for the WhatsApp bot.
 * This command replies with the same text that was sent to it.
 * Basic command to demonstrate functionality.
 */


module.exports = {
  name: 'echo',
  async execute(message: Message, args: string[]) {
    const text = args.join(' ');
    await message.reply(text);
  }
};