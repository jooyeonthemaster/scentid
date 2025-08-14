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
    console.log('🔍 [DEBUG-USERID] API 호출됨');
    
    // 모든 세션을 가져와서 userId 분석 (orderBy 제거하여 인덱스 오류 방지)
    const q = query(
      collectionGroup(firestore, 'perfumeSessions'),
      limit(50)  // 50개 샘플
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: '세션이 없습니다.'
      });
    }
    
    const userIdAnalysis = [];
    const userIdStats = {
      total: 0,
      withLeadingZero: 0,
      withoutLeadingZero: 0,
      imageAnalyzedStatus: 0,
      hasImageAnalysis: 0,
      passesAdminFilter: 0
    };
    
    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const docPath = doc.ref.path;
      const pathParts = docPath.split('/');
      const userId = String(pathParts[1]); // 강제 문자열 변환
      const sessionId = pathParts[3];
      
      // 상태 확인 함수 (관리자 페이지와 동일한 로직)
      const getCompletionStatus = () => {
        if (data.confirmation) return '완료';
        if (data.improvedRecipe) return '레시피 생성';
        if (data.feedback) return '피드백 완료';
        if (data.imageAnalysis) return '분석 완료';
        return '진행 중';
      };
      
      const completionStatus = getCompletionStatus();
      const hasLeadingZero = userId.startsWith('0');
      const isImageAnalyzed = data.status === 'image_analyzed';
      const hasImageAnalysisData = !!data.imageAnalysis;
      const passesOriginalFilter = (isImageAnalyzed && completionStatus === '분석 완료');
      
      userIdStats.total++;
      if (hasLeadingZero) userIdStats.withLeadingZero++;
      else userIdStats.withoutLeadingZero++;
      if (isImageAnalyzed) userIdStats.imageAnalyzedStatus++;
      if (hasImageAnalysisData) userIdStats.hasImageAnalysis++;
      if (passesOriginalFilter) userIdStats.passesAdminFilter++;
      
      userIdAnalysis.push({
        순서: index + 1,
        userId,
        userIdType: typeof userId,
        userIdLength: userId.length,
        hasLeadingZero,
        isNumericUserId: /^\d+$/.test(userId),
        sessionId,
        status: data.status,
        completionStatus,
        hasImageAnalysis: hasImageAnalysisData,
        passesOriginalAdminFilter: passesOriginalFilter,
        customerName: data.customerName || '알 수 없음',
        updatedAt: data.updatedAt ? data.updatedAt.toString() : null
      });
    });
    
    // Leading Zero를 가진 사용자들만 필터링
    const leadingZeroUsers = userIdAnalysis.filter(u => u.hasLeadingZero);
    const nonLeadingZeroUsers = userIdAnalysis.filter(u => !u.hasLeadingZero && u.isNumericUserId);
    
    console.log('🔍 [DEBUG-USERID] 분석 완료:', userIdStats);
    console.log('🔍 [DEBUG-USERID] Leading Zero 사용자:', leadingZeroUsers.length);
    console.log('🔍 [DEBUG-USERID] 일반 숫자 사용자:', nonLeadingZeroUsers.length);
    
    return NextResponse.json({
      success: true,
      statistics: userIdStats,
      leadingZeroUsers: leadingZeroUsers,
      nonLeadingZeroUsers: nonLeadingZeroUsers.slice(0, 5), // 비교용으로 5개만
      sampleAllUsers: userIdAnalysis.slice(0, 10), // 전체 샘플 10개
      message: `총 ${userIdStats.total}개 세션 분석 완료. Leading Zero: ${userIdStats.withLeadingZero}개, 일반: ${userIdStats.withoutLeadingZero}개`
    });
    
  } catch (error) {
    console.error('🔍 [DEBUG-USERID] 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      details: error
    }, { status: 500 });
  }
}
