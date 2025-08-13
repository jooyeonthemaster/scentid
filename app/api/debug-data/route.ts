import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../../../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  collectionGroup
} from 'firebase/firestore';

export async function GET() {
  try {
    console.log('🔍 데이터 확인 API 호출됨');
    
    // 먼저 ordeyBy 없이 간단하게 테스트
    const simpleQuery = query(
      collectionGroup(firestore, 'perfumeSessions'),
      limit(10)
    );
    
    const simpleSnapshot = await getDocs(simpleQuery);
    console.log('📊 간단한 쿼리 성공:', simpleSnapshot.size);
    
    const sessions = [];
    simpleSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      
      // 완성 상태 확인 (관리자 페이지와 동일한 로직)
      const getCompletionStatus = () => {
        if (data.confirmation) return '완료';
        if (data.improvedRecipe) return '레시피 생성';
        if (data.feedback) return '피드백 완료';
        if (data.imageAnalysis) return '분석 완료';
        return '진행 중';
      };
      
      sessions.push({
        순서: index + 1,
        id: doc.id,
        status: data.status,
        completionStatus: getCompletionStatus(),
        hasImageAnalysis: !!data.imageAnalysis,
        hasFeedback: !!data.feedback,
        hasRecipe: !!data.improvedRecipe,
        hasConfirmation: !!data.confirmation,
        customerName: data.customerName || '알 수 없음',
        관리자페이지조건: (data.status === 'image_analyzed' && getCompletionStatus() === '분석 완료'),
        updatedAt: data.updatedAt ? data.updatedAt.toString() : null
      });
    });
    
    // status별 카운트
    const statusCounts = {};
    sessions.forEach(session => {
      statusCounts[session.status] = (statusCounts[session.status] || 0) + 1;
    });
    
    return NextResponse.json({
      success: true,
      총세션수: sessions.length,
      status별카운트: statusCounts,
      최근세션들: sessions,
      현재시간: new Date().toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    });
    
  } catch (error) {
    console.error('🔍 데이터 확인 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}
