import { Message, Contact } from 'whatsapp-web.js';

/**
 * Rizz command
 * Sends a flirty pickup line to a mentioned user
 */
export default {
  name: 'rizz',
  async execute(message: Message, args: string[]) {
    try {
      // Get the chat
      const chat = await message.getChat();
      
      // Get mentioned contacts
      const mentions = await message.getMentions();
      
      if (mentions.length === 0) {
        return message.reply('You need to mention someone to rizz them up! 😉');
      }
      
      // Get the first mentioned contact
      const mentionedContact = mentions[0];
      const mentionedName = mentionedContact.pushname || mentionedContact.name || 'them';
      
      // Get a random rizz line
      const rizzLine = getRizzLine(mentionedName);
      
      // According to docs, we need to ensure the message has proper mention formatting
      // The @ symbol must be present with the exact contact ID or phone number
      let formattedRizzLine = rizzLine;
      
      // Create the message with mention
      await chat.sendMessage(formattedRizzLine, {
        //@ts-ignore
        mentions: [mentionedContact]
      });
      
    } catch (error) {
      console.error('Error in rizz command:', error);
      await message.reply('Failed to rizz. My rizz game crashed. 😔');
    }
  }
};

/**
 * Returns a random rizz line with the person's name inserted
 * @param name The name to insert into the rizz line
 */
function getRizzLine(name: string): string {
  const rizzLines = [
    `Are you made of copper and tellurium? Because you're Cu-Te, ${name}! 😉`,
    `${name}, if you were a vegetable, you'd be a cute-cumber! 🥒✨`,
    `Are you a parking ticket, ${name}? Because you've got FINE written all over you. 💯`,
    `${name}, do you have a map? I keep getting lost in your eyes. 🗺️👀`,
    `I must be a snowflake, because I've fallen for you, ${name}. ❄️`,
    `Is your name Google, ${name}? Because you have everything I'm searching for. 🔍`,
    `${name}, are you a camera? Because every time I look at you, I smile! 📸`,
    `Do you have a name or can I call you mine, ${name}? 📞`,
    `${name}, are you a magician? Because whenever I look at you, everyone else disappears. ✨`,
    `Is your dad a boxer, ${name}? Because you're a knockout! 🥊`,
    `Do you believe in love at first sight, ${name}, or should I walk by again? 🚶‍♂️`,
    `${name}, if you were a fruit, you'd be a fine-apple! 🍍`,
    `I think there's something wrong with my phone, ${name}. Your number's not in it! 📱`,
    `${name}, are you a bank loan? Because you have my interest! 💰`,
    `If you were a vegetable, ${name}, you'd be a sweet-potato! 🍠`,
    `${name}, are you from Tennessee? Because you're the only 10 I see! 🔟`,
    `I'd say God bless you, ${name}, but it looks like he already did. 😇`,
    `${name}, I must be a mathematician because I'm trying to find the value of U! 🧮`,
    `Are you a campfire, ${name}? Because you're hot and I want s'more! 🔥`,
    `${name}, is your name Wi-Fi? Because I'm feeling a connection! 📶`
  ];
  
  // Get a random line
  const randomIndex = Math.floor(Math.random() * rizzLines.length);
  return rizzLines[randomIndex];
}