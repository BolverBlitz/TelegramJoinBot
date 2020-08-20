var SW = require("./SpamWatch.js");
const AntiSpam = require('./Antispam');
const SpamWatchAPI = require('spamwatch');
let SpamWatch = new SpamWatchAPI.Client('gB3FqqM9c~WHs~3Uz96K85tIJ50HQrHt1G4okq50lhzfF6fksU_NdN6Q9NNupbnj', 'https://spamapi.bolverblitz.net/');
var UserID = 274074733
var UserID2 = 384707683

//SpamWatch.deleteBan(UserID2)
SpamWatch.addBan(UserID2, "TestBan", "Not needed")


SpamWatch.getBansMin().then(function(Array) {
    console.log("\n\n\n")
    console.log(Array)
});






/*
SpamWatch.getToken(1).then(function(Token) {
    console.log("\n\n\n")
    console.log(Token)
});
*/

/*
SW.Cache().then(function() {
    SW.getBan(UserID, 2, true).then(function(Ban){
        console.log(Ban);
    //SW.addBan(UserID, 2, "TestBan").then(function(addBan){
        //console.log(addBan);
        SW.getBan(UserID, 2, true).then(function(Ban){
            console.log(Ban);
        }).catch(error => console.log(error))
    }).catch(error => console.log(error))
    
    SW.addBan(UserID, 2, "BugFixBan").then(function(addBan){
        console.log(addBan);
    
    }).catch(error => console.log(error))

    SW.addBan(UserID2, 2, "BugFixBan").then(function(addBan){
        console.log(addBan);
    
    }).catch(error => console.log(error))
    
})
*/

/*
let Time_start = new Date().getTime();
AntiSpam.checkUserEBGWatch(UserID).then(function(Ban){
    let Time_end = new Date().getTime();
    console.log(Ban, `Took: ${Time_end-Time_start}ms`);
}).catch(error => console.log(error))
*/



