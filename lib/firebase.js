import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
// import { getAnalytics } from 'firebase/analytics'; // 애널리틱스는 지금 당장 필요하지 않으므로 주석 처리

// Firebase 설정 검증
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => 
  !process.env[varName] || 
  process.env[varName].includes('your_') ||
  process.env[varName] === 'your_api_key_here'
);

if (missingVars.length > 0) {
  console.error('🔥 Firebase 설정 오류: 다음 환경 변수가 설정되지 않았거나 placeholder 값입니다:', missingVars);
  console.error('🔥 @env.txt 파일에 실제 Firebase 설정값을 입력해주세요!');
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // databaseURL은 Firestore 사용으로 더 이상 필요 없음
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app;
let firestore; // Firestore (메인 데이터베이스)
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

// Firestore 중심 설정
try {
  firestore = getFirestore(app); // Firestore 초기화 (메인 데이터베이스)
  auth = getAuth(app);
  storage = getStorage(app);
  
  // 개발 환경에서 Firestore emulator 연결 (선택사항)
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // 브라우저에서만 실행 (서버사이드 렌더링 방지)
    const isEmulatorConnected = {
      firestore: false,
      auth: false
    };
    
    // Firestore emulator 연결 (필요시)
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && !isEmulatorConnected.firestore) {
      try {
        connectFirestoreEmulator(firestore, 'localhost', 8080);
        isEmulatorConnected.firestore = true;
        console.log('🔥 Firestore Emulator 연결됨');
      } catch (e) {
        console.log('🔥 Firestore Emulator 연결 스킵 (이미 연결됨 또는 불가능)');
      }
    }
  }
  
  console.log('🔥 Firestore 서비스 초기화 완료');
} catch (error) {
  console.error('🔥 Firestore 서비스 초기화 오류:', error);
}

// const analytics = getAnalytics(app); // 애널리틱스는 지금 당장 필요하지 않으므로 주석 처리

// Firestore를 메인 데이터베이스로 사용
export { firestore as db, firestore, auth, storage }; 