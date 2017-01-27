'use strict';

var admin = require('firebase-admin');

function initialize(pathToCredentials, dbUrl) {
    var fbApp = admin.initializeApp({
        credential: admin.credential.cert(require(pathToCredentials)),
        databaseURL: dbUrl
    });
    module.exports.firebaseDb = fbApp.database();
}

module.exports.initialize = initialize;
