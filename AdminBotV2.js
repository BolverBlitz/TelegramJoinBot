//Include needed jsons
var config = require('./config');
var secret = require('./secret');
var permsJson = require("./data/permissionsList");
var ReasonsList = require('./Reasons');
var ReasonsListFlip = swap(ReasonsList);

//Include some Funktions
const f = require('./src/Funktions');
const OS = require('./src/Hardware');
const AntiSpam = require('./src/Antispam');
const SW = require("./src/MultiSpamWatch.js");
const perms = require("./src/Permissions");

//Include some modules

const newI18n = require("new-i18n");
const i18n = newI18n(__dirname + "/languages", ["de","en"], "de");

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

function swap(json){
	var ret = {};
	for(var key in json){
	  ret[json[key]] = key;
	}
	return ret;
  }

//START CACHEING!!!
SW.Cache().then(function() {
	bot.start(); //Telegram bot start
});

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

bot.on(/^\/check$/i, (msg) => {
	bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => f.Elog('Error: (delMessage)', error.description));

	if ('reply_to_message' in msg) {
		var UserID = msg.reply_to_message.from.id
		if ('username' in msg.reply_to_message.from) {
			var username = msg.reply_to_message.from.username.toString();
		}else{
			var username = msg.reply_to_message.from.first_name.toString();
		}
	}else{
		var UserID = msg.from.id
		if ('username' in msg.from) {
			var username = msg.from.username.toString();
		}else{
			var username = msg.from.first_name.toString();
		}
	}

	Promise.all([SW.getBan(UserID, 0),SW.getBan(UserID, 1), SW.getBan(UserID, 2), AntiSpam.checkUserCAS(UserID), AntiSpam.checkUserspamprotection(UserID)]).then(function(PAll) {
	//Promise.all([SW.getBan(UserID, 0),SW.getBan(UserID, 1), SW.getBan(UserID, 2), AntiSpam.checkUserCAS(UserID)]).then(function(PAll) {
		let BanMSGState = "";
		PAll.map(bool => {
			console.log(bool)
			if(bool.state === true){
				if(bool.reason.startsWith("0x")){
					BanMSGState += `\nReason ${bool.antispam}: ${ReasonsListFlip[bool.reason]}` //Flip back to human readable reason
				}else{
					BanMSGState += `\nReason ${bool.antispam}: ${bool.reason}`
				}
			}
		});
		bot.sendMessage(msg.chat.id, i18n(config.language, "AntiSpamCheck", { Nutzername: username, Spamwatch: f.ConvertBoolToEmoji(PAll[0].state), EBGWatch: f.ConvertBoolToEmoji(PAll[1].state), BolverWatch: f.ConvertBoolToEmoji(PAll[2].state), CAS:f.ConvertBoolToEmoji(PAll[3].state), spamprotection: f.ConvertBoolToEmoji(PAll[4].state)}) + BanMSGState, {webPreview: false})
		//bot.sendMessage(msg.chat.id, i18n(config.language, "AntiSpamCheck", { Nutzername: username, Spamwatch: f.ConvertBoolToEmoji(PAll[0].state), EBGWatch: f.ConvertBoolToEmoji(PAll[1].state), BolverWatch: f.ConvertBoolToEmoji(PAll[2].state), CAS:f.ConvertBoolToEmoji(PAll[3].state), spamprotection: "OFFLINE"}) + BanMSGState, {webPreview: false})
	});
});

bot.on(/^\/alive$/i, (msg) => {
	console.log(msg)
	OS.Hardware.then(function(Hardware) {
		let Output = "";
		Output = Output + '\n- CPU: ' + Hardware.cpubrand + ' ' + Hardware.cpucores + 'x' + Hardware.cpuspeed + ' Ghz';
		Output = Output + '\n- Load: ' + f.Round2Dec(Hardware.load);
		Output = Output + '%\n- Memory Total: ' + f.Round2Dec(Hardware.memorytotal/1073741824) + ' GB'
		Output = Output + '\n- Memory Free: ' + f.Round2Dec(Hardware.memoryfree/1073741824) + ' GB'
			msg.reply.text("Botname: " + config.botname + "\nVersion: " + config.version + "\nUptime: " + f.uptime(Time_started) + "\n\nHardware:" + Output).then(function(msg)
			{
				setTimeout(function(){
				bot.deleteMessage(msg.chat.id,msg.message_id).catch(error => f.Elog('Error: (delMessage)', error.description));
				}, config.WTdelmsglong);
            });
             bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => f.Elog('Error: (delMessage)', error.description));
	});
});

bot.on(/^\/activate$/i, (msg) => {
	
});

bot.on('newChatMembers', (msg) => {
	var UserID = msg.new_chat_member.id.toString();
	var ChatID = msg.chat.id
	UserIDArray = UserID.split('');
	//Promise.all([SW.getBan(UserID, 0),SW.getBan(UserID, 1), SW.getBan(UserID, 2), AntiSpam.checkUserCAS(UserID), AntiSpam.checkUserspamprotection(UserID)]).then(function(PAll) {
	Promise.all([SW.getBan(UserID, 0),SW.getBan(UserID, 1), SW.getBan(UserID, 2)]).then(function(PAll) {

		if ('username' in msg.new_chat_member) {
			var nutzername = msg.new_chat_member.username.toString();
		}else{
			var nutzername = msg.new_chat_member.first_name.toString();
		}

		bot.restrictChatMember(ChatID, msg.new_chat_member.id, {canSendMessages: false, canSendMediaMessages: false, cansendpolls: false, canSendOtherMessages: false, canAddWebPagePreviews: false}).catch(error => {
			f.log('Keine Rechte um den Nutzer zu restricten');
			console.log(error) 
			var MSG = i18n(config.language, "WillkommenError", { Nutzername: nutzername })
			bot.sendMessage(ChatID, MSG, {parseMode: 'markdown'}).catch(error => f.Elog('Error: (SendMessage)', error.description));
		});
		
		let StateIF = false;
		let BanMSGState = "";
		PAll.map(bool => {
			if(bool.state === true){
				StateIF = true;
				BanMSGState += `${bool.antispam}: ${f.ConvertBoolToEmoji(bool.state)}\n`
			}
		});

		if(StateIF === true){
			let replyMarkup = bot.inlineKeyboard([
				[
					bot.inlineButton(i18n(config.language, "UnlockKnopf"), {callback: 'Unlock_' + UserID})
				]
			]);
			var MSG = `${i18n(config.language, "AntispamBan", { Nutzername: nutzername })}${BanMSGState}`
			bot.sendMessage(ChatID, MSG, {parseMode: 'markdown', replyMarkup}).catch(error => f.Elog('Error: (SendMessage)', error.description));
		}else{

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
					bot.inlineButton(i18n(config.language, "BanKnopf"), {callback: 'Ban_' + UserID})
				]
			]);
			bot.sendMessage(ChatID, MSG, {parseMode: 'html', replyMarkup}).catch(error => console.log(error));
			}
	}).catch(error => f.Elog('Error: (Antispam)', error.description));
});

//Strukture
//Funktion_UnterFunktion_UserID_Parameter
bot.on('callbackQuery', (msg) => {
	//console.log(msg.data)
	if ('inline_message_id' in msg) {
		var inlineId = msg.inline_message_id;
	}else{
		var chatId = msg.message.chat.id;
		var messageId = msg.message.message_id;
	}
	var userID = msg.from.id.toString();
	UserIDArray = userID.split('');
	var data = msg.data.split("_")

	if(data[0] === 'Unlock')
	{
		bot.getChatAdministrators(chatId).then(function(Admins) {
			AdminArray = [];
			for(i in Admins){
				AdminArray.push(Admins[i].user.id)
			}
			if(AdminArray.includes(msg.from.id)){
				bot.answerCallbackQuery(msg.id);
				bot.restrictChatMember(chatId, data[1], {canSendMessages: true, canSendMediaMessages: true, cansendpolls: true, canSendOtherMessages: true, canAddWebPagePreviews: true})
				bot.deleteMessage(chatId,messageId);
			}else{
				bot.answerCallbackQuery(msg.id,{
					text: i18n(config.language, "NichtBenutzer"),
					showAlert: true
				});
			}
		});
	}
	
	if(data[0] === 'K')
	{
		if(data[2] === userID){

			bot.answerCallbackQuery(msg.id);

			if(Links.includes(UserIDArray[UserIDArray.length-1]))
			{
				if(data[1] === 'eins')
				{
					bot.deleteMessage(chatId,messageId);
					bot.restrictChatMember(chatId, userID, {canSendMessages: true, canSendMediaMessages: true, cansendpolls: true, canSendOtherMessages: true, canAddWebPagePreviews: true})
				}else{
					let replyMarkup = bot.inlineKeyboard([
						[
							bot.inlineButton(i18n(config.language, "UnlockKnopf"), {callback: 'Unlock_' + data[2]})
						]
					]);

					var MSG = `${i18n(config.language, "FalscherKnopf", { Nutzername: `${data[2]}` })}`

					if ('inline_message_id' in msg) {
						bot.editMessageText(
							{inlineMsgId: inlineId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}else{
						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}
				}
			}
			if(Mitte.includes(UserIDArray[UserIDArray.length-1]))
			{
				if(data[1] === 'zwei')
				{
					bot.deleteMessage(chatId,messageId);
					bot.restrictChatMember(chatId, userID, {canSendMessages: true, canSendMediaMessages: true, cansendpolls: true, canSendOtherMessages: true, canAddWebPagePreviews: true})
				}else{
					let replyMarkup = bot.inlineKeyboard([
						[
							bot.inlineButton(i18n(config.language, "UnlockKnopf"), {callback: 'Unlock_' + data[2]})
						]
					]);

					var MSG = `${i18n(config.language, "FalscherKnopf", { Nutzername: `${data[2]}` })}`

					if ('inline_message_id' in msg) {
						bot.editMessageText(
							{inlineMsgId: inlineId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}else{
						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}
				}
			}
			if(Rechts.includes(UserIDArray[UserIDArray.length-1]))
			{
				if(data[1] === 'drei')
				{
					bot.deleteMessage(chatId,messageId);
					bot.restrictChatMember(chatId, userID, {canSendMessages: true, canSendMediaMessages: true, cansendpolls: true, canSendOtherMessages: true, canAddWebPagePreviews: true})
				}else{
					let replyMarkup = bot.inlineKeyboard([
						[
							bot.inlineButton(i18n(config.language, "UnlockKnopf"), {callback: 'Unlock_' + data[2]})
						]
					]);

					var MSG = `${i18n(config.language, "FalscherKnopf", { Nutzername: `${data[2]}` })}`

					if ('inline_message_id' in msg) {
						bot.editMessageText(
							{inlineMsgId: inlineId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}else{
						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}
				}
			}
			if(config.rest === UserIDArray[UserIDArray.length-1])
			{
				let replyMarkup = bot.inlineKeyboard([
					[
						bot.inlineButton(i18n(config.language, "UnlockKnopf"), {callback: 'Unlock_' + data[2]})
					]
				]);

				var MSG = `${i18n(config.language, "FalscherKnopf", { Nutzername: `${data[2]}` })}`

				if ('inline_message_id' in msg) {
					bot.editMessageText(
						{inlineMsgId: inlineId}, MSG,
						{parseMode: 'markdown', webPreview: false, replyMarkup}
					).catch(error => console.log('Error:', error));
				}else{
					bot.editMessageText(
						{chatId: chatId, messageId: messageId}, MSG,
						{parseMode: 'markdown', webPreview: false, replyMarkup}
					).catch(error => console.log('Error:', error));
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

		if(UserIDArray[UserIDArray.length-1] === config.rest){
			if(data[1] === userID){
				bot.answerCallbackQuery(msg.id);
				bot.deleteMessage(chatId,messageId);
				bot.restrictChatMember(chatId, userID, {canSendMessages: true, canSendMediaMessages: true, cansendpolls: true, canSendOtherMessages: true, canAddWebPagePreviews: true})
			}
		}else{
			bot.getChatAdministrators(chatId).then(function(Admins) {
				AdminArray = [];
				for(i in Admins){
					AdminArray.push(Admins[i].user.id)
				}
				if(AdminArray.includes(msg.from.id)){
					bot.answerCallbackQuery(msg.id);
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

	if(data[0] === 'gban')
	{
		if(data[2] === userID){
			bot.answerCallbackQuery(msg.id);
			if(data[1] === 'ban')
			{
				perms.permissions(data[3]).then(function(Permissions) {
					if(Permissions != permsJson.Admin){
						let MSG = `Select the ban reason!`
						let replyMarkup = bot.inlineKeyboard([
							[
								bot.inlineButton('Scam', {callback: `gban_reason_${data[2]}_${data[3]}_${data[4]}_scam`}),
								bot.inlineButton('Spam', {callback: `gban_reason_${data[2]}_${data[3]}_${data[4]}_spam`}),
								bot.inlineButton('Crypto', {callback: `gban_reason_${data[2]}_${data[3]}_${data[4]}_Crypto`})
							],[
								bot.inlineButton('PMSpam', {callback: `gban_reason_${data[2]}_${data[3]}_${data[4]}_pmspam`}),
								bot.inlineButton('Porn', {callback: `gban_reason_${data[2]}_${data[3]}_${data[4]}_porn`})
							],[
								bot.inlineButton('Kriminalamt', {callback: `gban_reason_${data[2]}_${data[3]}_${data[4]}_kriminalamt`})
							]
						]);
						if ('inline_message_id' in msg) {
							bot.editMessageText(
								{inlineMsgId: inlineId}, MSG,
								{parseMode: 'markdown', webPreview: false, replyMarkup}
							).catch(error => console.log('Error:', error));
						}else{
							bot.editMessageText(
								{chatId: chatId, messageId: messageId}, MSG,
								{parseMode: 'markdown', webPreview: false, replyMarkup}
							).catch(error => console.log('Error:', error));
						}
					}else{
						let MSG = `Why do you even try to ban a Bot Admin...\nThis is not possible!`
						let replyMarkup = bot.inlineKeyboard([
							[
								bot.inlineButton('Back', {callback: `menu_gban_${data[2]}_${data[3]}_${data[4]}`})
							]
						]);
						if ('inline_message_id' in msg) {
							bot.editMessageText(
								{inlineMsgId: inlineId}, MSG,
								{parseMode: 'markdown', webPreview: false, replyMarkup}
							).catch(error => console.log('Error:', error));
						}else{
							bot.editMessageText(
								{chatId: chatId, messageId: messageId}, MSG,
								{parseMode: 'markdown', webPreview: false, replyMarkup}
							).catch(error => console.log('Error:', error));
						}
					}
				});
			}
			if(data[1] === 'unban')
			{
				let replyMarkup = bot.inlineKeyboard([
					[
						bot.inlineButton('Back', {callback: `menu_gban_${data[2]}_${data[3]}_${data[4]}`})
					]
				]);

				let MSG = `${data[4]}(${data[3]}) was unbaned in BolverWatch`
				SW.remBan(data[3], 2).then(function(remBan){
					if ('inline_message_id' in msg) {
						bot.editMessageText(
							{inlineMsgId: inlineId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}else{
						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}
				});

			}
			if(data[1] === 'check')
			{
				Promise.all([SW.getBan(data[3], 0),SW.getBan(data[3], 1), SW.getBan(data[3], 2), AntiSpam.checkUserCAS(data[3])]).then(function(PAll) {
					let BanMSGState = "";
					PAll.map(bool => {
						if(bool.state === true){
								if(bool.reason.startsWith("0x")){
									BanMSGState += `\nReason ${bool.antispam}: ${ReasonsListFlip[bool.reason]}` //Flip back to human readable reason
								}else{
									BanMSGState += `\nReason ${bool.antispam}: ${bool.reason}`
								}
						}
					});
					
					let MSG = i18n(config.language, "AntiSpamCheck", { Nutzername: data[4], Spamwatch: f.ConvertBoolToEmoji(PAll[0].state), EBGWatch: f.ConvertBoolToEmoji(PAll[1].state), BolverWatch: f.ConvertBoolToEmoji(PAll[2].state), CAS:f.ConvertBoolToEmoji(PAll[3].state) }) + BanMSGState

					let replyMarkup = bot.inlineKeyboard([
						[
							bot.inlineButton('Back', {callback: `menu_gban_${data[2]}_${data[3]}_${data[4]}`})
						]
					]);

					if ('inline_message_id' in msg) {
						bot.editMessageText(
							{inlineMsgId: inlineId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}else{
						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}
				});
			}
			if(data[1] === 'reason')
			{
				let ReasonPos5 = data[5]
				SW.addBan(data[3], 2, ReasonsList[ReasonPos5]).then(function(addBan){
					if(addBan.status === true){
						let MSG = `${data[4]}(${data[3]}) was banned in BolverWatch for ${data[5]} ${ReasonsList[ReasonPos5]}`

						let replyMarkup = bot.inlineKeyboard([
							[
								bot.inlineButton('Back', {callback: `menu_gban_${data[2]}_${data[3]}_${data[4]}`})
							]
						]);

						if ('inline_message_id' in msg) {
							bot.editMessageText(
								{inlineMsgId: inlineId}, MSG,
								{parseMode: 'markdown', webPreview: false, replyMarkup}
							).catch(error => console.log('Error:', error));
						}else{
							bot.editMessageText(
								{chatId: chatId, messageId: messageId}, MSG,
								{parseMode: 'markdown', webPreview: false, replyMarkup}
							).catch(error => console.log('Error:', error));
						}
					}else{
						let replyMarkup = bot.inlineKeyboard([
							[
								bot.inlineButton('Back', {callback: `menu_gban_${data[2]}_${data[3]}_${data[4]}`})
							]
						]);
		
						let MSG = `FAILED! System Offline...`

						if ('inline_message_id' in msg) {
							bot.editMessageText(
								{inlineMsgId: inlineId}, MSG,
								{parseMode: 'markdown', webPreview: false, replyMarkup}
							).catch(error => console.log('Error:', error));
						}else{
							bot.editMessageText(
								{chatId: chatId, messageId: messageId}, MSG,
								{parseMode: 'markdown', webPreview: false, replyMarkup}
							).catch(error => console.log('Error:', error));
						}
					}
				}).catch(function(error) {
					let replyMarkup = bot.inlineKeyboard([
						[
							bot.inlineButton('Back', {callback: `menu_gban_${data[2]}_${data[3]}_${data[4]}`})
						]
					]);
	
					let MSG = `FAILED! ${addBan.text}`

					if ('inline_message_id' in msg) {
						bot.editMessageText(
							{inlineMsgId: inlineId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}else{
						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}
				})
			}
		}else{
			bot.answerCallbackQuery(msg.id,{
				text: i18n(config.language, "NichtGenugRechte"),
				showAlert: true
			});
		}
	}

	if(data[0] === 'token')
	{
		if(data[2] === userID){
			bot.answerCallbackQuery(msg.id);
			if(data[1] === 'get')
			{
				let MSG = `Select the permissions of the Token!`
						let replyMarkup = bot.inlineKeyboard([
							[
								bot.inlineButton('User', {callback: `token_perm_${data[2]}_${data[3]}_${data[4]}_User`}),
								bot.inlineButton('Admin', {callback: `token_perm_${data[2]}_${data[3]}_${data[4]}_Admin`}),
								bot.inlineButton('Root', {callback: `token_perm_${data[2]}_${data[3]}_${data[4]}_Root`})
							]
						]);
						if ('inline_message_id' in msg) {
							bot.editMessageText(
								{inlineMsgId: inlineId}, MSG,
								{parseMode: 'markdown', webPreview: false, replyMarkup}
							).catch(error => console.log('Error:', error));
						}else{
							bot.editMessageText(
								{chatId: chatId, messageId: messageId}, MSG,
								{parseMode: 'markdown', webPreview: false, replyMarkup}
							).catch(error => console.log('Error:', error));
						}
			}
			if(data[1] === 'del')
			{
				SW.getTokenUser(data[3], 2).then(function(Tokens){
					let MSG = `The user ${data[4]}(${data[3]}) has ${Tokens.length} Token(s) with the permission(s):\n`;
					let IDs = "";
					for(var i = 0; i < Tokens.length;i++){
						MSG = MSG + Tokens[i].permission + "(" + Tokens[i].id + ")" + "\n"
						IDs = IDs + Tokens[i].id + ","
					}
					MSG = MSG + "\nAPI Url: " + Tokens.url + "\nAPI Name: " + Tokens.antispam

					let replyMarkup = bot.inlineKeyboard([
						[
							bot.inlineButton('Delete ALL!', {callback: `token_delALL_${data[2]}_${data[3]}_${data[4]}_${IDs}`})
						]
					]);

					if ('inline_message_id' in msg) {
						bot.editMessageText(
							{inlineMsgId: inlineId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}else{
						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}
				});
			}
			if(data[1] === 'check')
			{
				SW.getTokenUser(data[3], 2).then(function(Tokens){
					let MSG = `The user ${data[4]}(${data[3]}) has ${Tokens.length} Token(s) with the permission(s):\n`;
					for(var i = 0; i < Tokens.length;i++){
						MSG = `${MSG} ${f.ConvertBoolToEmoji(Tokens[i].retired)} ${Tokens[i].permission}\n`
					}
					MSG = MSG + "\nAPI Url: " + Tokens.url + "\nAPI Name: " + Tokens.antispam

					let replyMarkup = bot.inlineKeyboard([
						[
							bot.inlineButton('Back', {callback: `menu_token_${data[2]}_${data[3]}_${data[4]}`})
						]
					]);

					if ('inline_message_id' in msg) {
						bot.editMessageText(
							{inlineMsgId: inlineId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}else{
						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}
				});
			}
			if(data[1] === 'perm')
			{
				SW.createToken(data[3], data[5], 2).then(function(Tokens){
					if(Tokens !== null){
						let MSG = `${Tokens.permissions} Token is ready for user ${data[4]}(${Tokens.UserID})\n\nAPI Name: ${Tokens.APIName}\nURL: ${Tokens.APIurl}\n\nGo to @JoinProtectionBot and write /mytokens to get all your tokens`

						let replyMarkup = bot.inlineKeyboard([
							[
								bot.inlineButton('Back', {callback: `menu_token_${data[2]}_${data[3]}_${data[4]}`})
							]
						]);

						if ('inline_message_id' in msg) {
							bot.editMessageText(
								{inlineMsgId: inlineId}, MSG,
								{parseMode: 'markdown', webPreview: false, replyMarkup}
							).catch(error => console.log('Error:', error));
						}else{
							bot.editMessageText(
								{chatId: chatId, messageId: messageId}, MSG,
								{parseMode: 'markdown', webPreview: false, replyMarkup}
							).catch(error => console.log('Error:', error));
						}
					}else{
						let MSG = `FAILED! Check Logs!`

						let replyMarkup = bot.inlineKeyboard([
							[
								bot.inlineButton('Back', {callback: `menu_token_${data[2]}_${data[3]}_${data[4]}`})
							]
						]);

						if ('inline_message_id' in msg) {
							bot.editMessageText(
								{inlineMsgId: inlineId}, MSG,
								{parseMode: 'markdown', webPreview: false, replyMarkup}
							).catch(error => console.log('Error:', error));
						}else{
							bot.editMessageText(
								{chatId: chatId, messageId: messageId}, MSG,
								{parseMode: 'markdown', webPreview: false, replyMarkup}
							).catch(error => console.log('Error:', error));
						}
					}
				});
			}
			if(data[1] === 'delALL')
			{
				let IDs = data[5].split(",")
				let Promises = [];
				for(var i = 0; i < IDs.length-1;i++){
					Promises.push(SW.deleteToken(IDs[i], 2))
				}
				Promise.all(Promises).then(function(Tokens){
					console.log(Tokens)
					let MSG = `All Tokens for User ${data[4]}(${data[3]}) where deleted!`

					let replyMarkup = bot.inlineKeyboard([
						[
							bot.inlineButton('Back', {callback: `menu_token_${data[2]}_${data[3]}_${data[4]}`})
						]
					]);

					if ('inline_message_id' in msg) {
						bot.editMessageText(
							{inlineMsgId: inlineId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}else{
						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, MSG,
							{parseMode: 'markdown', webPreview: false, replyMarkup}
						).catch(error => console.log('Error:', error));
					}
				});
			}
		}
	}
	if(data[0] === 'menu')
	{
		if(data[2] === userID){
			bot.answerCallbackQuery(msg.id);
			if(data[1] === 'gban')
			{	
				let replyMarkup = bot.inlineKeyboard([
					[
						bot.inlineButton('Ban', {callback: `gban_ban_${data[2]}_${data[3]}_${data[4]}`}),
						bot.inlineButton('Unban', {callback: `gban_unban_${data[2]}_${data[3]}_${data[4]}`}),
						bot.inlineButton('Check', {callback: `gban_check_${data[2]}_${data[3]}_${data[4]}`})
					]
				]);
				
				let MSG = `Select what i should do with this ${data[4]}(${data[3]}) !`

				if ('inline_message_id' in msg) {
					bot.editMessageText(
						{inlineMsgId: inlineId}, MSG,
						{parseMode: 'markdown', webPreview: false, replyMarkup}
					).catch(error => console.log('Error:', error));
				}else{
					bot.editMessageText(
						{chatId: chatId, messageId: messageId}, MSG,
						{parseMode: 'markdown', webPreview: false, replyMarkup}
					).catch(error => console.log('Error:', error));
				}

			}

			if(data[1] === 'token')
			{
				let replyMarkup = bot.inlineKeyboard([
					[
						bot.inlineButton('Get', {callback: `token_get_${data[2]}_${data[3]}_${data[4]}`}),
						bot.inlineButton('Delete', {callback: `token_del_${data[2]}_${data[3]}_${data[4]}`}),
						bot.inlineButton('Check', {callback: `token_check_${data[2]}_${data[3]}_${data[4]}`})
					]
				]);
				
				let MSG = `${data[4]}(${data[3]}) select what you need!`

				if ('inline_message_id' in msg) {
					bot.editMessageText(
						{inlineMsgId: inlineId}, MSG,
						{parseMode: 'markdown', webPreview: false, replyMarkup}
					).catch(error => console.log('Error:', error));
				}else{
					bot.editMessageText(
						{chatId: chatId, messageId: messageId}, MSG,
						{parseMode: 'markdown', webPreview: false, replyMarkup}
					).catch(error => console.log('Error:', error));
				}	
			}
		}else{
			bot.answerCallbackQuery(msg.id,{
				text: i18n(config.language, "NichtGenugRechte"),
				showAlert: true
			});
		}
	}
});

/*
Needs to be a reply
gban <UserID> <Username> for Userbot by GodOfOwls
token <UserID> <Username> for Userbot by GodOfOwls
*/
bot.on('inlineQuery', msg => {
    let query = msg.query;
    let queryarr = query.split('');
    queryBetaArr = query.split(' ');
	const answers = bot.answerList(msg.id, { cacheTime: 1 });
	if (queryBetaArr[0].toLowerCase() === "gban") {
		perms.permissions(msg.from.id).then(function(Permissions) {
			if(Permissions >= permsJson.Admin){
				let SafeUsername = "";
				for(var i = 2; i < queryBetaArr.length;i++){
					SafeUsername = SafeUsername + queryBetaArr[i] + " ";
					console.log(SafeUsername)
				};
				SafeUsername = SafeUsername.trim()
				SafeUsername = SafeUsername.replace("_","-")
				if(SafeUsername.length >= 22){
					SafeUsername = queryBetaArr[1]
				}
				let replyMarkup = bot.inlineKeyboard([
					[
						bot.inlineButton('Ban', {callback: `gban_ban_${msg.from.id}_${queryBetaArr[1]}_${SafeUsername}`}),
						bot.inlineButton('Unban', {callback: `gban_unban_${msg.from.id}_${queryBetaArr[1]}_${SafeUsername}`}),
						bot.inlineButton('Check', {callback: `gban_check_${msg.from.id}_${queryBetaArr[1]}_${SafeUsername}`})
					]
				]);

				answers.addArticle({
					id: 1,
					title: "Gban",
					message_text: `Select what i should do with ${SafeUsername}(${queryBetaArr[1]}) !`,
					reply_markup: replyMarkup,
					parse_mode: 'markdown'
				})
				return bot.answerQuery(answers).catch(error => console.log('Error (inline gban):', error.description))
			}else{
				answers.addArticle({
					id: 1,
					title: "Not enoth Permissions",
					message_text: `This can only be used by an admin`,
					parse_mode: 'markdown'
				})
				return bot.answerQuery(answers).catch(error => console.log('Error (inline gban):', error.description))
			}
				
		});
	}

	if (queryBetaArr[0].toLowerCase() === "token") {
		perms.permissions(msg.from.id).then(function(Permissions) {
			if(Permissions >= permsJson.Admin){
				let SafeUsername = "";
				for(var i = 2; i < queryBetaArr.length;i++){
					SafeUsername = SafeUsername + queryBetaArr[i] + " ";
				};
				SafeUsername = SafeUsername.trim()
				SafeUsername = SafeUsername.replace("_","-")
				let replyMarkup = bot.inlineKeyboard([
					[
						bot.inlineButton('Get', {callback: `token_get_${msg.from.id}_${queryBetaArr[1]}_${SafeUsername}`}),
						bot.inlineButton('Delete', {callback: `token_del_${msg.from.id}_${queryBetaArr[1]}_${SafeUsername}`}),
						bot.inlineButton('Check', {callback: `token_check_${msg.from.id}_${queryBetaArr[1]}_${SafeUsername}`})
					]
				]);

				answers.addArticle({
					id: 1,
					title: "Token",
					message_text: `${SafeUsername}(${queryBetaArr[1]}) select what you need!`,
					reply_markup: replyMarkup,
					parse_mode: 'markdown'
				})
				return bot.answerQuery(answers).catch(error => console.log('Error (inline Token):', error.description))
			}else{
				answers.addArticle({
					id: 1,
					title: "Not enoth Permissions",
					message_text: `This can only be used by trusted users, ask any Admin to get verifyed!`,
					parse_mode: 'markdown'
				})
				return bot.answerQuery(answers).catch(error => console.log('Error (inline Token):', error.description))
			}
				
		});
	}
});

//UserManagment
bot.on(/^\/register/i, (msg) => {
	bot.deleteMessage(msg.chat.id, msg.message_id);
	var user = {
		id: msg.from.id,
		name: 'Anonym'
	};
	perms.permissions(msg.from.id).then(function(Permissions) {
		if(Permissions === permsJson.unregUser){
			perms.register(user).then(function(result) {
				msg.reply.text("You are now registert!");
			});
		}else{
			msg.reply.text("You are already registert\nYour current level is:" + Permissions);
		}
	});
});

bot.on(/^\/unregister/i, (msg) => {
	bot.deleteMessage(msg.chat.id, msg.message_id);
	var user = {
		id: msg.from.id,
		name: msg.from.username
	};
	perms.permissions(msg.from.id).then(function(Permissions) {
		if(Permissions >= permsJson.regUser){
			perms.unregister(user).then(function(result) {
				msg.reply.text("I forgot everything about you...\nResult:\nAffectedRows: " + result.affectedRows,);
			});
		}else{
			msg.reply.text("You are unkown...");
		}
	});
});

bot.on(/^\/promote( .+)*$/i, (msg, props) => {
	bot.deleteMessage(msg.chat.id, msg.message_id);
	var Para = props.match[1].trim();
	if(typeof(Para) === 'undefined'){
		msg.reply.text("You need to specify a new permissions level");
	}else{
		if(!isNaN(Para.trim())){
	perms.permissions(msg.from.id).then(function(Permissions) {
		if(Permissions >= permsJson.Admin || msg.from.id === Number(config.isSuperAdmin)){
			if("reply_to_message" in msg){
				perms.permissions(msg.reply_to_message.from.id).then(function(PermissionsReply) {
					if(PermissionsReply >= permsJson.regUser){
						console.log(Para)
						if(PermissionsReply <= Para){
							var user = {
								id: msg.reply_to_message.from.id,
								name: msg.reply_to_message.from.username,
								new: Para,
								old: PermissionsReply
							};
							perms.modify(user).then(function(result) {
								console.log(result)
								msg.reply.text("Worked");
							});
						}else{
							msg.reply.text("The user has more permissions than you try to give him, please use /demote to do that");
						}
					}else{
						msg.reply.text("This is not possible for that user :(")
					}
				});
			}else{
				msg.reply.text("You need to reply to a user to promote him/her");
			}
		}else{
			msg.reply.text("You don´t have enoth permissions to do this...");
		}
	});
	}else{
		msg.reply.text("You need to give me the permissions as number from 0-40");
	}
	}
});

bot.on(/^\/stats/i, (msg) => {
	SW.GetCacheStats().then(function(Cache) {
		let Message = "";
		Cache.map(obj => {
			Message = `${Message}${obj.AntispamName} hat aktuell ${obj.BanAmount} gebannte Nutzer.\n`
		});
		msg.reply.text(Message);
	});
});

bot.on(/^\/mytokens/i, (msg) => {
	if(msg.from.id === msg.chat.id){
		if ('username' in msg.from) {
			var nutzername = msg.from.username.toString();
		}else{
			var nutzername = msg.from.first_name.toString();
		}
		SW.getTokenUser(msg.from.id, 2).then(function(Tokens){
			let MSG = `The user ${nutzername}(${msg.from.id}) has ${Tokens.length} Token(s) with the permission(s):\n`;
			for(var i = 0; i < Tokens.length;i++){
				MSG = `${MSG} ${f.ConvertBoolToEmoji(Tokens[i].retired)} ${Tokens[i].permission}\n<code>${Tokens[i].token}</code>\n`
			}
			MSG = MSG + "\nAPI Url: " + Tokens.url + "\nAPI Name: " + Tokens.antispam

			msg.reply.text(MSG, {parseMode: 'html'}).catch(error => console.log('Reply Message Error:', error));
		});
	}else{
		msg.reply.text("ONLY DO THIS IN PRIVAT CHAT WITH THE BOT!");
	}
});
bot.on(/^\/gban( .+)*$/i, (msg, props) => {
	perms.permissions(msg.from.id).then(function(Permissions) {
		if(Permissions >= permsJson.Admin || msg.from.id === Number(config.isSuperAdmin)){
			var Para = props.match[1].trim();
			if(typeof(Para) === 'undefined'){
				msg.reply.text("You need to specify a new permissions level");
			}else{
				if(typeof(msg.reply_to_message.text) === 'undefined'){
					msg.reply.text("You must Reply at a user ID and type /gban reason");
				}else{
					SW.addBan(msg.reply_to_message.text, 2, Para).then(function(addBan){
						console.log(addBan)
						bot.deleteMessage(msg.chat.id, msg.message_id);
					})
				}
			}
		}else{
			msg.reply.text("You don´t have enoth permissions to do this...");
		}
	})
});

setInterval(function(){
	SW.Cache()
}, 301000);