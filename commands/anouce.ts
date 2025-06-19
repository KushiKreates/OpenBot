import { Message, GroupChat } from 'whatsapp-web.js';

// Cooldown tracking map: userId -> timestamp
const cooldowns = new Map<string, number>();
const COOLDOWN_DURATION = 10 * 1000; // 10 seconds in milliseconds

/**
 * Announcement command
 * Sends a message to the group mentioning everyone
 * Has a 10-second cooldown between uses
 */
export default {
  name: 'an',
  async execute(message: Message, args: string[]) {
    try {
      // Get the user ID for cooldown tracking
      const userId = message.author || message.from;
      
      // Check if the user is on cooldown
      const lastUsed = cooldowns.get(userId);
      const now = Date.now();
      
      if (lastUsed && (now - lastUsed) < COOLDOWN_DURATION) {
        // User is on cooldown
        const remainingTime = Math.ceil((COOLDOWN_DURATION - (now - lastUsed)) / 1000);
        return message.reply(`🕒 Please wait ${remainingTime} seconds before using this command again.`);
      }
      
      // Set cooldown
      cooldowns.set(userId, now);
      
      // Get the chat
      const chat = await message.getChat();
      
      // Check if it's a group chat
      if (!chat.isGroup) {
        return message.reply('This command can only be used in group chats!');
      }

      // Check if there's an announcement message
      if (args.length === 0) {
        return message.reply('Please provide an announcement message!');
      }
      
      // Get the announcement text
      const announcement = args.join(' ');
      
      // Show typing indicator
      await chat.sendStateTyping();
      
      // Get the group chat
      const groupChat = chat as GroupChat;
      
      // Get all participants
      const participants = groupChat.participants;
      
      // Build the announcement message
      let announcementMessage = `📢 *ANNOUNCEMENT* 📢\n\n${announcement}\n\n`;
      
      // Create an array to store mentions
      const mentions = [];
      
      // Process participants
      for (const participant of participants) {
        // Use the correct format for mentions
        announcementMessage += `@${participant.id.user} `;
        //@ts-ignore
        mentions.push(participant.id._serialized);
      }
      
      // Send the announcement with mentions
      await chat.sendMessage(announcementMessage, { mentions });
      
      // Clean up old cooldowns periodically
      cleanupCooldowns();
      
    } catch (error) {
      console.error('Error in announcement command:', error);
      await message.reply('Failed to make announcement. Please try again later.');
    }
  }
};

/**
 * Clean up expired cooldowns to prevent memory leaks
 */
function cleanupCooldowns(): void {
  const now = Date.now();
  for (const [userId, timestamp] of cooldowns.entries()) {
    if (now - timestamp > COOLDOWN_DURATION) {
      cooldowns.delete(userId);
    }
  }
}