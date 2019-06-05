
const fs = require('fs');
	//require discord.js module
const Discord = require('discord.js');
//create new discord client
const client = new Discord.Client();
const snekfetch = require('snekfetch');

var config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

const yt_api_key = config.yt_api_key;
const prefix = config.prefix;
const token = config.token;
const trim = (str, max) => (str.length > max) ? `${str.slice(0, max - 3)}...` : str;
client.commands = new Discord.Collection();
const ytdl = require("ytdl-core");
const request = require("request");
const getYouTubeID = require("get-youtube-id");
const fetchVideoInfo = require("youtube-info");
const delay = require('delay');
//dynamically retrieves all new command files
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for(const file of commandFiles){
	const command = require(`./commands/${file}`);
	// make new item in collection, key as command name and value as module
	client.commands.set(command.name, command);
}



var guilds = {};
var subbed = ['Hanayome', 'Okarishimasu', 'Domestic', 'Study', 'Tales', 'Heroine', 'Kaguya', 'Gokushufudou', 'Wonder', 'Yuusha', 'Slightly', 'Tonikaku', 'Sankaku'];


client.login(token);
client.on('message', function(message) {
    const member = message.member;
    const mess = message.content.toLowerCase();
    const args = message.content.split(' ').slice(1).join(" ");

    if (!guilds[message.guild.id]) {
        guilds[message.guild.id] = {
            queue: [],
            queueNames: [],
            isPlaying: false,
            dispatcher: null,
            voiceChannel: null,
            skipReq: 0,
            skippers: []
        };
    }

    if (mess.startsWith(prefix + "play")) {
        if (message.member.voiceChannel || guilds[message.guild.id].voiceChannel != null) {
            if (guilds[message.guild.id].queue.length > 0 || guilds[message.guild.id].isPlaying) {
                getID(args, function(id) {
                    add_to_queue(id, message);
                    fetchVideoInfo(id, function(err, videoInfo) {
                        if (err) throw new Error(err);
                        message.reply(" added to queue: **" + videoInfo.title + "**");
                        guilds[message.guild.id].queueNames.push(videoInfo.title);
                    });
                });
            } else {
                isPlaying = true;
                getID(args, function(id) {
                    guilds[message.guild.id].queue.push(id);
                    playMusic(id, message);
                    fetchVideoInfo(id, function(err, videoInfo) {
                        if (err) throw new Error(err);
                        guilds[message.guild.id].queueNames.push(videoInfo.title);
                        message.reply(" now playing: **" + videoInfo.title + "**");
                    });
                });
            }
        } else {
            message.reply(" you need to be in a voice channel!");
        }
    } else if (mess.startsWith(prefix + "skip")) {
        if (guilds[message.guild.id].skippers.indexOf(message.author.id) === -1) {
            guilds[message.guild.id].skippers.push(message.author.id);
            guilds[message.guild.id].skipReq++;
            if (guilds[message.guild.id].skipReq >= Math.ceil((guilds[message.guild.id].voiceChannel.members.size - 1) / 2)) {
                skip_song(message);
                message.reply(" your skip has been acknowledged. Skipping now!");
            } else {
                message.reply(" your skip has been acknowledged. You need **" + Math.ceil((guilds[message.guild.id].voiceChannel.members.size - 1) / 2) - guilds[message.guild.id].skipReq) = "**  more skip votes!";
            }
        } else {
            message.reply(" you already voted to skip!");
        }
    } else if (mess.startsWith(prefix + "queue")) {
        var message2 = "```";
        for (var i = 0; i < guilds[message.guild.id].queueNames.length; i++) {
            var temp = (i + 1) + ": " + guilds[message.guild.id].queueNames[i] + (i === 0 ? "**(Current Song)**" : "") + "\n";
            if ((message2 + temp).length <= 2000 - 3) {
                message2 += temp;
            } else {
                message2 += "```";
                message.channel.send(message2);
                message2 = "```";
            }
        }
        message2 += "```";
        message.channel.send(message2);
    }

});

//when the client is ready, run this code
//triggers when bot finishes logging in or recoonects after DC
client.on('ready', () =>{
    console.log('Ready!');
      client.user.setPresence({ status: 'online', game: { name: '!help' } }); 
    //var channel = client.channels.get('477164009754198029');
    //channel.send('The tempest is at your command.');
});
client.on('guildMemberAdd', member => {
	const channel = member.guild.channels.find(ch => ch.name === 'member-log');
	if(!channel) return;
	channel.send(`Welcome to Antarctica, ${member}`);
});
client.on('message',  message =>{
	//new argument based message checking
	if(message.content === 'that\'s so sad'){
		message.channel.send('Alexa play despacito.');
		message.channel.send('!play https://www.youtube.com/watch?v=kJQP7kiw5Fk');
	}
	if(!message.content.startsWith(prefix) || message.author.bot) return;
	const args = message.content.slice(prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();
	if(!client.commands.has(commandName)) return;
	const command = client.commands.get(commandName);
	try{
		command.execute(message,args);
	}
	catch(error){
		console.error(error);
		message.reply('there was an error trying to execute that command.');
	}
});
client.on('message', async message =>{
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();
	if (command === 'cat') {
		const { body } = await snekfetch.get('https://aws.random.cat/meow');

		message.channel.send(body.file);
	}
	else if (command === 'subscribe'){
		subbed.push(args[0]);
	}
	else if( command === 'manga'){
		const {body} = await snekfetch.get('https://reddit.com/r/manga/new/.json');
		var ID = body.data.children[24].data.id;
		var title = '';
		var last = body.data.children[24].data.id;
		while (true){
			//if(last !== ID){
			//	ID = last;
			//}
			try{
			const {body} = await snekfetch.get('https://reddit.com/r/manga/new/.json?before=t3_'+ ID);
			console.log(ID);
			console.log(body.data.dist);
			for(var i = body.data.dist - 1; i >= 0; i--){
				title = body.data.children[i].data.title;
				console.log(title);
				var arrayLength = subbed.length;
				if(title.includes('[DISC]') || title.includes('[Disc]')){
					for(var j = 0; j < arrayLength; j++){
						if(title.includes(subbed[j]) || title.toLowerCase().includes(subbed[j].toLowerCase())){
							console.log('found');
							const embed = new Discord.RichEmbed()
								.setTitle(body.data.children[i].data.title)
								.setColor(0xFFFFFF)
								.setURL(body.data.children[i].data.url);
							message.channel.send(embed);
						}
					}
				}
				ID = body.data.children[i].data.id;
			}
			
			await delay(60000);
			if(true){
				const{body} = await snekfetch.get('https://reddit.com/r/manga/new/.json?before=t3_'+ID);
				if(body.data.dist === 0){
					const{body} = await snekfetch.get('https://reddit.com/r/manga/new/.json');
					ID = body.data.children[0].data.id;
				}
			}
			}
			catch(err){
			}
		}
	}
	else if ( command === 'subbed'){
		message.channel.send(subbed.toString());
	
	}
	else if( command === 'waifus'){
		//const {body} = await snekfetch.get('https://reddit.com/user/EyeOfTheStormLoL/m/animebot/top/.json?t=day');
		var cache = [];
		var title = '';
		var remove = '';
		while (true){
			const {body} = await snekfetch.get('https://reddit.com/user/EyeOfTheStormLoL/m/animebot/top/.json?t=day&limit=100');
			for(var i = 0; i < 96; i++){
				title = body.data.children[i].data.url;
				remove = body.data.children[i].data.title;
				remove = remove.replace('&amp;', '&');
				if(title.includes('https://imgur')){
					title = title + '.gif';
				}
				if(title.length<256 && !cache.includes(title)){
					const embed = new Discord.RichEmbed()
						.setTitle(remove)
						.setColor(0xFFFFFF)
						.setDescription(body.data.children[i].data.subreddit)
						.setImage(title);
					if(title.includes('imgur') || title.includes('i.redd.it') ||title.includes('awwni.me') || title.includes('catgirlsare')){
						message.channel.send(embed);
					}
					else{
						message.channel.send(title);
					}
					cache.push(title);
					if(cache.length > 100){
						cache.shift();
					}
				}
				else if( !cache.includes(title)){
					message.channel.send(title);
					cache.push(title);
					if(cache.length > 100){
						cache.shift();
					}
				}
				await delay(900000);
			}
		}
	}
	else if( command === 'hentai'){
		//const {body} = await snekfetch.get('https://reddit.com/user/EyeOfTheStormLoL/m/animebot/top/.json?t=day');
		var cache = [];
		var title = '';
		var remove = '';
		while (true){
			const {body} = await snekfetch.get('https://reddit.com/user/EyeOfTheStormLoL/m/animebot2/top/.json?t=day&limit=100');
			for(var i = 0; i < 96; i++){
				title = body.data.children[i].data.url;
				remove = body.data.children[i].data.title;
				remove = remove.replace('&amp;', '&');
				if(title.includes('https://imgur')){
					title = title + '.gif';
				}
				if(title.length<256 && !cache.includes(title)){
					const embed = new Discord.RichEmbed()
						.setTitle(remove)
						.setColor(0xFFFFFF)
						.setDescription(body.data.children[i].data.subreddit)
						.setImage(title);
					if(title.includes('imgur') || title.includes('i.redd.it') ||title.includes('awwni.me') || title.includes('catgirlsare')){
						message.channel.send(embed);
					}
					else{
						message.channel.send(title);
					}
					cache.push(title);
					if(cache.length > 100){
						cache.shift();
					}
				}
				else if( !cache.includes(title)){
					message.channel.send(title);
					cache.push(title);
					if(cache.length > 100){
						cache.shift();
					}
				}
				await delay(900000);
			}
		}
	}
	else if( command === 'memes'){
		//const {body} = await snekfetch.get('https://reddit.com/user/EyeOfTheStormLoL/m/animebot/top/.json?t=day');
		var cache = [];
		var title = '';
		var remove = '';
		while (true){
			const {body} = await snekfetch.get('https://reddit.com/user/EyeOfTheStormLoL/m/animebot3/top/.json?t=day&limit=100');
			for(var i = 0; i < 96; i++){
				title = body.data.children[i].data.url;
				remove = body.data.children[i].data.title;
				remove = remove.replace('&amp;', '&');
				if(title.includes('https://imgur')){
					title = title + '.gif';
				}
				if(title.length<256 && !cache.includes(title)){
					const embed = new Discord.RichEmbed()
						.setTitle(remove)
						.setColor(0xFFFFFF)
						.setDescription(body.data.children[i].data.subreddit)
						.setImage(title);
					if(title.includes('imgur') || title.includes('i.redd.it') ||title.includes('awwni.me') || title.includes('catgirlsare')){
						message.channel.send(embed);
					}
					else{
						message.channel.send(title);
					}
					cache.push(title);
					if(cache.length > 100){
						cache.shift();
					}
				}
				else if( !cache.includes(title)){
					message.channel.send(title);
					cache.push(title);
					if(cache.length > 100){
						cache.shift();
					}
				}
				await delay(900000);
			}
		}
	}
	else if( command === 'r/'){
		if(!args.length){
			return message.channel.send('You need to supply a subreddit.');
		}
		const {body} = await snekfetch.get('https://reddit.com/r/' + args[0] +'/random.json');
		message.channel.send(body[0].data.children[0].data.url);
	}
	else if (command === 'optin'){
		let role = message.guild.roles.find(r => r.name === "uwu");
		let member = message.member;
		member.addRole(role).catch(console.error);
	}
	else if (command === 'optout'){
		let role = message.guild.roles.find(r => r.name === "uwu");
		let member = message.member;
		member.removeRole(role).catch(console.error);
	}
	else if (command === 'topof'){
		if(!args.length){
			return message.channel.send('You need to supply a subreddit.');
		}
		var postID = '';
		for(var i = 0; i < 100; i++){
			const {body} = await snekfetch.get('https://reddit.com/r/' + args[0] + '/top/.json?t=all&limit=100');
			const embed = new Discord.RichEmbed()
				.setTitle(body.data.children[i].data.title)
				.setColor(0xFFFFFF)
				.setDescription(args[0])
				.setImage(body.data.children[i].data.url);
			var thing = body.data.children[i].data.url;
			if(thing.includes('gfycat')){
				message.channel.send(thing);
			}		
			else{
				message.channel.send(embed);
			}
			await delay (800000);
			postID = body.data.children[i].data.id;
		}
		for(var j = 0; j < 100; j++){
	
			for(var i = 0; i < 25; i++){
			const {body} = await snekfetch.get('https://reddit.com/r/' + args[0] + 'top/.json?t=all&after=t3_'+ postID);
			const embed = new Discord.RichEmbed()
				.setTitle(body.data.children[i].data.title)
				.setColor(0xFFFFFF)
				.setImage(body.data.children[i].data.url)
				.setDescription(args[0]);
			var thing = body.data.children[i].data.url;
			if(thing.includes('gfycat')){
				message.channel.send(thing);
			}
			else{
				message.channel.send(embed);
			}
			message.channel.send(embed);
			
			await delay (800000);
			postID = body.data.children[i].data.id;
		}
		}
	
	}
					
	else if( command === 'urban'){
		if(!args.length){
			return message.channel.send('You need to supply a search term.');
		}
		const { body} = await snekfetch.get('https://api.urbandictionary.com/v0/define').query({term: args.join(' ') });
		if(!body.list.length) {
			return message.channel.send(`No results found for **${args.join(' ')}**.`);
		}
		message.channel.send(body.list[0].definition);
		const [answer] = body.list;

		const embed = new Discord.RichEmbed()
			.setColor('#EFFF00')
			.setTitle(answer.word)
			.setURL(answer.permalink)
			.addField('Definition', trim(answer.definition, 1024))
			.addField('Example', trim(answer.example, 1024))
			.addField('Rating', `${answer.thumbs_up} thumbs up, ${answer.thumbs_down} thumbs down.`);
		message.channel.send(embed);
		
	}
});
client.on('typingStart',(channel,user) => console.log(`${user.username} started typing in ${channel.name}`));
client.on('message', message => console.log(`${message.author.username} sent ${message.content}`));
function skip_song(message) {
    guilds[message.guild.id].dispatcher.end();
}

function playMusic(id, message) {
    guilds[message.guild.id].voiceChannel = message.member.voiceChannel;
    guilds[message.guild.id].voiceChannel.join().then(function(connection) {
        stream = ytdl("https://www.youtube.com/watch?v=" + id, {
            filter: 'audioonly'
        });
        guilds[message.guild.id].skipReq = 0;
        guilds[message.guild.id].skippers = [];

        guilds[message.guild.id].dispatcher = connection.playStream(stream);
        guilds[message.guild.id].dispatcher.on('end', function() {
            guilds[message.guild.id].skipReq = 0;
            guilds[message.guild.id].skippers = [];
            guilds[message.guild.id].queue.shift();
            guilds[message.guild.id].queueNames.shift();
            if (guilds[message.guild.id].queue.length === 0) {
                guilds[message.guild.id].queue = [];
                guilds[message.guild.id].queueNames = [];
                guilds[message.guild.id].isPlaying = false;
            } else {
                setTimeout(function() {
                    playMusic(guilds[message.guild.id].queue[0], message);
                }, 5);
            }
        });
    });
}

function getID(str, cb) {
    if (isYoutube(str)) {
        cb(getYouTubeID(str));
    } else {
        search_video(str, function(id) {
            cb(id);
        });
    }
}

function add_to_queue(strID, message) {
    if (isYoutube(strID)) {
        guilds[message.guild.id].queue.push(getYouTubeID(strID));
    } else {
        guilds[message.guild.id].queue.push(strID);
    }
}

function search_video(query, callback) {
    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + yt_api_key, function(error, response, body) {
        var json = JSON.parse(body);
        if (!json.items[0]) callback("3_-a9nVZYjk");
        else {
            callback(json.items[0].id.videoId);
        }
    });
}

function isYoutube(str) {
    return str.toLowerCase().indexOf("youtube.com") > -1;
}
