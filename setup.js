var config = require('./config');
var secret = require("./secret");
var mysql = require('mysql');

if(config.dbreaduserhost == "example.com"){
	console.log("I´m sorry. You need to fill out config.json first!");
}else{

var db = mysql.createPool({
	connectionLimit : 100,
	host: config.dbuserhost,
	user: config.dbuser,
	password: secret.dbuserpwd,
	charset : 'utf8mb4_bin'
});
//MySQL Syntax
let sqlcmd = `CREATE DATABASE IF NOT EXISTS ${config.database};`;
/*
groupid: Telegram ID der Gruppe
username: @Name der Gruppe
language: Sprache der Gruppe (Standart aus Config)
regeln:	String für die Gruppe (4KB)
wilkommen: String für die Wilkommensnachricht (2KB)
mode: Die verschiedenen Stufen
- hard = Rätsel für alle
- simple = Knopf für alle
- dynamic = Rätsel für alle IDs nach ID aus Config
- dynamicPlus = Rätsel für alle nach ID aus Config, der rest nur Knopf
- off = Nur Antispam ist aktiv, keine rätsel
spamwatch: true/false antispam bei join
owlwatch: true/false antispam bei join
cas: true/false antispam bei join
deai: true/false antispam bei join
gban: true/false atnispam bei join
*/
let sqlcmdtable = "CREATE TABLE IF NOT EXISTS `groups` (`groupid` DOUBLE NOT NULL, `username` varchar(255), `language` varchar(255), `rules` varchar(4095), `welcome` varchar(2047), `mode` varchar(255), `spamwatch` varchar(255), `owlwatch` varchar(255), `cas` varchar(255), `deai` varchar(255), `gban` varchar(255), `time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (`groupid`));";
let alterTable = "ALTER TABLE `groups` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;"

/*
userid: Telegram ID des Nutzers
username: @Name des Users (Fals vorhanden)
language: Sprache
discription: Selbstvorstellung für gruppen (2KB)
perm: Rechte für den Bot
*/
let sqlcmdtable2 = "CREATE TABLE IF NOT EXISTS `users` (`userid` DOUBLE NOT NULL, `username` varchar(255), `language` varchar(255), `discription` varchar(2047), `perm` varchar(255), `time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (`userid`,`perm`));";
let alterTable2 = "ALTER TABLE `users` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;"

/*
BanID: Hexadezimale Zahl
useridBan: Telegram ID des gebannten Nutzers
useridAdmin: Telegram ID des Admins der gebannt hat
message: Nachricht für die gebannt wurde
reason: Ban grund
*/
let sqlcmdtable3 = "CREATE TABLE IF NOT EXISTS `warns` (`useridBan` DOUBLE NOT NULL,`useridAdmin` DOUBLE NOT NULL, `BanID` varchar(255), `reason` varchar(255), `time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (`useridBan`,`BanID`,`reason`));";
let alterTable3 = "ALTER TABLE `warns` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;"

//Create DB
db.getConnection(function(err, connection){
	console.log(`Connected to ${config.dbreaduserhost}`);
	connection.query(sqlcmd, function(err, result){
                if(err) throw err;
				console.log(`Database ${config.database} created`);
                });
                connection.release();
});

//Create Table "groups"
db.getConnection(function(err, connection){
	connection.query(`USE ${config.database};`, function(err, result){
		console.log(`DB switched ${config.database}`);
		connection.query(sqlcmdtable, function(err, result){
            if(err) throw err;
			console.log("Table groups created");
		});
		connection.query(alterTable, function(err, result){
            if(err) throw err;
			console.log("Table groups set to other character set");
        });
    	connection.release();
	});
});


//Create Table "users"
db.getConnection(function(err, connection){
	connection.query(`USE ${config.database};`, function(err, result){
		console.log(`DB switched ${config.database}`);
		connection.query(sqlcmdtable2, function(err, result){
            if(err) throw err;
			console.log("Table users created");
		});
		connection.query(alterTable2, function(err, result){
            if(err) throw err;
			console.log("Table users set to other character set");
        });
    	connection.release();
	});
});

//Create Table "gban"
db.getConnection(function(err, connection){
	connection.query(`USE ${config.database};`, function(err, result){
		console.log(`DB switched ${config.database}`);
		connection.query(sqlcmdtable3, function(err, result){
            if(err) throw err;
			console.log("Table gban created");
		});
		connection.query(alterTable3, function(err, result){
            if(err) throw err;
			console.log("Table gban set to other character set");
        });
    	connection.release();
	});
});

}