const config = require("../config");
const secret = require("../secret");
const request = require('request');
const os = require('os');
const plockjson = require('../package-lock.json');
const pjson = require('../package.json')

var customHeaderRequest = request.defaults({
    headers: {'User-Agent': `NodeJS/${process.version} Module: request/${plockjson.dependencies.request.version} (${os.type()} ${os.release()} ${os.platform()}) | Process:${pjson.name}/${pjson.version}`}
})

//console.log(`NodeJS/${process.version} Module: request/${plockjson.dependencies.request.version} (${os.type()} ${os.release()} ${os.platform()}) | Process:${pjson.name}/${pjson.version}`)

let checkUserCAS = function (UserID) {
    //UserID = 1205278547;
    return new Promise(function(resolve, reject) {
        request(`https://api.cas.chat/check?user_id=${UserID}`, { json: true }, (err, res, body) => {
            if (err) {
                console.log(err)
                let Out = {
                    antispam: "CAS",
                    state: "maybe",
                    reason: "System Offline"
                }
                resolve(Out);
            }else{
                let Out = {
                    antispam: "CAS",
                    state: body.ok,
                }
                if(body.ok !== false){
                    Out.timestamp = body.result.time_added,
                    Out.reason = body.result.messages
                    }
                resolve(Out);
            }
        });
    });
};

let checkSpamblockers = function (UserID) {
    //1673603685
    return new Promise(function(resolve, reject) {
        request(`https://spamblockers.bolverblitz.eu/user/${UserID}`, { json: true }, (err, res, body) => {
            if (err) {
                console.log(err)
                let Out = {
                    antispam: "SpamBlockers",
                    state: "maybe",
                    reason: "System Offline"
                }
                resolve(Out);
            }else{
                if (body.user != null){
                    let Out = {
                        antispam: "SpamBlockers",
                        state: true,
                        reason: body.user.reason
                    }
                    resolve(Out);
                }else{
                    let Out = {
                        antispam: "SpamBlockers",
                        state: false,
                        reason: "Not Banned"
                    }
                    resolve(Out);
                }
            }
        });
    });
};

let checkUserspamprotection = function (UserID) {
    return new Promise(function(resolve, reject) {
        customHeaderRequest(`https://api.intellivoid.net/spamprotection/v1/lookup?query=${UserID}`, { json: true }, (err, res, body) => {
            if (err) {
                console.log(err)
                let Out = {
                    antispam: "SpamProtection",
                    state: "maybe",
                    reason: "System Offline"
                }
                resolve(Out);
            }else{
                if(body.success === true){
                    var Out = {
                        antispam: "SpamProtection",
                        state: body.results.attributes.is_potential_spammer,
                    }

                    if(body.results.attributes.blacklist_reason === null){
                        Out.reason = body.results.attributes.blacklist_reason
                    }else{
                        Out.reason = "AI Ban"
                    }
                }else{
                    var Out = {
                        antispam: "SpamProtection",
                        state: "maybe",
                        reason: "404"
                    }
                }
                resolve(Out);
            }
        });
    });
};

module.exports = {
    checkUserCAS,
    checkSpamblockers,
    checkUserspamprotection
};
