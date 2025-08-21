import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../../../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';

export async function GET() {
  try {
    console.log('🔍 [DIRECT-3580] 직접 경로 접근 테스트 시작');
    
    // 1. 직접 3580 경로 접근 테스트
    try {
      const userDocRef = doc(firestore, 'users', '3580');
      const userDocSnap = await getDoc(userDocRef);
      
      console.log(`🔍 users/3580 문서 존재: ${userDocSnap.exists()}`);
      
      if (userDocSnap.exists()) {
        console.log(`🔍 users/3580 데이터:`, userDocSnap.data());
      }
    } catch (userError) {
      console.error('🔍 users/3580 접근 오류:', userError);
    }
    
    // 2. 3580 세션 컬렉션 직접 접근
    try {
      const sessionsRef = collection(firestore, 'users', '3580', 'perfumeSessions');
      const sessionsSnap = await getDocs(sessionsRef);
      
      console.log(`🔍 users/3580/perfumeSessions 세션 수: ${sessionsSnap.size}`);
      
      const sessions = [];
      sessionsSnap.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          sessionId: doc.id,
          status: data.status,
          hasImageAnalysis: !!data.imageAnalysis,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
        console.log(`🔍 [직접조회] sessionId: ${doc.id}, status: ${data.status}`);
      });
      
      return NextResponse.json({
        success: true,
        message: '3580 직접 경로 접근 성공',
        userDocExists: true,
        sessionsCount: sessionsSnap.size,
        sessions: sessions
      });
      
    } catch (sessionsError) {
      console.error('🔍 users/3580/perfumeSessions 접근 오류:', sessionsError);
      
      return NextResponse.json({
        success: false,
        error: '3580 세션 컬렉션 접근 실패',
        details: sessionsError.message
      });
    }
    
  } catch (error) {
    console.error('🔍 [DIRECT-3580] 전체 오류:', error);
    return NextResponse.json({
      success: false,
      error: '3580 직접 접근 테스트 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
