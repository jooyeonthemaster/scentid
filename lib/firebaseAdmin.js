import admin from 'firebase-admin';

let adminApp;
let adminDb;

// Firebase Admin SDK 초기화 - 싱글톤 패턴
function initializeAdmin() {
  // 이미 초기화되었으면 기존 인스턴스 반환
  if (admin.apps.length > 0) {
    console.log('🔥 Firebase Admin SDK 이미 초기화됨');
    return admin.app();
  }

  try {
    // 환경 변수에서 서비스 계정 키 가져오기
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      console.log('🔥 서비스 계정 키 발견, Admin SDK 초기화 시작...');
      
      // JSON 파싱 (환경변수의 작은따옴표 제거)
      const serviceAccount = JSON.parse(serviceAccountKey.replace(/^'|'$/g, ''));
      
      // Private Key의 이스케이프된 줄바꿈 문자 처리
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      
      console.log('🔥 Firebase Admin SDK 초기화 성공 (서비스 계정 사용)');
      console.log('🔥 프로젝트 ID:', serviceAccount.project_id);
    } else {
      console.warn('⚠️ 서비스 계정 키가 없음 - 기본 자격증명 시도');
      
      // 기본 자격증명 시도 (Google Cloud 환경)
      adminApp = admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      
      console.log('🔥 Firebase Admin SDK 초기화 (기본 자격증명)');
    }
    
    return adminApp;
    
  } catch (error) {
    console.error('🔥 Firebase Admin SDK 초기화 실패:', error);
    console.error('🔥 오류 상세:', error.message);
    
    // 초기화 실패시 null 반환
    return null;
  }
}

// Admin SDK 초기화
adminApp = initializeAdmin();

if (adminApp) {
  adminDb = admin.firestore();
  
  // settings()는 한 번만 호출되어야 하므로 제거
  // Admin SDK는 기본적으로 undefined properties를 무시함
  
  console.log('🔥 Firestore Admin 인스턴스 생성 완료');
}

export { adminDb };