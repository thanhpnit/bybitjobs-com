import { FirebaseApp, initializeApp, getApp, getApps } from 'firebase/app';
// @ts-ignore
import { Auth, initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAJrjqkcxdI7N4tc5H6vF-FnVcCyv3NsLc",
  authDomain: "bybitjobs.firebaseapp.com",
  projectId: "bybitjobs",
  storageBucket: "bybitjobs.firebasestorage.app",
  messagingSenderId: "811135097267",
  appId: "1:811135097267:web:dab5c4e8ea4dee79cd93c6",
  measurementId: "G-9K2536WERT"
};

// Khởi tạo app và auth (kiểm tra để tránh lỗi initialize nhiều lần)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    // @ts-ignore
    persistence: getReactNativePersistence(AsyncStorage)
  });
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
