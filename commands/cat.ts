import { Message, MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';

/**
 * Cat command
 * Fetches a random cat image and sends it as a sticker
 * Shows typing indicator while processing
 */
export default {
  name: 'cat',
  async execute(message: Message, args: string[]) {
    try {
      // Get the chat object
      const chat = await message.getChat();
      
      // Show typing indicator
      await chat.sendStateTyping();
      
      // Get a random cat image from the API (excluding GIFs)
      const response = await axios.get('https://api.thecatapi.com/v1/images/search?mime_types=jpg,png');
      
      if (!response.data || response.data.length === 0) {
        return message.reply('Sorry, I couldn\'t fetch a cat image right now. Try again later!');
      }
      
      const catImageUrl = response.data[0].url;
      
      // Download the image
      const mediaResponse = await axios.get(catImageUrl, {
        responseType: 'arraybuffer'
      });
      
      // Convert to base64 for WhatsApp media
      const mediaData = Buffer.from(mediaResponse.data).toString('base64');
      
      // Create a MessageMedia object
      const media = new MessageMedia('image/jpeg', mediaData, 'random-cat.jpg');
      
      // Send as sticker
      await message.reply(media, undefined, {
        sendMediaAsSticker: true,
        stickerAuthor: "NADHI.DEV-WABOT",
        stickerName: "Cute Kitty"
      });
      
    } catch (error) {
      console.error('Error fetching cat sticker:', error);
      await message.reply('Sorry, something went wrong fetching your cat sticker!');
    }
  }
};