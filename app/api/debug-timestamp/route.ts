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
    console.log('🕐 타임스탬프 디버깅 API 호출됨');
    
    // 최신 세션들을 status 제한 없이 가져와서 확인 (새로 분석된 데이터 포함)
    const q = query(
      collectionGroup(firestore, 'perfumeSessions'),
      orderBy('updatedAt', 'desc'),
      limit(5)  // 최신 5개 확인
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: '세션이 없습니다.'
      });
    }
    
    // 최신 세션들의 상태 분석
    const sessionsAnalysis = [];
    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const docPath = doc.ref.path;
      const pathParts = docPath.split('/');
      const userId = pathParts[1];
      const sessionId = pathParts[3];
      
      // 상태 확인 함수 (관리자 페이지와 동일한 로직)
      const getCompletionStatus = () => {
        if (data.confirmation) return '완료';
        if (data.improvedRecipe) return '레시피 생성';
        if (data.feedback) return '피드백 완료';
        if (data.imageAnalysis) return '분석 완료';
        return '진행 중';
      };
      
      sessionsAnalysis.push({
        순서: index + 1,
        userId,
        userIdType: typeof userId,
        userIdLength: String(userId).length,
        isNumericUserId: /^\d+$/.test(String(userId)),
        hasLeadingZero: String(userId).startsWith('0'),
        sessionId,
        status: data.status,
        completionStatus: getCompletionStatus(),
        hasImageAnalysis: !!data.imageAnalysis,
        hasFeedback: !!data.feedback,
        hasRecipe: !!data.improvedRecipe,
        hasConfirmation: !!data.confirmation,
        customerName: data.customerName || '알 수 없음',
        updatedAt: data.updatedAt,
        관리자페이지표시여부: (data.status === 'image_analyzed' && getCompletionStatus() === '분석 완료')
      });
    });
    
    console.log('🔍 최신 세션들 상태 분석:', sessionsAnalysis);
    
    return NextResponse.json({
      success: true,
      analysis: sessionsAnalysis,
      message: `최신 ${sessionsAnalysis.length}개 세션 상태 분석 완료`,
      cacheInfo: {
        note: '관리자 페이지는 5분 캐시를 사용합니다',
        cacheDuration: '5분',
        forceRefreshUrl: '/admin?refresh=true'
      }
    });
    
  } catch (error) {
    console.error('🕐 타임스탬프 디버깅 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      details: error
    }, { status: 500 });
  }
}
