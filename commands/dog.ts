import { Message, MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';

/**
 * Dog command
 * Fetches a random dog image and sends it as a sticker
 * Shows typing indicator while processing
 */
export default {
  name: 'dog',
  async execute(message: Message, args: string[]) {
    try {
      // Get the chat object
      const chat = await message.getChat();
      
      // Show typing indicator
      await chat.sendStateTyping();
      
      // Get a random dog image from the API (excluding GIFs)
      const response = await axios.get('https://api.thedogapi.com/v1/images/search?mime_types=jpg,png');
      
      if (!response.data || response.data.length === 0) {
        return message.reply('Sorry, I couldn\'t fetch a dog image right now. Try again later!');
      }
      
      const dogImageUrl = response.data[0].url;
      
      // Download the image
      const mediaResponse = await axios.get(dogImageUrl, {
        responseType: 'arraybuffer'
      });
      
      // Convert to base64 for WhatsApp media
      const mediaData = Buffer.from(mediaResponse.data).toString('base64');
      
      // Create a MessageMedia object
      const media = new MessageMedia('image/jpeg', mediaData, 'random-dog.jpg');
      
      // Send as sticker
      await message.reply(media, undefined, {
        sendMediaAsSticker: true,
        stickerAuthor: "NADHI.DEV-WABOT",
        stickerName: "Cute Doggo"
      });
      
    } catch (error) {
      console.error('Error fetching dog sticker:', error);
      await message.reply('Sorry, something went wrong fetching your dog sticker!');
    }
  }
};