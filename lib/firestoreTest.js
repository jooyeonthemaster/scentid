// Firestore 연결 테스트 파일
import { firestore } from './firebase.js';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const testFirestoreConnection = async () => {
  try {
    console.log('Firestore 연결 테스트 시작...');
    
    // 테스트 데이터 작성
    const testRef = doc(firestore, 'test', 'connection');
    await setDoc(testRef, {
      message: 'Firestore 연결 테스트 성공!',
      timestamp: serverTimestamp(),
      testTime: new Date().toISOString()
    });
    
    console.log('✅ Firestore 연결 테스트 성공!');
    return { success: true, message: 'Firestore 연결 성공' };
  } catch (error) {
    console.error('❌ Firestore 연결 테스트 실패:', error);
    return { success: false, error: error.message };
  }
};
