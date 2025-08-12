import { db } from './firebase';
import { ref, set, push, get, update, serverTimestamp } from 'firebase/database';

// 데이터 검증 및 정리 함수
const sanitizeData = (data) => {
  if (data === null || data === undefined) {
    return null;
  }
  
  if (typeof data === 'object' && !Array.isArray(data)) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          const nestedSanitized = sanitizeData(value);
          if (nestedSanitized && Object.keys(nestedSanitized).length > 0) {
            sanitized[key] = nestedSanitized;
          }
        } else if (Array.isArray(value)) {
          const arrayFiltered = value.filter(item => item !== undefined && item !== null);
          if (arrayFiltered.length > 0) {
            sanitized[key] = arrayFiltered.map(item => sanitizeData(item));
          }
        } else {
          sanitized[key] = value;
        }
      }
    }
    return Object.keys(sanitized).length > 0 ? sanitized : null;
  }
  
  if (Array.isArray(data)) {
    const filtered = data.filter(item => item !== undefined && item !== null);
    return filtered.map(item => sanitizeData(item));
  }
  
  return data;
};

// Firebase 권한 오류 처리 함수
const handleFirebaseError = (error, operation) => {
  console.error(`Firebase ${operation} 오류:`, error);
  
  if (error.code === 'PERMISSION_DENIED') {
    console.warn('Firebase 권한 오류 - 개발 모드에서는 무시하고 계속 진행합니다.');
    return { warning: 'Permission denied - continuing in development mode' };
  }
  
  throw error;
};

// 안전한 Firebase 업데이트 함수
const safeUpdate = async (ref, data, operation = 'update') => {
  try {
    const sanitizedData = sanitizeData(data);
    if (!sanitizedData || Object.keys(sanitizedData).length === 0) {
      console.warn(`${operation}: 저장할 유효한 데이터가 없습니다.`);
      return { warning: 'No valid data to save' };
    }
    
    await update(ref, sanitizedData);
    return { success: true };
  } catch (error) {
    return handleFirebaseError(error, operation);
  }
};

// 안전한 Firebase 설정 함수
const safeSet = async (ref, data, operation = 'set') => {
  try {
    const sanitizedData = sanitizeData(data);
    if (!sanitizedData) {
      console.warn(`${operation}: 저장할 유효한 데이터가 없습니다.`);
      return { warning: 'No valid data to save' };
    }
    
    await set(ref, sanitizedData);
    return { success: true, key: ref.key };
  } catch (error) {
    return handleFirebaseError(error, operation);
  }
};

// 이미지 분석 결과 저장 함수 (예시)
export const saveImageAnalysis = async (userId, analysisData) => {
  try {
    const analysesRef = ref(db, `users/${userId}/imageAnalyses`);
    const newAnalysisRef = push(analysesRef); // 새로운 고유 키 생성
    await set(newAnalysisRef, {
      ...analysisData,
      timestamp: serverTimestamp(), // 서버 시간 기준으로 타임스탬프 기록
    });
    console.log('Image analysis saved successfully with id: ', newAnalysisRef.key);
    return newAnalysisRef.key; // 저장된 데이터의 키 반환
  } catch (error) {
    console.error('Error saving image analysis: ', error);
    throw error;
  }
};

// 이미지 분석 기반 향수 추천 저장 함수
export const savePerfumeRecommendation = async (userId, analysisId, recommendationData) => {
  try {
    const recommendationsRef = ref(db, `users/${userId}/perfumeRecommendations`);
    const newRecommendationRef = push(recommendationsRef);
    await set(newRecommendationRef, {
      basedOnAnalysisId: analysisId, // 어떤 분석 결과를 기반으로 추천했는지 ID 저장
      ...recommendationData, // 예: { recommendedPerfumes: ['향수A', '향수B'], reason: '...', otherDetails: {} }
      timestamp: serverTimestamp(),
    });
    console.log('Perfume recommendation saved successfully with id: ', newRecommendationRef.key);
    return newRecommendationRef.key;
  } catch (error) {
    console.error('Error saving perfume recommendation: ', error);
    throw error;
  }
};

// 피드백 저장 함수
export const saveFeedback = async (userId, recommendationId, feedbackData) => {
  try {
    const feedbacksRef = ref(db, `users/${userId}/feedbacks`);
    const newFeedbackRef = push(feedbacksRef);
    await set(newFeedbackRef, {
      basedOnRecommendationId: recommendationId, // 어떤 향수 추천에 대한 피드백인지 ID 저장
      ...feedbackData, // 예: { rating: 5, comment: '...', likedPerfumes: [], dislikedPerfumes: [] }
      timestamp: serverTimestamp(),
    });
    console.log('Feedback saved successfully with id: ', newFeedbackRef.key);
    return newFeedbackRef.key;
  } catch (error) {
    console.error('Error saving feedback: ', error);
    throw error;
  }
};

// 피드백 기반 테스팅 향 추천 저장 함수
export const saveTestingRecommendation = async (userId, feedbackId, testingRecommendationData) => {
  try {
    const testingRecsRef = ref(db, `users/${userId}/testingRecommendations`);
    const newTestingRecRef = push(testingRecsRef);
    await set(newTestingRecRef, {
      basedOnFeedbackId: feedbackId, // 어떤 피드백을 기반으로 추천했는지 ID 저장
      ...testingRecommendationData, // 예: { recommendedPerfumes: ['향수C', '향수D'], reason: '...' }
      timestamp: serverTimestamp(),
    });
    console.log('Testing recommendation saved successfully with id: ', newTestingRecRef.key);
    return newTestingRecRef.key;
  } catch (error) {
    console.error('Error saving testing recommendation: ', error);
    throw error;
  }
};

// 세션 생성 함수 (전체 플로우의 시작)
export const createPerfumeSession = async (userId, sessionData) => {
  try {
    const sessionsRef = ref(db, `users/${userId}/perfumeSessions`);
    const newSessionRef = push(sessionsRef);
    await set(newSessionRef, {
      ...sessionData,
      sessionId: newSessionRef.key,
      status: 'started', // started, image_analyzed, feedback_given, recipe_created, confirmed
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('향수 세션 생성 완료:', newSessionRef.key);
    return newSessionRef.key;
  } catch (error) {
    console.error('향수 세션 생성 오류:', error);
    throw error;
  }
};

// 이미지 분석 결과 및 이미지 링크 저장 함수 (개선)
export const saveImageAnalysisWithLink = async (userId, sessionId, analysisData, imageUrl) => {
  try {
    console.log('🔥 saveImageAnalysisWithLink 호출됨:', { userId, sessionId, hasAnalysisData: !!analysisData, imageUrl });
    
    // 데이터 검증 및 정리
    const sanitizedAnalysis = sanitizeData(analysisData);
    if (!sanitizedAnalysis) {
      console.warn('이미지 분석 데이터가 비어있거나 유효하지 않습니다.');
      return { warning: 'No valid analysis data' };
    }
    
    const sessionRef = ref(db, `users/${userId}/perfumeSessions/${sessionId}`);
    
    // 먼저 세션이 존재하는지 확인 (안전한 방식으로)
    let sessionSnapshot;
    try {
      sessionSnapshot = await get(sessionRef);
    } catch (getError) {
      console.warn('세션 조회 중 오류 발생:', getError);
      sessionSnapshot = { exists: () => false }; // 기본값
    }
    
    let sessionResult;
    if (!sessionSnapshot.exists()) {
      // 세션이 존재하지 않으면 새로 생성
      console.log('세션이 존재하지 않아 새로 생성합니다:', sessionId);
      const newSessionData = {
        sessionId: sessionId,
        userId: userId,
        status: 'image_analyzed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        imageUrl: imageUrl,
        imageAnalysis: sanitizedAnalysis,
      };
      sessionResult = await safeSet(sessionRef, newSessionData, 'new session creation');
    } else {
      // 세션이 존재하면 업데이트
      console.log('기존 세션을 업데이트합니다:', sessionId);
      const updateData = {
        imageUrl: imageUrl,
        imageAnalysis: sanitizedAnalysis,
        status: 'image_analyzed',
        updatedAt: serverTimestamp(),
      };
      sessionResult = await safeUpdate(sessionRef, updateData, 'session image analysis update');
    }
    
    // 별도로 이미지 분석 기록도 저장
    const analysesRef = ref(db, `users/${userId}/imageAnalyses`);
    const newAnalysisRef = push(analysesRef);
    const analysisRecord = {
      sessionId: sessionId,
      imageUrl: imageUrl,
      ...sanitizedAnalysis,
      timestamp: serverTimestamp(),
    };
    
    const analysisResult = await safeSet(newAnalysisRef, analysisRecord, 'analysis record');
    
    console.log('🔥 이미지 분석 및 링크 저장 완료:', {
      sessionResult,
      analysisResult
    });
    
    return { 
      sessionUpdated: sessionResult.success || sessionResult.warning,
      analysisId: analysisResult.key || 'warning-mode',
      warnings: [sessionResult.warning, analysisResult.warning].filter(Boolean)
    };
  } catch (error) {
    console.error('🔥 이미지 분석 저장 오류:', error);
    return handleFirebaseError(error, 'save image analysis');
  }
};

// 세션별 피드백 저장 함수
export const saveSessionFeedback = async (userId, sessionId, feedbackData) => {
  try {
    console.log('🔥 saveSessionFeedback 호출됨:', { userId, sessionId, feedbackDataKeys: Object.keys(feedbackData || {}) });
    
    // 데이터 검증 및 정리
    const sanitizedFeedback = sanitizeData(feedbackData);
    if (!sanitizedFeedback) {
      console.warn('피드백 데이터가 비어있거나 유효하지 않습니다.');
      return { warning: 'No valid feedback data' };
    }
    
    console.log('🔥 정리된 피드백 데이터:', {
      keys: Object.keys(sanitizedFeedback),
      hasPerfumeName: !!sanitizedFeedback.perfumeName,
      perfumeName: sanitizedFeedback.perfumeName
    });
    
    const sessionRef = ref(db, `users/${userId}/perfumeSessions/${sessionId}`);
    const sessionUpdateResult = await safeUpdate(sessionRef, {
      feedback: sanitizedFeedback,
      status: 'feedback_given',
      updatedAt: serverTimestamp(),
    }, 'session feedback update');
    
    // 별도로 피드백 기록도 저장
    const feedbacksRef = ref(db, `users/${userId}/feedbacks`);
    const newFeedbackRef = push(feedbacksRef);
    const feedbackRecord = {
      sessionId: sessionId,
      ...sanitizedFeedback,
      timestamp: serverTimestamp(),
    };
    
    const feedbackSetResult = await safeSet(newFeedbackRef, feedbackRecord, 'feedback record');
    
    console.log('🔥 세션 피드백 저장 완료:', { 
      sessionUpdate: sessionUpdateResult, 
      feedbackRecord: feedbackSetResult 
    });
    
    return { 
      sessionUpdated: sessionUpdateResult.success || sessionUpdateResult.warning, 
      feedbackId: feedbackSetResult.key || 'warning-mode',
      warnings: [sessionUpdateResult.warning, feedbackSetResult.warning].filter(Boolean)
    };
  } catch (error) {
    console.error('🔥 세션 피드백 저장 오류:', error);
    return handleFirebaseError(error, 'save session feedback');
  }
};

// 개선된 레시피 저장 함수
export const saveImprovedRecipe = async (userId, sessionId, recipeData, analysisId = null) => {
  try {
    console.log('🔥 saveImprovedRecipe 호출됨:', { userId, sessionId, analysisId, recipeDataKeys: Object.keys(recipeData || {}) });
    
    // 데이터 검증 및 정리
    const sanitizedRecipe = sanitizeData(recipeData);
    if (!sanitizedRecipe) {
      console.warn('레시피 데이터가 비어있거나 유효하지 않습니다.');
      return { warning: 'No valid recipe data' };
    }
    
    console.log('🔥 정리된 레시피 데이터:', {
      keys: Object.keys(sanitizedRecipe),
      hasOriginalPerfumeId: !!sanitizedRecipe.originalPerfumeId,
      hasImprovedRecipe: !!sanitizedRecipe.improvedRecipe,
      analysisId: analysisId
    });
    
    const sessionRef = ref(db, `users/${userId}/perfumeSessions/${sessionId}`);
    const sessionUpdateResult = await safeUpdate(sessionRef, {
      improvedRecipe: sanitizedRecipe,
      status: 'recipe_created',
      updatedAt: serverTimestamp(),
    }, 'session recipe update');
    
    // 별도로 레시피 기록도 저장 (analysisId 포함)
    const recipesRef = ref(db, `users/${userId}/recipes`);
    const newRecipeRef = push(recipesRef);
    const recipeToSave = {
      sessionId: sessionId,
      analysisId: analysisId, // 이미지 분석 ID 추가
      ...sanitizedRecipe,
      timestamp: serverTimestamp(),
    };
    
    console.log('🔥 recipes 컬렉션에 저장할 데이터:', {
      recipeId: newRecipeRef.key,
      sessionId: sessionId,
      analysisId: analysisId,
      originalPerfumeId: sanitizedRecipe.originalPerfumeId,
      originalPerfumeName: sanitizedRecipe.originalPerfumeName
    });
    
    const recipeSetResult = await safeSet(newRecipeRef, recipeToSave, 'recipe record');
    
    console.log('🔥 개선된 레시피 저장 완료:', {
      sessionUpdate: sessionUpdateResult,
      recipeRecord: recipeSetResult
    });
    
    return { 
      sessionUpdated: sessionUpdateResult.success || sessionUpdateResult.warning,
      recipeId: recipeSetResult.key || 'warning-mode',
      warnings: [sessionUpdateResult.warning, recipeSetResult.warning].filter(Boolean)
    };
  } catch (error) {
    console.error('🔥 개선된 레시피 저장 오류:', error);
    return handleFirebaseError(error, 'save improved recipe');
  }
};

// 향 확정 함수
export const confirmPerfume = async (userId, sessionId, confirmationData) => {
  try {
    const sessionRef = ref(db, `users/${userId}/perfumeSessions/${sessionId}`);
    await update(sessionRef, {
      confirmation: {
        ...confirmationData,
        confirmedAt: serverTimestamp(),
      },
      status: 'confirmed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // 별도로 확정된 향수 기록도 저장
    const confirmedPerfumesRef = ref(db, `users/${userId}/confirmedPerfumes`);
    const newConfirmationRef = push(confirmedPerfumesRef);
    await set(newConfirmationRef, {
      sessionId: sessionId,
      ...confirmationData,
      timestamp: serverTimestamp(),
    });
    
    console.log('향수 확정 완료');
    return { sessionCompleted: true, confirmationId: newConfirmationRef.key };
  } catch (error) {
    console.error('향수 확정 오류:', error);
    throw error;
  }
};

// 세션 조회 함수
export const getPerfumeSession = async (userId, sessionId) => {
  try {
    const sessionRef = ref(db, `users/${userId}/perfumeSessions/${sessionId}`);
    const snapshot = await get(sessionRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      throw new Error('세션을 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('세션 조회 오류:', error);
    throw error;
  }
};

// 사용자의 모든 세션 조회 함수
export const getUserSessions = async (userId) => {
  try {
    const sessionsRef = ref(db, `users/${userId}/perfumeSessions`);
    const snapshot = await get(sessionsRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return {};
    }
  } catch (error) {
    console.error('사용자 세션 조회 오류:', error);
    throw error;
  }
};

// 관리자용: 모든 사용자 데이터 조회 함수
export const getAllUserData = async () => {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return {};
    }
  } catch (error) {
    console.error('모든 사용자 데이터 조회 오류:', error);
    throw error;
  }
};

// 관리자용: 최적화된 사용자 세션 목록 조회 함수 (새로 추가)
export const getUserSessionsList = async (limit = 50, lastKey = null) => {
  try {
    console.log('📊 최적화된 세션 목록 조회 시작... (분석 완료만)');
    
    // 📊 배포 환경 최적화: 타임아웃과 제한된 조회
    const startTime = Date.now();
    const timeoutMs = 25000; // 25초 타임아웃
    
    // 전체 사용자 스캔 대신 필요한 데이터만 조회
    const usersRef = ref(db, 'users');
    
    // 타임아웃 Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Firebase 조회 시간 초과 (25초)'));
      }, timeoutMs);
    });
    
    // Firebase 조회 Promise
    const queryPromise = get(usersRef);
    
    // 타임아웃과 함께 실행
    const snapshot = await Promise.race([queryPromise, timeoutPromise]);
    
    if (!snapshot.exists()) {
      console.log('📊 사용자 데이터가 없습니다.');
      return { sessions: [], hasMore: false, lastKey: null, total: 0 };
    }
    
    const allData = snapshot.val();
    const sessionsList = [];
    
    console.log(`📊 데이터 조회 완료 (${Date.now() - startTime}ms), 사용자 수: ${Object.keys(allData).length}`);
    
    // 각 사용자의 perfumeSessions만 추출하여 처리
    Object.keys(allData).forEach(userId => {
      const userData = allData[userId];
      if (userData.perfumeSessions) {
        Object.keys(userData.perfumeSessions).forEach(sessionId => {
          const session = userData.perfumeSessions[sessionId];
          
          // 상태 확인 함수
          const getCompletionStatus = () => {
            if (session.confirmation) return '완료';
            if (session.improvedRecipe) return '레시피 생성';
            if (session.feedback) return '피드백 완료';
            if (session.imageAnalysis) return '분석 완료';
            return '진행 중';
          };
          
          const completionStatus = getCompletionStatus();
          
          // "분석 완료" 상태만 필터링
          if (completionStatus === '분석 완료') {
            // 필요한 기본 정보만 추출 (상세 정보는 제외)
            sessionsList.push({
              userId: userId,
              sessionId: sessionId,
              phoneNumber: userId,
              createdAt: session.createdAt || session.updatedAt || Date.now(),
              updatedAt: session.updatedAt || session.createdAt || Date.now(),
              status: session.status || 'unknown',
              customerName: session.customerName || '알 수 없음',
              hasImageAnalysis: !!session.imageAnalysis,
              hasFeedback: !!session.feedback,
              hasRecipe: !!session.improvedRecipe,
              hasConfirmation: !!session.confirmation,
              completionStatus: completionStatus
            });
          }
        });
      }
    });
    
    // 최신순 정렬
    sessionsList.sort((a, b) => {
      const timeA = a.updatedAt || a.createdAt || 0;
      const timeB = b.updatedAt || b.createdAt || 0;
      return timeB - timeA;
    });
    
    // 페이지네이션 적용
    const startIndex = lastKey ? sessionsList.findIndex(s => 
      `${s.userId}_${s.sessionId}` === lastKey) + 1 : 0;
    const endIndex = Math.min(startIndex + limit, sessionsList.length);
    const paginatedSessions = sessionsList.slice(startIndex, endIndex);
    
    const hasMore = endIndex < sessionsList.length;
    const newLastKey = hasMore ? `${paginatedSessions[paginatedSessions.length - 1].userId}_${paginatedSessions[paginatedSessions.length - 1].sessionId}` : null;
    
    console.log(`📊 분석 완료 세션 조회 완료: ${paginatedSessions.length}/${sessionsList.length} (전체에서 필터링됨)`);
    
    return {
      sessions: paginatedSessions,
      hasMore,
      lastKey: newLastKey,
      total: sessionsList.length
    };
    
  } catch (error) {
    console.error('최적화된 세션 목록 조회 오류:', error);
    
    // 배포 환경에서 타임아웃 에러 처리
    if (error.message?.includes('시간 초과') || error.message?.includes('timeout')) {
      console.warn('📊 Firebase 조회 타임아웃 - 빈 결과 반환');
      return { 
        sessions: [], 
        hasMore: false, 
        lastKey: null, 
        total: 0,
        error: 'Firebase 조회 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'
      };
    }
    
    throw error;
  }
};

// 캐시를 위한 간단한 메모리 저장소
const sessionCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 관리자용: 캐시된 세션 목록 조회
export const getCachedUserSessionsList = async (limit = 50, lastKey = null, forceRefresh = false) => {
  const cacheKey = `sessions_${limit}_${lastKey || 'first'}`;
  
  if (!forceRefresh && sessionCache.has(cacheKey)) {
    const cached = sessionCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📊 캐시된 세션 목록 반환');
      return cached.data;
    }
  }
  
  const data = await getUserSessionsList(limit, lastKey);
  sessionCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  return data;
};

// 캐시 초기화 함수
export const clearSessionCache = () => {
  sessionCache.clear();
  console.log('📊 세션 캐시 초기화 완료');
};

// 관리자용: 특정 세션의 전체 데이터 조회 함수
export const getSessionFullData = async (userId, sessionId) => {
  try {
    // 세션 기본 정보
    const sessionRef = ref(db, `users/${userId}/perfumeSessions/${sessionId}`);
    const sessionSnapshot = await get(sessionRef);
    
    // 관련 이미지 분석 데이터
    const analysesRef = ref(db, `users/${userId}/imageAnalyses`);
    const analysesSnapshot = await get(analysesRef);
    
    // 관련 피드백 데이터
    const feedbacksRef = ref(db, `users/${userId}/feedbacks`);
    const feedbacksSnapshot = await get(feedbacksRef);
    
    // 관련 레시피 데이터
    const recipesRef = ref(db, `users/${userId}/recipes`);
    const recipesSnapshot = await get(recipesRef);
    
    // 관련 확정 데이터
    const confirmedRef = ref(db, `users/${userId}/confirmedPerfumes`);
    const confirmedSnapshot = await get(confirmedRef);
    
    const result = {
      session: sessionSnapshot.exists() ? sessionSnapshot.val() : null,
      analyses: [],
      feedbacks: [],
      recipes: [],
      confirmed: []
    };
    
    // sessionId와 일치하는 데이터만 필터링
    if (analysesSnapshot.exists()) {
      const analyses = analysesSnapshot.val();
      result.analyses = Object.keys(analyses)
        .filter(key => analyses[key].sessionId === sessionId)
        .map(key => ({ id: key, ...analyses[key] }));
    }
    
    if (feedbacksSnapshot.exists()) {
      const feedbacks = feedbacksSnapshot.val();
      result.feedbacks = Object.keys(feedbacks)
        .filter(key => feedbacks[key].sessionId === sessionId)
        .map(key => ({ id: key, ...feedbacks[key] }));
    }
    
    if (recipesSnapshot.exists()) {
      const recipes = recipesSnapshot.val();
      result.recipes = Object.keys(recipes)
        .filter(key => recipes[key].sessionId === sessionId)
        .map(key => ({ id: key, ...recipes[key] }));
    }
    
    if (confirmedSnapshot.exists()) {
      const confirmed = confirmedSnapshot.val();
      result.confirmed = Object.keys(confirmed)
        .filter(key => confirmed[key].sessionId === sessionId)
        .map(key => ({ id: key, ...confirmed[key] }));
    }
    
    return result;
  } catch (error) {
    console.error('세션 전체 데이터 조회 오류:', error);
    throw error;
  }
};

// 이미지 분석별 레시피 히스토리 조회 함수 (이전 getSessionRecipes에서 변경)
export const getAnalysisRecipes = async (userId, analysisId) => {
  try {
    console.log('🔍 getAnalysisRecipes 호출됨:', { userId, analysisId });
    
    const recipesRef = ref(db, `users/${userId}/recipes`);
    const snapshot = await get(recipesRef);
    
    if (snapshot.exists()) {
      const allRecipes = snapshot.val();
      console.log('🔍 전체 레시피 데이터:', {
        totalRecipes: Object.keys(allRecipes).length,
        recipeIds: Object.keys(allRecipes),
        analysisIds: Object.keys(allRecipes).map(key => ({ id: key, analysisId: allRecipes[key].analysisId }))
      });
      
      const analysisRecipes = Object.keys(allRecipes)
        .filter(key => {
          const recipeAnalysisId = allRecipes[key].analysisId;
          const match = recipeAnalysisId === analysisId;
          console.log('🔍 분석 매칭 체크:', { recipeId: key, recipeAnalysisId, targetAnalysisId: analysisId, match });
          return match;
        })
        .map(key => ({ 
          id: key, 
          ...allRecipes[key],
          createdAt: allRecipes[key].timestamp || allRecipes[key].generatedAt
        }))
        .sort((a, b) => {
          // 타임스탬프로 최신순 정렬
          const timeA = a.createdAt || 0;
          const timeB = b.createdAt || 0;
          return timeB - timeA;
        });
      
      console.log(`🔍 분석 ${analysisId}의 레시피 ${analysisRecipes.length}개 조회 완료`);
      return analysisRecipes;
    } else {
      console.log('🔍 레시피 데이터가 없습니다.');
      return [];
    }
  } catch (error) {
    console.error('🔍 분석별 레시피 조회 오류:', error);
    throw error;
  }
};

// 기존 getSessionRecipes 함수는 하위호환성을 위해 유지하되, 내부적으로 getAnalysisRecipes 사용
export const getSessionRecipes = async (userId, sessionId) => {
  try {
    console.log('🔍 getSessionRecipes 호출됨 (하위호환):', { userId, sessionId });
    
    const recipesRef = ref(db, `users/${userId}/recipes`);
    const snapshot = await get(recipesRef);
    
    if (snapshot.exists()) {
      const allRecipes = snapshot.val();
      console.log('🔍 전체 레시피 데이터:', {
        totalRecipes: Object.keys(allRecipes).length,
        recipeIds: Object.keys(allRecipes),
        sessionIds: Object.keys(allRecipes).map(key => ({ id: key, sessionId: allRecipes[key].sessionId }))
      });
      
      const sessionRecipes = Object.keys(allRecipes)
        .filter(key => {
          const recipeSessionId = allRecipes[key].sessionId;
          const match = recipeSessionId === sessionId;
          console.log('🔍 세션 매칭 체크:', { recipeId: key, recipeSessionId, targetSessionId: sessionId, match });
          return match;
        })
        .map(key => ({ 
          id: key, 
          ...allRecipes[key],
          createdAt: allRecipes[key].timestamp || allRecipes[key].generatedAt
        }))
        .sort((a, b) => {
          // 타임스탬프로 최신순 정렬
          const timeA = a.createdAt || 0;
          const timeB = b.createdAt || 0;
          return timeB - timeA;
        });
      
      console.log(`🔍 세션 ${sessionId}의 레시피 ${sessionRecipes.length}개 조회 완료`);
      return sessionRecipes;
    } else {
      console.log('🔍 레시피 데이터가 없습니다.');
      return [];
    }
  } catch (error) {
    console.error('🔍 세션 레시피 조회 오류:', error);
    throw error;
  }
};

// 특정 레시피 상세 조회 함수
export const getRecipeById = async (userId, recipeId) => {
  try {
    const recipeRef = ref(db, `users/${userId}/recipes/${recipeId}`);
    const snapshot = await get(recipeRef);
    
    if (snapshot.exists()) {
      return { id: recipeId, ...snapshot.val() };
    } else {
      throw new Error('레시피를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('레시피 상세 조회 오류:', error);
    throw error;
  }
};

// 선택한 레시피를 세션의 현재 레시피로 설정하는 함수
export const setSessionActiveRecipe = async (userId, sessionId, recipeData) => {
  try {
    const sessionRef = ref(db, `users/${userId}/perfumeSessions/${sessionId}`);
    await update(sessionRef, {
      improvedRecipe: {
        ...recipeData,
        selectedFromHistory: true,
        reactivatedAt: serverTimestamp()
      },
      status: 'recipe_selected',
      updatedAt: serverTimestamp(),
    });
    
    console.log('세션의 활성 레시피 설정 완료');
    return { success: true, message: '이전 레시피가 활성화되었습니다.' };
  } catch (error) {
    console.error('활성 레시피 설정 오류:', error);
    throw error;
  }
};

// 레시피 즐겨찾기/북마크 기능
export const toggleRecipeBookmark = async (userId, recipeId, isBookmarked) => {
  try {
    const recipeRef = ref(db, `users/${userId}/recipes/${recipeId}`);
    await update(recipeRef, {
      isBookmarked: isBookmarked,
      bookmarkedAt: isBookmarked ? serverTimestamp() : null,
    });
    
    console.log(`레시피 북마크 ${isBookmarked ? '추가' : '제거'} 완료`);
    return { success: true, isBookmarked };
  } catch (error) {
    console.error('레시피 북마크 오류:', error);
    throw error;
  }
};

// 🗑️ 관리자용: 오래된 데이터 정리 함수
export const cleanupOldSessions = async (keepLatestCount = 30, dryRun = true) => {
  try {
    console.log(`🗑️ 데이터 정리 시작 (최신 ${keepLatestCount}개 유지, 시뮬레이션: ${dryRun})`);
    
    const startTime = Date.now();
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      return { 
        success: true, 
        message: '삭제할 데이터가 없습니다.',
        deletedCount: 0,
        keptCount: 0
      };
    }
    
    const allData = snapshot.val();
    const allSessions = [];
    
    // 모든 세션 수집 및 시간순 정렬
    Object.keys(allData).forEach(userId => {
      const userData = allData[userId];
      if (userData.perfumeSessions) {
        Object.keys(userData.perfumeSessions).forEach(sessionId => {
          const session = userData.perfumeSessions[sessionId];
          allSessions.push({
            userId,
            sessionId,
            createdAt: session.createdAt || session.updatedAt || 0,
            updatedAt: session.updatedAt || session.createdAt || 0,
            sessionPath: `users/${userId}/perfumeSessions/${sessionId}`,
            customerName: session.customerName || '알 수 없음'
          });
        });
      }
    });
    
    // 최신순으로 정렬 (updatedAt 기준)
    allSessions.sort((a, b) => {
      const timeA = a.updatedAt || a.createdAt || 0;
      const timeB = b.updatedAt || b.createdAt || 0;
      return timeB - timeA; // 최신 먼저
    });
    
    const totalSessions = allSessions.length;
    const sessionsToKeep = allSessions.slice(0, keepLatestCount);
    const sessionsToDelete = allSessions.slice(keepLatestCount);
    
    console.log(`📊 전체 세션: ${totalSessions}개`);
    console.log(`📊 유지할 세션: ${sessionsToKeep.length}개`);
    console.log(`📊 삭제할 세션: ${sessionsToDelete.length}개`);
    
    let deletedCount = 0;
    const deletionLog = [];
    
    if (!dryRun && sessionsToDelete.length > 0) {
      console.log('🗑️ 실제 삭제 시작...');
      
      // 배치로 삭제 (너무 많으면 나누어서)
      const batchSize = 50;
      for (let i = 0; i < sessionsToDelete.length; i += batchSize) {
        const batch = sessionsToDelete.slice(i, i + batchSize);
        
        for (const sessionInfo of batch) {
          try {
            // 연관된 데이터도 함께 삭제
            await Promise.all([
              // 세션 삭제
              set(ref(db, sessionInfo.sessionPath), null),
              // 관련 분석 데이터 삭제
              cleanupUserRelatedData(sessionInfo.userId, sessionInfo.sessionId),
            ]);
            
            deletedCount++;
            deletionLog.push({
              userId: sessionInfo.userId,
              sessionId: sessionInfo.sessionId,
              customerName: sessionInfo.customerName,
              deletedAt: new Date().toISOString()
            });
            
            // 진행 상황 로그
            if (deletedCount % 10 === 0) {
              console.log(`🗑️ 삭제 진행: ${deletedCount}/${sessionsToDelete.length}`);
            }
          } catch (deleteError) {
            console.error(`세션 삭제 오류 (${sessionInfo.sessionPath}):`, deleteError);
          }
        }
        
        // 배치 간 잠시 대기 (Firebase 부하 분산)
        if (i + batchSize < sessionsToDelete.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    const result = {
      success: true,
      dryRun,
      totalSessions,
      keptCount: sessionsToKeep.length,
      deletedCount: dryRun ? sessionsToDelete.length : deletedCount,
      estimatedDeleteCount: sessionsToDelete.length,
      executionTime: Date.now() - startTime,
      keptSessions: sessionsToKeep.slice(0, 5).map(s => ({ // 최신 5개만 미리보기
        userId: s.userId,
        sessionId: s.sessionId,
        customerName: s.customerName,
        updatedAt: s.updatedAt
      })),
      deletionLog: dryRun ? sessionsToDelete.slice(0, 10).map(s => ({ // 시뮬레이션에서는 처음 10개만
        userId: s.userId,
        sessionId: s.sessionId,
        customerName: s.customerName,
        wouldBeDeleted: true
      })) : deletionLog
    };
    
    console.log(`🗑️ 데이터 정리 완료 (${result.executionTime}ms)`);
    return result;
    
  } catch (error) {
    console.error('🗑️ 데이터 정리 오류:', error);
    throw error;
  }
};

// 🗑️ 사용자 관련 데이터 정리 (세션 삭제 시 함께 정리)
const cleanupUserRelatedData = async (userId, sessionId) => {
  try {
    // 해당 세션과 관련된 분석, 피드백, 레시피 데이터 삭제
    const cleanupPromises = [];
    
    // 분석 데이터 정리
    const analysesRef = ref(db, `users/${userId}/imageAnalyses`);
    const analysesSnapshot = await get(analysesRef);
    if (analysesSnapshot.exists()) {
      const analyses = analysesSnapshot.val();
      Object.keys(analyses).forEach(analysisId => {
        if (analyses[analysisId].sessionId === sessionId) {
          cleanupPromises.push(set(ref(db, `users/${userId}/imageAnalyses/${analysisId}`), null));
        }
      });
    }
    
    // 피드백 데이터 정리
    const feedbacksRef = ref(db, `users/${userId}/feedbacks`);
    const feedbacksSnapshot = await get(feedbacksRef);
    if (feedbacksSnapshot.exists()) {
      const feedbacks = feedbacksSnapshot.val();
      Object.keys(feedbacks).forEach(feedbackId => {
        if (feedbacks[feedbackId].sessionId === sessionId) {
          cleanupPromises.push(set(ref(db, `users/${userId}/feedbacks/${feedbackId}`), null));
        }
      });
    }
    
    // 레시피 데이터 정리
    const recipesRef = ref(db, `users/${userId}/recipes`);
    const recipesSnapshot = await get(recipesRef);
    if (recipesSnapshot.exists()) {
      const recipes = recipesSnapshot.val();
      Object.keys(recipes).forEach(recipeId => {
        if (recipes[recipeId].sessionId === sessionId) {
          cleanupPromises.push(set(ref(db, `users/${userId}/recipes/${recipeId}`), null));
        }
      });
    }
    
    // 확정 데이터 정리
    const confirmedRef = ref(db, `users/${userId}/confirmedPerfumes`);
    const confirmedSnapshot = await get(confirmedRef);
    if (confirmedSnapshot.exists()) {
      const confirmed = confirmedSnapshot.val();
      Object.keys(confirmed).forEach(confirmId => {
        if (confirmed[confirmId].sessionId === sessionId) {
          cleanupPromises.push(set(ref(db, `users/${userId}/confirmedPerfumes/${confirmId}`), null));
        }
      });
    }
    
    await Promise.all(cleanupPromises);
    
  } catch (error) {
    console.error(`사용자 관련 데이터 정리 오류 (${userId}/${sessionId}):`, error);
    // 에러가 나도 메인 삭제는 계속 진행
  }
}; 