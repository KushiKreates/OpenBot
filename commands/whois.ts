import { Message, Contact } from 'whatsapp-web.js';
import { log } from '../base/log';

/**
 * Who is command 
 * This command shows the information of the user 
 * mentioned
 */

export default {
    name: 'whois',
    async execute(message: Message, args: string[]) {
         const chat = await message.getChat();
      
        // Show typing indicator
        await chat.sendStateTyping();

        try {
            // Get the mentioned contact
            const mentions = await message.getMentions();

            log(`Received whois command with args: ${args.join(' ')}`);
            
            if (mentions.length === 0) {
                return message.reply('Please mention a user to get their information.');
            }

            const contact: Contact = mentions[0];
            const info = [
                `*Name:* ${contact.name || 'N/A'}`,
                `*Number:* ${contact.number}`,
                `*Short Name:* ${contact.shortName || 'N/A'}`,
                `*Push Name:* ${contact.pushname || 'N/A'}`
            ].join('\n');

            await message.reply(info);
        } catch (error) {
            await message.reply('Error fetching user information.');
        }
    }
};