const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, setDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAJrjqkcxdI7N4tc5H6vF-FnVcCyv3NsLc",
  authDomain: "bybitjobs.firebaseapp.com",
  projectId: "bybitjobs",
  storageBucket: "bybitjobs.firebasestorage.app",
  messagingSenderId: "811135097267",
  appId: "1:811135097267:web:dab5c4e8ea4dee79cd93c6",
  measurementId: "G-9K2536WERT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    await setDoc(doc(db, "test", "test1"), { ok: true });
    console.log("Write success!");
    const snap = await getDocs(collection(db, "packages"));
    console.log("Read success, count:", snap.size);
    process.exit(0);
  } catch (e) {
    console.error("Failed:", e.message);
    process.exit(1);
  }
}
run();
