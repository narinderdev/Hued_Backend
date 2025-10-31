const FCM = require('fcm-push');
import config from 'config'
const sendNotification = async function (payload) {
    var serverKey = config.get('serverKey')
    var fcm = new FCM(serverKey);
    var message = {
        to: payload.deviceToken,
        collapse_key: "type_a",
        notification: {
            title: payload.title,
            body: payload.message,
            sound: "default",
        },
        data: {
            body: payload.title,
            title: payload.message
        }
    };
    fcm.send(message, function (err, messageId) {
        if (err) {
            console.log("fcm.send-------Something has gone wrong!", err);
        } else {
            console.log("fcm.send-------Sent with message ID: ", messageId);
        }
    });
};

export default sendNotification;