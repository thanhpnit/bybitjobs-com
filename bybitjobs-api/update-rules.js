const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function updateRules() {
  const source = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
`;
  try {
    const rules = admin.securityRules();
    await rules.releaseFirestoreRulesetFromSource(source);
    console.log("Rules updated successfully!");
  } catch (error) {
    console.error("Failed to update rules:", error);
  }
}

updateRules();
