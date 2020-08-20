//Include simple modules
var fs = require("fs");
const util = require('util');

//Für Zeit Befehle
var Sekunde = 1000;
var Minute = Sekunde*60;
var Stunde = Minute*60;
var Tag = Stunde*24;
var Monat = Tag*(365/12);
var Jahr = Tag*365;

/**
 * Converts a false to ✅ and a true to ❌, if its nither it returns ❔
 * @param {boolean} bool 
 * @returns {String}
 */
let ConvertBoolToEmoji = function ConvertBoolToEmoji(boolean) {
	if(boolean === true){
		return "🔴";
	}else if(boolean === false){
		return "🟢";
	}else{
		return "❔";
	}
}
/**
 * Converts a date into string dd.mm.yyyy hh:mm:ss
 * @param {Date} 
 * @returns {String}
 */
let getDateTime = function getDateTime(date) {

	var hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;

	var min  = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;

	var sec  = date.getSeconds();
	sec = (sec < 10 ? "0" : "") + sec;

	var year = date.getFullYear();

	var month = date.getMonth() + 1;
	month = (month < 10 ? "0" : "") + month;

	var day  = date.getDate();
	day = (day < 10 ? "0" : "") + day;

	return day + "." + month + "." + year + " " + hour + ":" + min + ":" + sec;
}

/**
 * Logs a event to log file
 * @param {String} 
 */
let log = function log(info) {
	console.log(getDateTimelog(new Date()) + " " + info)
	fs.appendFile('./log/Bot.log', "\n" + new Date() + " " + info, function (err) {
		if (err) {console.log('Error, logging Text to logfile!', err)}
	})
}
/**
 * Logs a error to errorlog file
 * @param {String} 
 */
let Elog = function Elog(info) {
	console.log(getDateTimelog(new Date()) + " " + info)
	fs.appendFile('./log/Error.log', "\n" + new Date() + " " + info, function (err) {
		if (err) {console.log('Error, logging Text to logfile!', err)}
	})
}

/**
 * Returns random Int from 0-max
 * @param {Int} max
 */
let getRandomInt = function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

/**
 * Returns random Int from 1-max
 * @param {Int} max
 */
let getRandomIntNo0 = function getRandomIntNo0(max) {
	return 1 + Math.floor(Math.random() * Math.floor(max));
}

/**
 * Converts a date into string split into days, hours, minutes and seconds
 * @param {Date} 
 * @returns {String}
 */
let uptime = function uptime(Time_started) {
	var uptime = new Date().getTime() - Time_started;

	var uptimeTage =  Math.floor((uptime)/Tag);
	var uptimeTageRest = uptime-(uptimeTage*Tag)

	var uptimeStunde =  Math.floor((uptimeTageRest)/Stunde);
	var uptimeStundeRest = uptimeTageRest-(uptimeStunde*Stunde)

	var uptimeMinute =  Math.floor((uptimeStundeRest)/Minute);
	var uptimeMinuteRest = uptimeStundeRest-(uptimeMinute*Minute)

	var uptimeSekunde =  Math.floor((uptimeMinuteRest)/Sekunde);
	var uptimeSekundeRest = uptimeMinuteRest-(uptimeSekunde*Sekunde)

	let uptimeoutput = "\nSekunden: " + uptimeSekunde;
	if(uptimeMinute >= 1){
	uptimeoutput = "\nMinuten: " + uptimeMinute + uptimeoutput;
	}
	if(uptimeStunde >= 1){
	uptimeoutput = "\nStunden: " + uptimeStunde + uptimeoutput;
	}
	if(uptimeTage >= 1){
	uptimeoutput = "\nTage: " + uptimeTage + uptimeoutput;
	}
	return uptimeoutput;
}

/**
 * Returns number with 2 decimal places
 * @param {Int} max
 */
let Round2Dec = function Round2Dec(num){
	return Math.round(num * 100) / 100
}

/**
 * Capitalizes first Letter of a string
 * @param {String}
 * @returns {String}
 */
let capitalizeFirstLetter = function capitalizeFirstLetter(string) {
return string.charAt(0).toUpperCase() + string.slice(1);
	}

function getDateTimelog(date) {

		var hour = date.getHours();
		hour = (hour < 10 ? "0" : "") + hour;

		var min  = date.getMinutes();
		min = (min < 10 ? "0" : "") + min;

		var sec  = date.getSeconds();
		sec = (sec < 10 ? "0" : "") + sec;

		var year = date.getFullYear();

		var month = date.getMonth() + 1;
		month = (month < 10 ? "0" : "") + month;

		var day  = date.getDate();
		day = (day < 10 ? "0" : "") + day;

		return "[" + day + "." + month + "." + year + "] [" + hour + ":" + min + ":" + sec + "]";
}

module.exports = {
	ConvertBoolToEmoji,
    getDateTime,
    log,
	Elog,
	getRandomInt,
	getRandomIntNo0,
	uptime,
	Round2Dec,
	capitalizeFirstLetter
};