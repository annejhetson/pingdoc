"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloWorld = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.json({
        message: 'Hello from Firebase!',
        timestamp: Date.now(),
    });
});
//# sourceMappingURL=index.js.map