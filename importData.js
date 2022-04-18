const { initializeFirebaseApp, restore } = require('firestore-export-import')
// const firebaseConfig = require('./firebaseConfig.js');
const serviceAccount = require('./serviceAccount.json');

// JSON To Firestore
const jsonToFirestore = async () => {
  await initializeFirebaseApp(serviceAccount);
  await restore('./data/data.json');
};

jsonToFirestore();
