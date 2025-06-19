import { Message } from 'whatsapp-web.js';
import axios from 'axios';
import { log } from '../base/log';

/**
 * Minecraft server status command
 * This command checks the status of a Minecraft server using an external API.
 * It provides information about the server's online status, player count, version, and MOTD
 */

/**
 * Interface for Minecraft server status API response
 */
interface McServerResponse {
  online: boolean;
  players: {
    now: number;
    max: number;
  };
  server: {
    name: string;
    protocol: number;
  };
  motd: string;
  version: string;
}

/**
 * Command to check a Minecraft server's status
 */
export default {
  name: 'mc-server',
  async execute(message: Message, args: string[]) {
    const serverIp = args[0];

    if (!serverIp) {
      return message.reply('Please provide a Minecraft server IP address.');
    }

    try {
      // Show typing indicator
      const chat = await message.getChat();
      await chat.sendStateTyping();

      const response = await axios.get<McServerResponse>(`https://mcapi.us/server/status?ip=${serverIp}`);
      const data = response.data;

    log(`Received Minecraft server status for ${serverIp}:`);
   // log(JSON.stringify(data, null, 2));


      if (data.online) {
        const replyMessage = `🌟 *Minecraft Server Status: ${serverIp}*\n\n` +
                            `✅ *Status:* Online\n` +
                            `👥 *Players:* ${data.players.now}/${data.players.max}\n` + 
                            `🎮 *Server Type:* ${data.server.name || 'Unknown'}\n` +
                            `📝 *MOTD:* ${data.motd || 'The best minecraft server!'}`;
        
        await message.reply(replyMessage);
      } else {
        await message.reply(`😞 The Minecraft server at ${serverIp} is offline.`);
      }
    } catch (error) {
      console.error('Error checking Minecraft server status:', error);
      await message.reply('Could not check the server status. Please try again later.');
    }
  }
};