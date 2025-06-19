import { Message } from 'whatsapp-web.js';

/**
 * Help command
 * 
 * Displays all the commands available and how
 * to use these commands with the bot
 */


module.exports = {
  name: 'help',
  async execute(message: Message, args: string[]) {

    const help = `⚙️ *Available Commands*` + `\n\n🔑 Prefix - !` + `\n` + `!rizz @mentioned user - Rizz a mentioned user\n` + `!super Your-Text-Here - Sends a Supreme logo with the text.\n` + `!echo - echo the text back.\n`
    + `!info - Get debug information about the bot\n` + `!dog -  get a cute sticker of a dog\n` + `!cat - get a cute sticker of a cat\n` + `!halal - get a halal meme sticker\n` + `!mc-skin MC-USERNAME - Gives the minecraft skin on the name entered.\n` + `!mc-server SERVER-IP-ADDRESS - Get information of a minecraft server via IP\n`
    + `!whois mention-user - get information about the mentioned user\n` + `!an YOUR MESSAGE - Annouce a message to all group members\n` + `!remind <TIME=|10S|1M|2d|> - Set a reminder for said ammount of time.`
    
    await message.reply(help);
  }
};