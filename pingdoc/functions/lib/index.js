"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloWorld = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
exports.helloWorld = functions.https.onRequest(async (request, response) => {
    // Test Firestore
    await admin.firestore().collection('test').doc('hello').set({
        message: 'Hello from Firestore!',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    response.json({
        message: 'Hello from Firebase Functions!',
        timestamp: Date.now(),
        firestore: 'Document written successfully',
        environment: process.env.FUNCTIONS_EMULATOR ? 'emulator' : 'production'
    });
});
//# sourceMappingURL=index.js.map