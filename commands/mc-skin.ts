import { Message, MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';

/**
 * Command to get and display a Minecraft player's skin
 */
export default {
  name: 'mc-skin',
  async execute(message: Message, args: string[]) {
    const username = args[0];

    if (!username) {
      return message.reply('Please provide a Minecraft username.');
    }

    try {
      // Show typing indicator
      const chat = await message.getChat();
      await chat.sendStateTyping();

      const skinUrl = `https://starlightskins.lunareclipse.studio/render/ultimate/${username}/full`;
      
      // Download the image
      const response = await axios.get(skinUrl, {
        responseType: 'arraybuffer'
      });
      
      // Convert to base64
      const imageBuffer = Buffer.from(response.data);
      const media = new MessageMedia('image/png', imageBuffer.toString('base64'), `${username}'s Skin`);

      await message.reply(media);
    } catch (error) {
      console.error('Error fetching Minecraft skin:', error);
      await message.reply('Could not fetch the Minecraft skin. Please check the username and try again.');
    }
  }
};