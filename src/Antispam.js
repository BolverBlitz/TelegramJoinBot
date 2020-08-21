var config = require("../config");
var secret = require("../secret");
const request = require('request');


let checkUserCAS = function (UserID) {
    //UserID = 1205278547;
    return new Promise(function(resolve, reject) {
        request(`https://api.cas.chat/check?user_id=${UserID}`, { json: true }, (err, res, body) => {
            if (err) {
                throw (err);
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

module.exports = {
    checkUserCAS
};