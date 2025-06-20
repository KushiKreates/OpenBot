import { Message } from 'whatsapp-web.js';
import { chatWithGemini, setPersonality, getPersonality, clearConversation, getSessionData } from '../ChatHandler';

export default {
  name: 'chat',
  async execute(message: Message, args: string[]) {
    const chat = await message.getChat();
    const chatId = message.from;
    
    // Show typing indicator
    await chat.sendStateTyping();
    
    // Handle subcommands
    if (args.length > 0) {
      const subcommand = args[0].toLowerCase();
      
      // Set personality
      if (subcommand === 'setpersonality') {
        const newPersonality = args.slice(1).join(' ');
        
        if (!newPersonality) {
          await message.reply("Please provide a personality description after `!chat setpersonality`");
          return;
        }
        
        await setPersonality(chatId, newPersonality);
        await message.reply("✅ Personality updated successfully! I'll be different now~");
        return;
      }
      
      // Show current personality
      if (subcommand === 'personality') {
        const personality = await getPersonality(chatId);
        await message.reply(`🧠 *Current personality:*\n\n${personality}`);
        return;
      }
      
      // Clear conversation history
      if (subcommand === 'clear') {
        await clearConversation(chatId);
        await message.reply("🧹 Conversation history cleared! I've forgotten what we were talking about~");
        return;
      }
      
      // Debug: Show session data
      if (subcommand === 'debug' || subcommand === 'session') {
        const data = await getSessionData(chatId);
        
        if (!data) {
          await message.reply("⚠️ Failed to retrieve session data");
          return;
        }
        
        const messageCount = data.messages.length;
        const created = new Date(data.created_at).toLocaleString();
        const updated = new Date(data.updated_at || data.created_at).toLocaleString();
        
        await message.reply(
          `*Session Data*\n` +
          `🆔 Chat ID: ${chatId}\n` +
          `📝 Messages: ${messageCount}\n` +
          `📅 Created: ${created}\n` +
          `🕒 Updated: ${updated}\n`
        );
        return;
      }
    }
    
    // If no matching subcommand, treat as regular chat
    const userText = args.join(' ');
    
    if (!userText) {
      await message.reply("What do you want me to say? Don't waste my time!");
      return;
    }
    
    try {
      const response = await chatWithGemini(userText, chatId);
      await message.reply(response);
    } catch (error) {
      console.error("Error in chat command:", error);
      await message.reply("Something went wrong with my thinking process. Try again later.");
    }
  }
};