import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../../../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy
} from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '3580';
    
    console.log(`🔍 [DEBUG-SPECIFIC-USERID] ${userId} 조사 시작`);
    
    // 특정 userId의 모든 세션 조회
    const sessionsRef = collection(firestore, 'users', userId, 'perfumeSessions');
    const q = query(sessionsRef, orderBy('updatedAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: `userId ${userId}의 세션이 없습니다.`
      });
    }
    
    const sessions = [];
    
    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const sessionId = doc.id;
      
      // 세션 ID에서 타임스탬프 추출
      const extractTimestampFromSessionId = (sessionId) => {
        const match = sessionId.match(/session_(\d+)_/);
        if (match && match[1]) {
          const timestamp = parseInt(match[1]);
          return {
            timestamp,
            date: new Date(timestamp).toLocaleString('ko-KR')
          };
        }
        return null;
      };
      
      const sessionTimestamp = extractTimestampFromSessionId(sessionId);
      
      // Firestore Timestamp 변환
      const convertTimestamp = (timestamp) => {
        if (!timestamp) return null;
        if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
          return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000;
        }
        if (typeof timestamp === 'number') return timestamp;
        return null;
      };
      
      const createdAt = convertTimestamp(data.createdAt);
      const updatedAt = convertTimestamp(data.updatedAt);
      
      sessions.push({
        순서: index + 1,
        sessionId,
        status: data.status,
        customerName: data.customerName || '알 수 없음',
        hasImageAnalysis: !!data.imageAnalysis,
        hasFeedback: !!data.feedback,
        hasRecipe: !!data.improvedRecipe,
        hasConfirmation: !!data.confirmation,
        sessionIdTimestamp: sessionTimestamp,
        firestoreCreatedAt: createdAt ? new Date(createdAt).toLocaleString('ko-KR') : null,
        firestoreUpdatedAt: updatedAt ? new Date(updatedAt).toLocaleString('ko-KR') : null,
        rawCreatedAt: data.createdAt,
        rawUpdatedAt: data.updatedAt,
        completionStatus: (() => {
          if (data.confirmation) return '완료';
          if (data.improvedRecipe) return '레시피 생성';
          if (data.feedback) return '피드백 완료';
          if (data.imageAnalysis) return '분석 완료';
          return '진행 중';
        })()
      });
    });
    
    // 8월 21일 관련 세션 필터링
    const august21Sessions = sessions.filter(session => {
      const sessionTime = session.sessionIdTimestamp?.timestamp;
      if (!sessionTime) return false;
      
      const sessionDate = new Date(sessionTime);
      const august21 = new Date('2025-08-21');
      
      return sessionDate.getFullYear() === august21.getFullYear() &&
             sessionDate.getMonth() === august21.getMonth() &&
             sessionDate.getDate() === august21.getDate();
    });
    
    console.log(`🔍 [DEBUG-SPECIFIC-USERID] userId ${userId} 분석 완료:`);
    console.log(`- 전체 세션: ${sessions.length}개`);
    console.log(`- 8월 21일 세션: ${august21Sessions.length}개`);
    
    return NextResponse.json({
      success: true,
      userId: userId,
      totalSessions: sessions.length,
      august21Sessions: august21Sessions.length,
      allSessions: sessions,
      august21SessionsDetail: august21Sessions,
      message: `userId ${userId}의 ${sessions.length}개 세션 조회 완료 (8월 21일: ${august21Sessions.length}개)`
    });
    
  } catch (error) {
    console.error(`🔍 [DEBUG-SPECIFIC-USERID] 오류:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      details: error
    }, { status: 500 });
  }
}
