import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
// import { getAnalytics } from 'firebase/analytics'; // 애널리틱스는 지금 당장 필요하지 않으므로 주석 처리

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL, // Realtime Database URL 추가
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app;
let db; // Realtime Database
let firestore; // Firestore
let auth;
let storage;

// 서버와 클라이언트 모두에서 Firebase 초기화
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log('🔥 Firebase 초기화 완료');
} else {
  app = getApp(); // 이미 초기화되었다면 기존 앱을 사용
  console.log('🔥 기존 Firebase 앱 재사용');
}

// 성능 최적화를 위한 설정
try {
  db = getDatabase(app); // Realtime Database 초기화
  firestore = getFirestore(app); // Firestore 초기화
  auth = getAuth(app);
  storage = getStorage(app);
  
  // 개발 환경에서 emulator 연결 (선택사항)
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // 브라우저에서만 실행 (서버사이드 렌더링 방지)
    const isEmulatorConnected = {
      database: false,
      firestore: false,
      auth: false
    };
    
    // Database emulator 연결 (필요시)
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && !isEmulatorConnected.database) {
      try {
        connectDatabaseEmulator(db, 'localhost', 9000);
        isEmulatorConnected.database = true;
        console.log('🔥 Database Emulator 연결됨');
      } catch (e) {
        console.log('🔥 Database Emulator 연결 스킵 (이미 연결됨 또는 불가능)');
      }
    }
  }
  
  console.log('🔥 Firebase 서비스 초기화 완료');
} catch (error) {
  console.error('🔥 Firebase 서비스 초기화 오류:', error);
}

// const analytics = getAnalytics(app); // 애널리틱스는 지금 당장 필요하지 않으므로 주석 처리

export { db, firestore, auth, storage }; 