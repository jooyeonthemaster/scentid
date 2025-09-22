import { NextRequest, NextResponse } from 'next/server';
import { getAllUserData, getSessionFullData, getCachedUserSessionsList, clearSessionCache, cleanupOldSessions, getAllSessionsForDebug } from '../../../lib/firestoreApi';
import { getCachedAdminUserSessionsList, getAdminSessionFullData, clearAdminSessionCache } from '../../../lib/firestoreAdminApi';

/**
 * 관리자용 API 엔드포인트
 * 
 * GET: 모든 사용자 데이터 조회 (분석 내역 목록) - 최적화됨
 * POST: 특정 세션의 상세 데이터 조회 (보고서용) 또는 데이터 정리
 * DELETE: 캐시 초기화 (개발용)
 */

// 모든 사용자 분석 세션 목록 조회 (관리자용) - 최적화됨
export async function GET(request: NextRequest) {
  try {
    console.log('관리자 API: 최적화된 사용자 데이터 조회 시작');
    
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
      console.error('🔥 Firebase 설정 오류:', missingVars);
      return NextResponse.json({
        success: false,
        error: 'Firebase 설정이 완료되지 않았습니다.',
        details: `다음 환경 변수를 @env.txt 파일에 설정해주세요: ${missingVars.join(', ')}`,
        missingVars: missingVars
      }, { status: 503 });
    }
    
    // 쿼리 파라미터에서 페이지네이션 정보 추출
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const lastKeyParam = searchParams.get('lastKey');
    const lastKey = lastKeyParam === 'null' ? null : lastKeyParam;
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    console.log('📊 조회 파라미터:', { limit, lastKey, forceRefresh });
    
    // 디버깅 모드인지 확인
    const debugMode = searchParams.get('debug') === 'true';
    
    let result;
    if (debugMode) {
      // 디버깅 모드: 모든 세션 조회 (필터링 없음)
      console.log('🔍 디버깅 모드: 모든 세션 조회');
      const debugResult = await getAllSessionsForDebug(limit);
      result = {
        sessions: debugResult.sessions,
        hasMore: false,
        lastKey: null,
        total: debugResult.total
      };
    } else {
      // 일반 모드: Admin SDK 사용 (서버사이드에서 권한 문제 해결)
      try {
        result = await getCachedAdminUserSessionsList(limit, lastKey, forceRefresh);
      } catch (adminError) {
        console.warn('Admin SDK 실패, 클라이언트 SDK로 폴백:', adminError);
        // Admin SDK 실패시 기존 클라이언트 SDK 사용
        result = await (getCachedUserSessionsList as any)(limit, lastKey, forceRefresh);
      }
    }
    
    // Firebase 조회 타임아웃 에러 처리
    if (result.error) {
      console.warn('📊 Firebase 조회 에러:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        details: 'Firebase 연결 문제로 데이터를 불러올 수 없습니다.'
      }, { status: 503 }); // Service Unavailable
    }
    
    // 안전한 문자열 변환 함수
    const safeStringify = (value: any): string => {
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return String(value || '');
    };
    
    // 비밀번호 포맷팅 (4자리 숫자)
    const formatPassword = (password: string): string => {
      return password || ''; // 관리자 페이지에서는 비밀번호를 그대로 표시
    };
    
    // 각 세션에 최애 이름 추가 (기존 로직 유지)
    const enhancedSessions = result.sessions.map((session: any) => {
      // 안전한 최애 이름 추출
      let idolName = '분석 중';
      // 상세 분석 데이터가 필요한 경우에만 별도 조회하도록 변경 필요
      // 현재는 기본값으로 처리
      
      return {
        ...session,
        phoneNumber: formatPassword(session.userId),
        idolName: idolName, // 목록에서는 간단히 처리
      };
    });
    
    console.log(`관리자 API: ${enhancedSessions.length}개 세션 조회 완료 (전체: ${result.total})`);
    
    return NextResponse.json({
      success: true,
      totalSessions: result.total,
      sessions: enhancedSessions,
      hasMore: result.hasMore,
      lastKey: result.lastKey,
      cached: !forceRefresh
    });
    
  } catch (error) {
    console.error('관리자 데이터 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '데이터 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

// 캐시 초기화 (개발용)
export async function DELETE() {
  try {
    clearSessionCache();
    clearAdminSessionCache(); // Admin SDK 캐시도 초기화
    
    return NextResponse.json({
      success: true,
      message: '캐시가 초기화되었습니다.'
    });
  } catch (error) {
    console.error('캐시 초기화 오류:', error);
    return NextResponse.json({
      success: false,
      error: '캐시 초기화 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// 특정 세션의 상세 데이터 조회 (보고서용) 또는 데이터 정리
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, sessionId, keepLatestCount, dryRun } = body;
    
    // 🗑️ 데이터 정리 액션
    if (action === 'cleanup') {
      console.log(`🗑️ 관리자 API: 데이터 정리 요청 (최신 ${keepLatestCount || 30}개 유지, 시뮬레이션: ${dryRun !== false})`);
      
      const result = await cleanupOldSessions(
        keepLatestCount || 30,
        dryRun !== false // 기본값은 시뮬레이션 모드
      );
      
      return NextResponse.json({
        success: true,
        action: 'cleanup',
        data: result
      });
    }
    
    // 기존 세션 상세 조회 로직
    console.log(`관리자 API: 세션 상세 조회 - ${userId}/${sessionId}`);
    
    if (!userId || !sessionId) {
      return NextResponse.json({
        success: false,
        error: 'userId와 sessionId가 필요합니다.'
      }, { status: 400 });
    }
    
    // Admin SDK로 세션 상세 조회 시도
    let sessionData;
    try {
      sessionData = await getAdminSessionFullData(userId, sessionId);
    } catch (adminError) {
      console.warn('Admin SDK로 세션 조회 실패, 클라이언트 SDK로 폴백:', adminError);
      sessionData = await getSessionFullData(userId, sessionId);
    }
    
    // 비밀번호 포맷팅
    const formatPassword = (password: string): string => {
      return password || ''; // 관리자 페이지에서는 비밀번호를 그대로 표시
    };
    
    // 응답 데이터에 포맷된 비밀번호 추가
    const responseData = {
      ...sessionData,
      formattedPhone: formatPassword(userId),
      userId: userId,
      sessionId: sessionId
    };
    
    console.log('관리자 API: 세션 상세 데이터 조회 완료');
    
    return NextResponse.json({
      success: true,
      data: responseData
    });
    
  } catch (error) {
    console.error('관리자 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '요청 처리 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 