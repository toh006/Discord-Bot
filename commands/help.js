const { prefix } = require('../config.json');
module.exports = {
	name: 'help',
	descrption: 'List all of my commands or information about a specific command',
	usage: '[command name]',
	cooldown: 10,
	execute(message, args){
		const data = [];
		const { commands } = message.client;
		if(!args.length){
			data.push('Here\'s a list of all my commands:');
			data.push(commands.map(command => command.name).join(', '));
			data.push(`\nYou can send \`${prefix}help [command name]\` to get info on a specific command.`);
			return message.reply(data, { split: true});
		}
		const name = args[0].toLowerCase();
		const command = commands.get(name);

		if(!command) {
			return message.reply('That\'s not a valid command.');
		}
		data.push(`**Name: ** ${command.name}`);
	
		if (command.description) data.push(`**Description:** ${command.description}`);
		if (command.usage) data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);

		message.channel.send(data, {split: true});
	},
};
