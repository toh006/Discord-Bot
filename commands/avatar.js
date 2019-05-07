module.exports = {
	name: 'avatar',
	description: 'Shows a full size image of any user\'s avatar',
	execute(message, args) {
		if(!message.mentions.users.size) { // size = 0 if no user mentioned
			return message.channel.send(`Your avatar: ${message.author.displayAvatarURL}`);
		}
		const avatarList = message.mentions.users.map( user => {
			return `${user.username}\'s avatar: ${user.displayAvatarURL}`;
		});
		message.channel.send(avatarList);
	},
};
