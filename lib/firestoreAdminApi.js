import { adminDb } from './firebaseAdmin';

// Admin SDK 상태 확인
console.log('🔒 firestoreAdminApi.js 로드됨 - adminDb 상태:', adminDb ? '초기화됨' : 'null');

// 서버사이드 전용: Admin SDK를 사용한 세션 목록 조회
export const getAdminUserSessionsList = async (limitNum = 50, lastKey = null) => {
  try {
    console.log('🔒 Admin SDK로 세션 목록 조회 시작...');
    console.log('🔒 adminDb 상태:', adminDb ? '사용 가능' : 'null - 폴백 필요');
    
    // Admin SDK가 초기화되지 않은 경우 클라이언트 SDK 폴백
    if (!adminDb) {
      console.warn('⚠️ Admin SDK 사용 불가 - 클라이언트 SDK로 폴백');
      const { getUserSessionsList } = await import('./firestoreApi');
      return getUserSessionsList(limitNum, lastKey);
    }
    
    const startTime = Date.now();
    
    // Firestore 컬렉션 그룹 쿼리
    let query = adminDb.collectionGroup('perfumeSessions')
      .orderBy('updatedAt', 'desc')
      .limit(limitNum);
    
    // 페이지네이션 처리
    if (lastKey && typeof lastKey === 'string') {
      try {
        const parts = lastKey.split('|');
        const tsPart = parts.find(p => p.startsWith('ts:')) || '';
        const tsMillis = Number((tsPart.split(':')[1]) || '');
        
        if (!Number.isNaN(tsMillis)) {
          // Admin SDK는 Timestamp 객체 대신 Date 객체 사용
          query = adminDb.collectionGroup('perfumeSessions')
            .orderBy('updatedAt', 'desc')
            .startAfter(new Date(tsMillis))
            .limit(limitNum);
        }
      } catch (e) {
        console.warn('lastKey 파싱 실패, 첫 페이지로 처리');
      }
    }
    
    const querySnapshot = await query.get();
    console.log(`🔒 Admin SDK 쿼리 결과: ${querySnapshot.size}개 문서 조회됨`);
    
    const sessions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const docPath = doc.ref.path;
      
      // path에서 userId 추출
      const pathParts = docPath.split('/');
      const userId = String(pathParts[1]);
      const sessionId = pathParts[3];
      
      // 상태 확인
      const getCompletionStatus = () => {
        if (data.confirmation) return '완료';
        if (data.improvedRecipe) return '레시피 생성';
        if (data.feedback) return '피드백 완료';
        if (data.imageAnalysis) return '분석 완료';
        return '진행 중';
      };
      
      // 타임스탬프 변환 (Admin SDK는 Timestamp 객체 반환)
      const convertTimestamp = (timestamp) => {
        if (!timestamp) return Date.now();
        
        // Admin SDK Timestamp 객체
        if (timestamp && typeof timestamp.toDate === 'function') {
          return timestamp.toDate().getTime();
        }
        
        // 이미 숫자인 경우
        if (typeof timestamp === 'number') {
          return timestamp;
        }
        
        return Date.now();
      };
      
      // 분석이 완료된 세션만 포함
      const validStatuses = ['image_analyzed', 'feedback_given', 'recipe_created', 'confirmed'];
      const hasValidStatus = validStatuses.includes(data.status);
      const hasImageAnalysis = !!data.imageAnalysis;
      
      if (hasValidStatus || hasImageAnalysis) {
        sessions.push({
          userId: userId,
          sessionId: sessionId,
          phoneNumber: userId,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          status: data.status || 'unknown',
          customerName: data.customerName || '알 수 없음',
          hasImageAnalysis: !!data.imageAnalysis,
          hasFeedback: !!data.feedback,
          hasRecipe: !!data.improvedRecipe,
          hasConfirmation: !!data.confirmation,
          completionStatus: getCompletionStatus()
        });
      }
    });
    
    // 정렬
    sessions.sort((a, b) => {
      const timeA = a.updatedAt || a.createdAt || 0;
      const timeB = b.updatedAt || b.createdAt || 0;
      return timeB - timeA;
    });
    
    // 페이지네이션 정보
    const hasMore = querySnapshot.size === limitNum;
    let nextLastKey = null;
    
    if (hasMore && sessions.length > 0) {
      const lastSession = sessions[sessions.length - 1];
      nextLastKey = `ts:${lastSession.updatedAt}|sid:${lastSession.sessionId}`;
    }
    
    // 중복 제거
    const uniqueSessions = [];
    const seenUserIds = new Map();
    
    for (const session of sessions) {
      const existingSession = seenUserIds.get(session.userId);
      const currentTime = session.updatedAt || session.createdAt || 0;
      
      if (!existingSession) {
        seenUserIds.set(session.userId, session);
        uniqueSessions.push(session);
      } else {
        const existingTime = existingSession.updatedAt || existingSession.createdAt || 0;
        if (currentTime > existingTime) {
          const index = uniqueSessions.indexOf(existingSession);
          if (index !== -1) {
            uniqueSessions[index] = session;
          }
          seenUserIds.set(session.userId, session);
        }
      }
    }
    
    const executionTime = Date.now() - startTime;
    console.log(`🔒 Admin SDK 조회 완료: ${uniqueSessions.length}개 고유 세션 (${executionTime}ms)`);
    
    return {
      sessions: uniqueSessions,
      total: uniqueSessions.length,
      hasMore: hasMore,
      lastKey: nextLastKey
    };
    
  } catch (error) {
    console.error('🔒 Admin SDK 세션 조회 오류:', error);
    
    // 오류 발생시 클라이언트 SDK로 폴백
    console.warn('⚠️ Admin SDK 오류 - 클라이언트 SDK로 폴백');
    const { getUserSessionsList } = await import('./firestoreApi');
    return getUserSessionsList(limitNum, lastKey);
  }
};

// 캐시 래퍼 함수
let sessionCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5초

export const getCachedAdminUserSessionsList = async (limitNum = 50, lastKey = null, forceRefresh = false) => {
  const now = Date.now();
  
  // 캐시 유효성 체크
  if (!forceRefresh && sessionCache && !lastKey && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('🔒 Admin SDK 캐시 데이터 반환');
    return { ...sessionCache, cached: true };
  }
  
  // 새로운 데이터 조회
  const result = await getAdminUserSessionsList(limitNum, lastKey);
  
  // 첫 페이지인 경우 캐시 업데이트
  if (!lastKey) {
    sessionCache = result;
    cacheTimestamp = now;
  }
  
  return { ...result, cached: false };
};

// 세션 상세 데이터 조회 (Admin SDK)
export const getAdminSessionFullData = async (userId, sessionId) => {
  try {
    console.log(`🔒 Admin SDK로 세션 상세 조회: ${userId}/${sessionId}`);
    
    if (!adminDb) {
      console.warn('⚠️ Admin SDK 사용 불가 - 클라이언트 SDK로 폴백');
      const { getSessionFullData } = await import('./firestoreApi');
      return getSessionFullData(userId, sessionId);
    }
    
    const sessionRef = adminDb.doc(`users/${userId}/perfumeSessions/${sessionId}`);
    const sessionDoc = await sessionRef.get();
    
    if (!sessionDoc.exists) {
      console.error('세션을 찾을 수 없습니다:', sessionId);
      return null;
    }
    
    const sessionData = sessionDoc.data();
    
    // 타임스탬프 변환
    const convertTimestamp = (timestamp) => {
      if (!timestamp) return null;
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().getTime();
      }
      if (typeof timestamp === 'number') {
        return timestamp;
      }
      return null;
    };
    
    return {
      ...sessionData,
      createdAt: convertTimestamp(sessionData.createdAt),
      updatedAt: convertTimestamp(sessionData.updatedAt),
      userId: userId,
      sessionId: sessionId
    };
    
  } catch (error) {
    console.error('🔒 Admin SDK 세션 상세 조회 오류:', error);
    
    // 오류 발생시 클라이언트 SDK로 폴백
    const { getSessionFullData } = await import('./firestoreApi');
    return getSessionFullData(userId, sessionId);
  }
};

// 캐시 초기화
export const clearAdminSessionCache = () => {
  sessionCache = null;
  cacheTimestamp = 0;
  console.log('🔒 Admin SDK 캐시 초기화됨');
};