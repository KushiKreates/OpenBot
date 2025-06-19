import { Message, Chat } from 'whatsapp-web.js';

/**
 * Info command for the whatsapp bot
 */


const infoMessage = `\nThis bot is powered by Nadhi.dev ⚙️\n` +
  `For more information, visit: https://nadhi.dev\n` +
  `This bot is made for me and my friends :D\n` +
  `Nerdy information\n` + `Version: 1.0.0\n` + `Javascript Engine: Bun.js` + `\nFramework: whatsapp-web.js(Nadhi's)\n` 


export default {
  name: 'info',
  async execute(message: Message, args: string[]) {
    const chat = await message.getChat();

    
      
      // Show typing indicator
    await chat.sendStateTyping();
   
    await message.reply(
      `Talking to *${chat.name}* (${chat.id.user}) 👌\n` + infoMessage
    );
  }
};