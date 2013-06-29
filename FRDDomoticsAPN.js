var     apn = require('apn')
      , fs = require('fs')
      , path = require('path');

var apnOptions = {  
                    "gateway": "gateway.sandbox.push.apple.com", 
                    "cert": "crypto/APNCert.pem",
                    "key": "crypto/APNKey.pem",
                    "passphrase" : fs.readFileSync(path.resolve(__dirname, 'crypto/APN.pwd'), 'utf8'),
                };

var apnConnection = new apn.Connection(apnOptions);


var token = "fb6dbc931ba99e37422299c40958ed118deaad05010beb1dfcb04a8a9c5aa7df";
var device = null;

function sendApnNotification(notificationData) {

    if (!device)
        initDevice();
    
    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = notificationData.alert;

    note.payload = notificationData;

    apnConnection.pushNotification(note, device);
}

function initDevice() {
    if (token)
        device = new apn.Device(token);
}

exports.sendApnNotification = sendApnNotification;