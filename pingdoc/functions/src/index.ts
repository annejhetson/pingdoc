import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const helloWorld = functions.https.onRequest(async (request, response) => {
  // Test Firestore
  await admin.firestore().collection('test').doc('hello').set({
    message: 'Hello from Firestore!',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  response.json({
    message: 'Hello from Firebase Functions!',
    timestamp: Date.now(),
    firestore: 'Document written successfully',
    environment: process.env.FUNCTIONS_EMULATOR ? 'emulator' : 'production',
  });
});
