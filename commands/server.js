module.exports = {
	name:'server',
	description: 'Prints out server information.',
	execute(message, args){
		message.channel.send(`Server name: ${message.guild.name}\nTotal members: ${message.guild.memberCount}`);
	},
};
