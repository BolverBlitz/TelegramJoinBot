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
        var IDListTemp = [];
        var Self;
        var TSelf;
        IDListTemp = await SpamWatch.getBansMin().catch(function(error) {if(error.status === 429){console.log(`[bot.Spamwatch] Ratelimit for API: ${AntispamName}`)}else if(error.response.status === 503){console.log(`[bot.Spamwatch] System Offline: ${AntispamName}`)}else{console.log(error)}})
        var SSelf = await SpamWatch.getSelf().catch(function(error) {if(error.response.status === 503){console.log(`[bot.Spamwatch] System Offline: ${AntispamName}`);TSelf = {permission: "Offline", token: Token};}else{console.log(error)}})
        if(!SSelf){
            Self = TSelf;
        }else{
            Self = SSelf;
        }
        let obj = {
            API_Name: AntispamName,
            IDList: IDListTemp,
            Self: Self,
        }
        BanCache.push(obj)
        
    }
    //console.log(BanCache)
    console.log(`[bot.Spamwatch] Updated`)
}

async function GetCacheStats(){
    let Out = []
    BanCache.map(obj => {
        let temo = {
            BanAmount: obj.IDList.length,
            AntispamName: obj.API_Name
        }
    Out.push(temo)
    });
    return Out;
}

/**
 * Requst a ban checkup of a UserID to a specific API, can also use cashe
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
                    var banf
                    var bans = await SpamWatch.getBan(parseInt(UserID)).catch(function(error) {if(error.response.status === 503){banf = {state: "maybe", antispam: AntispamName};}else{console.log(error)}})
                    if(!bans){
                        ban = banf;
                    }else{
                        ban = bans;
                    }
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
let addBan = function(UserID, API_ID, reason, message) {
    return new Promise(function(resolve, reject) {
        if(!reason){reason = "0x00"}
        if(!message){message = "Not needed"}
        let SplitString = SpamWatchAPIList[`${API_ID}`].split("|");
        let AntispamName = SplitString[0]
        let url = SplitString[1]
        let Token = `spamwatch${API_ID}`
        if(Admin.includes(BanCache[API_ID].Self.permission)){
            let SpamWatch = new SpamWatchAPI.Client(secret[Token], url);
            SpamWatch.addBan(parseInt(UserID), reason, message).then(function(){
                resolve({status: true});
            }).catch(function(error) {if(error.status === 400){console.log(`[bot.Spamwatch] Missing info in Request: ${AntispamName}`); let out = {status: false, text: `Bad request ${error.status}`}; resolve(out);}else{console.log(error)}})
        }else{
            resolve(403);
        }
    });
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

/**
 * Requst a new Token
 * @param {Integer} UserID 
 * @param {'Root' | 'Admin' | 'User'} perm
 * @param {Integer} API_ID 
 * @returns {Object|Integer} Promise
 */
let createToken = async function(UserID, perm, API_ID) {
    let SplitString = SpamWatchAPIList[`${API_ID}`].split("|");
    let AntispamName = SplitString[0]
    let url = SplitString[1]
    let Token = `spamwatch${API_ID}`
    if(Root.includes(BanCache[API_ID].Self.permission)){
        let SpamWatch = new SpamWatchAPI.Client(secret[Token], url);
        let result = {
            token: await SpamWatch.createToken(parseInt(UserID), perm),
            UserID: UserID,
            permissions: perm,
            APIName: AntispamName,
            APIurl: url
        }
        if(result.token === null){
            return null
        }
        return result;
    }else{
        return 403;
    }
};

/**
 * Requst all Tokens for a User
 * @param {Integer} UserID 
 * @param {Integer} API_ID 
 * @returns {Object|Integer} Promise
 */
let getTokenUser = async function(UserID, API_ID) {
    let SplitString = SpamWatchAPIList[`${API_ID}`].split("|");
    let AntispamName = SplitString[0]
    let url = SplitString[1]
    let Token = `spamwatch${API_ID}`
    if(Root.includes(BanCache[API_ID].Self.permission)){
        let SpamWatch = new SpamWatchAPI.Client(secret[Token], url);
        let Tokens = await SpamWatch.getTokenUser(parseInt(UserID))
        Tokens.url = url;
        Tokens.antispam = AntispamName;
        return Tokens;
    }else{
        return 403;
    }
}

/**
 * Requst to delete a Token
 * @param {Integer} TokenID 
 * @param {Integer} API_ID 
 * @returns {Object|Integer} Promise
 */
let deleteToken = async function(TokenID, API_ID) {
    let SplitString = SpamWatchAPIList[`${API_ID}`].split("|");
    let AntispamName = SplitString[0]
    let url = SplitString[1]
    let Token = `spamwatch${API_ID}`
    if(Root.includes(BanCache[API_ID].Self.permission)){
        let SpamWatch = new SpamWatchAPI.Client(secret[Token], url);
        await SpamWatch.deleteToken(parseInt(TokenID))
        return true;
    }else{
        return 403;
    }
}


module.exports = {
    Cache,
    GetCacheStats,
    getBan,
    addBan,
    remBan,
    createToken,
    getTokenUser,
    deleteToken
}

