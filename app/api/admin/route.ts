import { NextRequest, NextResponse } from 'next/server';
import { getAllUserData, getSessionFullData, getCachedUserSessionsList, clearSessionCache } from '../../../lib/firebaseApi';

/**
 * 관리자용 API 엔드포인트
 * 
 * GET: 모든 사용자 데이터 조회 (분석 내역 목록) - 최적화됨
 * POST: 특정 세션의 상세 데이터 조회 (보고서용)
 * DELETE: 캐시 초기화 (개발용)
 */

// 모든 사용자 분석 세션 목록 조회 (관리자용) - 최적화됨
export async function GET(request: NextRequest) {
  try {
    console.log('관리자 API: 최적화된 사용자 데이터 조회 시작');
    
    // 쿼리 파라미터에서 페이지네이션 정보 추출
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const lastKeyParam = searchParams.get('lastKey');
    const lastKey = lastKeyParam === 'null' ? null : lastKeyParam;
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    console.log('📊 조회 파라미터:', { limit, lastKey, forceRefresh });
    
    // 최적화된 캐시된 함수 사용 (타입 문제 해결을 위한 캐스팅)
    const result = await (getCachedUserSessionsList as any)(limit, lastKey, forceRefresh);
    
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

// 특정 세션의 상세 데이터 조회 (보고서용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId } = body;
    
    console.log(`관리자 API: 세션 상세 조회 - ${userId}/${sessionId}`);
    
    if (!userId || !sessionId) {
      return NextResponse.json({
        success: false,
        error: 'userId와 sessionId가 필요합니다.'
      }, { status: 400 });
    }
    
    const sessionData = await getSessionFullData(userId, sessionId);
    
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
    console.error('세션 상세 데이터 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '세션 데이터 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 