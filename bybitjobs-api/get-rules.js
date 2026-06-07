const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function getRules() {
  try {
    const rules = admin.securityRules();
    const ruleset = await rules.getFirestoreRuleset();
    console.log("Current rules:");
    console.log(ruleset.source[0].content);
  } catch (error) {
    console.error("Failed to get rules:", error);
  }
}
getRules();
