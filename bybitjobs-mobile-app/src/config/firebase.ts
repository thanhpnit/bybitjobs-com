import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAJrjqkcxdi7N4tc5H6vF-FnVcCyv3NsLc",
  authDomain: "bybitjobs.firebaseapp.com",
  projectId: "bybitjobs",
  storageBucket: "bybitjobs.firebasestorage.app",
  messagingSenderId: "811135097267",
  appId: "1:811135097267:web:dab5c4e8ea4dee79cd93c6",
  measurementId: "G-9K2536WERT"
};

// Khởi tạo app và auth (kiểm tra để tránh lỗi initialize nhiều lần)
let app;
let auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

export { app, auth };
