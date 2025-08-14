import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../../../lib/firebase';
import { 
  collection, 
  getDocs, 
  doc,
  getDoc
} from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '0252'; // 기본값으로 0252 사용
    
    console.log(`🔍 [SPECIFIC-USER] ${userId} 사용자 조회 시작`);
    
    // 1. 해당 사용자의 perfumeSessions 컬렉션 조회
    const sessionsRef = collection(firestore, 'users', userId, 'perfumeSessions');
    const sessionsSnapshot = await getDocs(sessionsRef);
    
    const sessions = [];
    sessionsSnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        status: data.status,
        hasImageAnalysis: !!data.imageAnalysis,
        hasFeedback: !!data.feedback,
        hasRecipe: !!data.improvedRecipe,
        hasConfirmation: !!data.confirmation,
        customerName: data.customerName || '알 수 없음',
        createdAt: data.createdAt ? data.createdAt.toString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toString() : null
      });
    });
    
    console.log(`🔍 [SPECIFIC-USER] ${userId} 사용자의 세션 ${sessions.length}개 발견`);
    
    return NextResponse.json({
      success: true,
      userId: userId,
      userIdType: typeof userId,
      userIdLength: userId.length,
      hasLeadingZero: userId.startsWith('0'),
      sessionCount: sessions.length,
      sessions: sessions,
      message: `사용자 ${userId}의 세션 ${sessions.length}개 조회 완료`
    });
    
  } catch (error) {
    console.error('🔍 [SPECIFIC-USER] 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      details: error
    }, { status: 500 });
  }
}
