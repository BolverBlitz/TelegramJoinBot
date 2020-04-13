//Include needed jsons
var config = require('./config');
var secret = require('./secret');

//Include some Funktions
const f = require('./src/Funktions');
const OS = require('./src/Hardware');

//Include some modules

const newI18n = require("new-i18n");
const i18n = newI18n(__dirname + "/languages", ["de"]);

//Include complex modules
const Telebot = require('telebot');
const bot = new Telebot({
	token: secret.bottoken,
	limit: 1000,
        usePlugins: ['commandButton']
});

var Time_started = new Date().getTime();

const Links = config.links.split(',');
const Mitte = config.mitte.split(',');
const Rechts = config.rechts.split(',');

bot.start(); //Telegram bot start

//Telegram Errors
bot.on('reconnecting', (reconnecting) => {
	f.log("Lost connection");
	var LastConnectionLost = new Date();
});
bot.on('reconnected', (reconnected) => {
	f.log("connection successfully");
	bot.sendMessage(config.LogChat, "Bot is back online. Lost connection at " + f.getDateTime(LastConnectionLost))
});

//Userimput

bot.on(/^\/alive$/i, (msg) => {
	OS.Hardware.then(function(Hardware) {
		let Output = "";
		Output = Output + '\n- CPU: ' + Hardware.cpubrand + ' ' + Hardware.cpucores + 'x' + Hardware.cpuspeed + ' Ghz';
		Output = Output + '\n- Load: ' + f.Round2Dec(Hardware.load);
		Output = Output + '%\n- Memory Total: ' + f.Round2Dec(Hardware.memorytotal/1073741824) + ' GB'
		Output = Output + '\n- Memory Free: ' + f.Round2Dec(Hardware.memoryfree/1073741824) + ' GB'
			msg.reply.text("Botname: " + config.botname + "\nVersion: " + config.version + "\nUptime: " + f.uptime(Time_started) + "\n\nHardware:" + Output).then(function(msg)
			{
				setTimeout(function(){
				bot.deleteMessage(msg.chat.id,msg.message_id);
				}, config.WTdelmsglong);
            });
             bot.deleteMessage(msg.chat.id, msg.message_id);
	});
});

bot.on('newChatMembers', (msg) => {
	//console.log(msg)

	if ('username' in msg.new_chat_member) {
		var nutzername = msg.new_chat_member.username.toString();
	}else{
		var nutzername = msg.new_chat_member.first_name.toString();
	}


	console.log(msg)
	var UserID = msg.new_chat_member.id.toString();
	var ChatID = msg.chat.id
	UserIDArray = UserID.split('');
	bot.restrictChatMember(ChatID, msg.new_chat_member.id, {canSendMessages: false, canSendMediaMessages: false, cansendpolls: false, canSendOtherMessages: false, canAddWebPagePreviews: false})	
	var MSG = i18n(config.language, "Willkommen", { Nutzername: nutzername }) + "\n"
	MSG = MSG + i18n(config.language, "S")

	if(Links.includes(UserIDArray[UserIDArray.length-1]))
	{
		MSG = i18n(config.language, "Willkommen", { Nutzername: nutzername }) + "\n"
		MSG = MSG + i18n(config.language, "L" + f.getRandomIntNo0(2))
	}
	if(Mitte.includes(UserIDArray[UserIDArray.length-1]))
	{
		MSG = i18n(config.language, "Willkommen", { Nutzername: nutzername }) + "\n"
		MSG = MSG + i18n(config.language, "M" + f.getRandomIntNo0(2))
	}
	if(Rechts.includes(UserIDArray[UserIDArray.length-1]))
	{
		MSG = i18n(config.language, "Willkommen", { Nutzername: nutzername }) + "\n"
		MSG = MSG + i18n(config.language, "R" + f.getRandomIntNo0(2))
	}


	let replyMarkup = bot.inlineKeyboard([
		[
			bot.inlineButton('1', {callback: 'K_eins_'+ UserID}),
			bot.inlineButton('2', {callback: 'K_zwei_'+ UserID}),
			bot.inlineButton('3', {callback: 'K_drei_'+ UserID})
		], [
			bot.inlineButton(i18n(i18n.languages[config.language], "Sofortban"), {callback: 'Ban_' + UserID})
		]
	]);
	bot.sendMessage(ChatID, MSG, {parseMode: 'markdown', replyMarkup});
});



bot.on('callbackQuery', (msg) => {
	//console.log(msg)
	if ('inline_message_id' in msg) {
		var inlineId = msg.inline_message_id;
	}else{
		var chatId = msg.message.chat.id;
		var messageId = msg.message.message_id;
	}
	var userID = msg.from.id.toString();
	UserIDArray = userID.split('');
	var data = msg.data.split("_")
	
	if(data[0] === 'K')
	{
		if(data[2] === UserID){

			bot.answerCallbackQuery(msg.id);

			if(Links.includes(UserIDArray[UserIDArray.length-1]))
			{
				if(data[1] === 'eins')
				{
					bot.deleteMessage(chatId,messageId);
					bot.restrictChatMember(chatId, userID, {canSendMessages: true, canSendMediaMessages: true, cansendpolls: true, canSendOtherMessages: true, canAddWebPagePreviews: true})
				}else{
					console.log("Failed")
				}
			}
			if(Mitte.includes(UserIDArray[UserIDArray.length-1]))
			{
				if(data[1] === 'zwei')
				{
					bot.deleteMessage(chatId,messageId);
					bot.restrictChatMember(chatId, userID, {canSendMessages: true, canSendMediaMessages: true, cansendpolls: true, canSendOtherMessages: true, canAddWebPagePreviews: true})
				}else{
					console.log("Failed")
				}
			}
			if(Rechts.includes(UserIDArray[UserIDArray.length-1]))
			{
				if(data[1] === 'drei')
				{
					bot.deleteMessage(chatId,messageId);
					bot.restrictChatMember(chatId, userID, {canSendMessages: true, canSendMediaMessages: true, cansendpolls: true, canSendOtherMessages: true, canAddWebPagePreviews: true})
				}else{
					console.log("Failed")
				}
			}

		}else{
			bot.answerCallbackQuery(msg.id,{
				text: i18n(config.language, "NichtBenutzer"),
				showAlert: true
			});
		}

	}

	if(data[0] === 'Ban')
	{
		bot.answerCallbackQuery(msg.id);

		if(data[1] === userID){
			bot.deleteMessage(chatId,messageId);
			bot.restrictChatMember(chatId, userID, {canSendMessages: true, canSendMediaMessages: true, cansendpolls: true, canSendOtherMessages: true, canAddWebPagePreviews: true})
		}else{
			bot.getChatAdministrators(chatId).then(function(Admins) {
				if(Admins.includes(msg.from.id)){
					bot.kickChatMember(chatId, data[1])
					bot.deleteMessage(chatId,messageId);
				}else{
					bot.answerCallbackQuery(msg.id,{
						text: i18n(config.language, "NichtBenutzer"),
						showAlert: true
					});
				}
			});
		}
	}

});