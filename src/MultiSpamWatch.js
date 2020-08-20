var config = require("../config");
var SpamWatchAPIList = require("../Spamwatch");
var secret = require("../secret");
const SpamWatchAPI = require('spamwatch');
//Set Permissions for the API (Version 0.3.0)
const User = ["User","Admin","Root"];
const Admin = ["Admin","Root"];
const Root = ["Root"];
//Caching Object for Permissions and Banlists
var BanCache = [];

async function Cache(){
    BanCache = []
    for (i = 0; i < SpamWatchAPIList.length; i++) {
        let SplitString = SpamWatchAPIList[`${i}`].split("|");
        let AntispamName = SplitString[0]
        let url = SplitString[1]
        let Token = `spamwatch${i}`
        let SpamWatch = new SpamWatchAPI.Client(secret[Token], url);
        //console.log(secret[loken], url)
        let obj = {
            API_Name: AntispamName,
            IDList: await SpamWatch.getBansMin().catch(error => console.log(error)),
            Self: await SpamWatch.getSelf().catch(error => console.log(error))
        }
        BanCache.push(obj)
        
    }
    console.log(`[bot.Spamwatch] Updated`)
}

/**
 * Requst a ban chackup of a UserID to a specific API, can also use cashe
 * @param {Integer} UserID 
 * @param {Integer} API_ID 
 * @param {Boolean} cache 
 * @returns {Object|Integer} Promise
 */
let getBan = async function(UserID, API_ID, cache) {
        let SplitString = SpamWatchAPIList[`${API_ID}`].split("|");
        let AntispamName = SplitString[0]
        let url = SplitString[1]
        let Token = `spamwatch${API_ID}`
        if(User.includes(BanCache[API_ID].Self.permission)){
            if(cache === true){
                if(BanCache[API_ID].IDList.includes(UserID)){
                    let SpamWatch = new SpamWatchAPI.Client(secret[Token], url);
                    let ban = await SpamWatch.getBan(parseInt(UserID));
                    if(ban === false){
                        ban = {state: false, antispam: AntispamName}
                    }else{
                        ban.state = true
                        ban.antispam = AntispamName
                    }
                    return ban;
                }else{
                    let ban = {state: false, antispam: AntispamName}
                    return ban;
                }
            }else{
                let SpamWatch = new SpamWatchAPI.Client(secret[Token], url);
                let ban = await SpamWatch.getBan(parseInt(UserID));
                if(ban === false){
                    ban = {state: false, antispam: AntispamName}
                }else{
                    ban.state = true
                    ban.antispam = AntispamName
                }
                return ban;
            }

        }else{
            return 403;
        }
}

/**
 * Requst to ban a UserID
 * @param {Number} UserID 
 * @param {Integer} API_ID 
 * @param {String} reason
 * @param {String} message
 * @returns {Object|Integer} Promise
 */
let addBan = async function(UserID, API_ID, reason, message) {
    if(!reason){reason = "0x00"}
    if(!message){message = "Not needed"}
    let SplitString = SpamWatchAPIList[`${API_ID}`].split("|");
    let AntispamName = SplitString[0]
    let url = SplitString[1]
    let Token = `spamwatch${API_ID}`
    if(Admin.includes(BanCache[API_ID].Self.permission)){
        let SpamWatch = new SpamWatchAPI.Client(secret[Token], url);
        SpamWatch.addBan(parseInt(UserID), reason, message)
        return true;
    }else{
        return 403;
    }
}

/**
 * Requst to unban a UserID
 * @param {Integer} UserID 
 * @param {Integer} API_ID 
 * @returns {Object|Integer} Promise
 */
let remBan = async function(UserID, API_ID) {
    let SplitString = SpamWatchAPIList[`${API_ID}`].split("|");
    let AntispamName = SplitString[0]
    let url = SplitString[1]
    let Token = `spamwatch${API_ID}`
    if(Admin.includes(BanCache[API_ID].Self.permission)){
        let SpamWatch = new SpamWatchAPI.Client(secret[Token], url);
        await SpamWatch.deleteBan(parseInt(UserID))
        return true;
    }else{
        return 403;
    }
}

module.exports = {
    Cache,
    getBan,
    addBan,
    remBan
}