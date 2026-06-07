const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
async function run() {
  const snapshot = await db.collection('packages').get();
  console.log("Packages count:", snapshot.size);
  snapshot.forEach(doc => console.log(doc.id, doc.data().name));
}
run().catch(console.error);
