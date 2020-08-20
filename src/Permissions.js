var config = require("../config");
var mysql = require("mysql");
var secret = require("../secret");
var perms = require("../data/permissionsList");

var db = mysql.createPool({
	connectionLimit : 100,
	host: config.dbuserhost,
	user: config.dbuser,
	password: secret.dbuserpwd,
	database: config.database,
	charset : 'utf8mb4'
});

let permissions = function(userID) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			connection.query('SELECT * FROM `users` where userid =' + userID + ';', function(err, rows, fields) {
				connection.release();
				//console.log(rows);
				if(Object.entries(rows).length === 0){
					resolve("0");
				}else{
					resolve(rows[0].perm);
				}
			});
		});
	});
}

let modify = function(user) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			let sqlquery = "UPDATE `users` SET `perm` = '" + user.new.trim() + "' WHERE (`userid` = '" + user.id + "') and (`perm` = '" + user.old + "')"; //Modify Permissions
			connection.query(sqlquery, function(err, result) {
				connection.release();
				//console.log(sqlquery);
				resolve(result);
			});
		});
	});
}

let register = function(user) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			let sqlcmdadduser = "REPLACE INTO users (userid, username, language, discription, perm) VALUES ?";
			let sqlcmdadduserv = [[user.id, user.username, config.deflanguage, "discription", config.defperm]];
			connection.query(sqlcmdadduser, [sqlcmdadduserv], function(err, result) {
				connection.release();
				//console.log(result);
				resolve(result);
			});
		});
	});
}

let unregister = function(user) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			let sqlcmddeluser = "DELETE FROM users WHERE (`userhash` = '" + hash(user.id) + "');";
			connection.query(sqlcmddeluser, function(err, result) {
				connection.release();
				//console.log(result);
				resolve(result);
			});
		});
	});
}

module.exports = {
	permissions,
	modify,
	register,
	unregister
};