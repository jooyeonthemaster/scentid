import { firestore } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  writeBatch,
  collectionGroup
} from 'firebase/firestore';

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
  console.error(`Firestore ${operation} 오류:`, error);
  
  if (error.code === 'permission-denied') {
    console.warn('Firestore 권한 오류 - 개발 모드에서는 무시하고 계속 진행합니다.');
    return { warning: 'Permission denied - continuing in development mode' };
  }
  
  throw error;
};

// 안전한 Firestore 업데이트 함수
const safeUpdate = async (docRef, data, operation = 'update') => {
  try {
    const sanitizedData = sanitizeData(data);
    if (!sanitizedData || Object.keys(sanitizedData).length === 0) {
      console.warn(`${operation}: 저장할 유효한 데이터가 없습니다.`);
      return { warning: 'No valid data to save' };
    }
    
    await updateDoc(docRef, sanitizedData);
    return { success: true };
  } catch (error) {
    return handleFirebaseError(error, operation);
  }
};

// 안전한 Firestore 설정 함수
const safeSet = async (docRef, data, operation = 'set') => {
  try {
    const sanitizedData = sanitizeData(data);
    if (!sanitizedData) {
      console.warn(`${operation}: 저장할 유효한 데이터가 없습니다.`);
      return { warning: 'No valid data to save' };
    }
    
    await setDoc(docRef, sanitizedData);
    return { success: true, id: docRef.id };
  } catch (error) {
    return handleFirebaseError(error, operation);
  }
};

// 세션 생성 함수 (전체 플로우의 시작)
export const createPerfumeSession = async (userId, sessionData) => {
  try {
    const sessionsRef = collection(firestore, 'users', userId, 'perfumeSessions');
    const newSessionDoc = await addDoc(sessionsRef, {
      ...sessionData,
      status: 'started', // started, image_analyzed, feedback_given, recipe_created, confirmed
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // 생성된 문서에 sessionId 추가
    await updateDoc(newSessionDoc, {
      sessionId: newSessionDoc.id
    });
    
    console.log('🔥 향수 세션 생성 완료:', newSessionDoc.id);
    return newSessionDoc.id;
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
    
    const sessionRef = doc(firestore, 'users', userId, 'perfumeSessions', sessionId);
    
    // 먼저 세션이 존재하는지 확인 (안전한 방식으로)
    let sessionSnapshot;
    try {
      sessionSnapshot = await getDoc(sessionRef);
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
    const analysesRef = collection(firestore, 'users', userId, 'imageAnalyses');
    const newAnalysisDoc = await addDoc(analysesRef, {
      sessionId: sessionId,
      imageUrl: imageUrl,
      ...sanitizedAnalysis,
      timestamp: serverTimestamp(),
    });
    
    console.log('🔥 이미지 분석 및 링크 저장 완료:', {
      sessionResult,
      analysisId: newAnalysisDoc.id
    });
    
    return { 
      sessionUpdated: sessionResult.success || sessionResult.warning,
      analysisId: newAnalysisDoc.id,
      warnings: [sessionResult.warning].filter(Boolean)
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
    
    const sessionRef = doc(firestore, 'users', userId, 'perfumeSessions', sessionId);
    const sessionUpdateResult = await safeUpdate(sessionRef, {
      feedback: sanitizedFeedback,
      status: 'feedback_given',
      updatedAt: serverTimestamp(),
    }, 'session feedback update');
    
    // 별도로 피드백 기록도 저장
    const feedbacksRef = collection(firestore, 'users', userId, 'feedbacks');
    const newFeedbackDoc = await addDoc(feedbacksRef, {
      sessionId: sessionId,
      ...sanitizedFeedback,
      timestamp: serverTimestamp(),
    });
    
    console.log('🔥 세션 피드백 저장 완료:', { 
      sessionUpdate: sessionUpdateResult, 
      feedbackId: newFeedbackDoc.id 
    });
    
    return { 
      sessionUpdated: sessionUpdateResult.success || sessionUpdateResult.warning, 
      feedbackId: newFeedbackDoc.id,
      warnings: [sessionUpdateResult.warning].filter(Boolean)
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
    
    const sessionRef = doc(firestore, 'users', userId, 'perfumeSessions', sessionId);
    const sessionUpdateResult = await safeUpdate(sessionRef, {
      improvedRecipe: sanitizedRecipe,
      status: 'recipe_created',
      updatedAt: serverTimestamp(),
    }, 'session recipe update');
    
    // 별도로 레시피 기록도 저장 (analysisId 포함)
    const recipesRef = collection(firestore, 'users', userId, 'recipes');
    const newRecipeDoc = await addDoc(recipesRef, {
      sessionId: sessionId,
      analysisId: analysisId, // 이미지 분석 ID 추가
      ...sanitizedRecipe,
      timestamp: serverTimestamp(),
    });
    
    console.log('🔥 개선된 레시피 저장 완료:', {
      sessionUpdate: sessionUpdateResult,
      recipeId: newRecipeDoc.id
    });
    
    return { 
      sessionUpdated: sessionUpdateResult.success || sessionUpdateResult.warning,
      recipeId: newRecipeDoc.id,
      warnings: [sessionUpdateResult.warning].filter(Boolean)
    };
  } catch (error) {
    console.error('🔥 개선된 레시피 저장 오류:', error);
    return handleFirebaseError(error, 'save improved recipe');
  }
};

// 향 확정 함수
export const confirmPerfume = async (userId, sessionId, confirmationData) => {
  try {
    const sessionRef = doc(firestore, 'users', userId, 'perfumeSessions', sessionId);
    await updateDoc(sessionRef, {
      confirmation: {
        ...confirmationData,
        confirmedAt: serverTimestamp(),
      },
      status: 'confirmed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // 별도로 확정된 향수 기록도 저장
    const confirmedPerfumesRef = collection(firestore, 'users', userId, 'confirmedPerfumes');
    const newConfirmationDoc = await addDoc(confirmedPerfumesRef, {
      sessionId: sessionId,
      ...confirmationData,
      timestamp: serverTimestamp(),
    });
    
    console.log('향수 확정 완료');
    return { sessionCompleted: true, confirmationId: newConfirmationDoc.id };
  } catch (error) {
    console.error('향수 확정 오류:', error);
    throw error;
  }
};

// 세션 조회 함수
export const getPerfumeSession = async (userId, sessionId) => {
  try {
    const sessionRef = doc(firestore, 'users', userId, 'perfumeSessions', sessionId);
    const snapshot = await getDoc(sessionRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
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
    const sessionsRef = collection(firestore, 'users', userId, 'perfumeSessions');
    const q = query(sessionsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const sessions = {};
    snapshot.forEach((doc) => {
      sessions[doc.id] = { id: doc.id, ...doc.data() };
    });
    
    return sessions;
  } catch (error) {
    console.error('사용자 세션 조회 오류:', error);
    throw error;
  }
};

// 관리자용: 모든 사용자 데이터 조회 함수
export const getAllUserData = async () => {
  try {
    // Firestore에서는 컬렉션 그룹 쿼리를 사용해야 함
    console.warn('getAllUserData는 Firestore에서 권장되지 않습니다. getUserSessionsList를 사용하세요.');
    return {};
  } catch (error) {
    console.error('모든 사용자 데이터 조회 오류:', error);
    throw error;
  }
};

// 관리자용: 최적화된 사용자 세션 목록 조회 함수 (Firestore 컬렉션 그룹 쿼리 사용)
export const getUserSessionsList = async (limitNum = 50, lastDocumentId = null) => {
  try {
    console.log('📊 최적화된 세션 목록 조회 시작... (분석 완료만)');
    
    const startTime = Date.now();
    
    // Firestore 컬렉션 그룹 쿼리를 사용하여 모든 사용자의 세션 조회
    
    let q = query(
      collectionGroup(firestore, 'perfumeSessions'),
      where('status', '==', 'image_analyzed'),
      orderBy('updatedAt', 'desc'),
      limit(limitNum)
    );
    
    // 페이지네이션: lastDocumentId가 있으면 해당 문서 이후부터 조회
    if (lastDocumentId) {
      const lastDocRef = doc(firestore, 'users', 'temp', 'perfumeSessions', lastDocumentId);
      const lastDocSnap = await getDoc(lastDocRef);
      if (lastDocSnap.exists()) {
        q = query(
          collectionGroup(firestore, 'perfumeSessions'),
          where('status', '==', 'image_analyzed'),
          orderBy('updatedAt', 'desc'),
          startAfter(lastDocSnap),
          limit(limitNum)
        );
      }
    }
    
    const querySnapshot = await getDocs(q);
    const sessions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const docPath = doc.ref.path;
      // path에서 userId 추출: users/{userId}/perfumeSessions/{sessionId}
      const pathParts = docPath.split('/');
      const userId = pathParts[1];
      const sessionId = pathParts[3];
      
      // 상태 확인 함수
      const getCompletionStatus = () => {
        if (data.confirmation) return '완료';
        if (data.improvedRecipe) return '레시피 생성';
        if (data.feedback) return '피드백 완료';
        if (data.imageAnalysis) return '분석 완료';
        return '진행 중';
      };
      
      const completionStatus = getCompletionStatus();
      
      // "분석 완료" 상태만 필터링 (이미 query에서 필터링하지만 이중 체크)
      if (completionStatus === '분석 완료') {
        sessions.push({
          userId: userId,
          sessionId: sessionId,
          phoneNumber: userId,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
          updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now(),
          status: data.status || 'unknown',
          customerName: data.customerName || '알 수 없음',
          hasImageAnalysis: !!data.imageAnalysis,
          hasFeedback: !!data.feedback,
          hasRecipe: !!data.improvedRecipe,
          hasConfirmation: !!data.confirmation,
          completionStatus: completionStatus
        });
      }
    });
    
    // 다음 페이지 존재 여부 확인
    const hasMore = querySnapshot.size === limitNum;
    const lastKey = hasMore && sessions.length > 0 ? 
      `${sessions[sessions.length - 1].userId}_${sessions[sessions.length - 1].sessionId}` : null;
    
    console.log(`📊 분석 완료 세션 조회 완료: ${sessions.length}개 (${Date.now() - startTime}ms)`);
    
    return {
      sessions: sessions,
      hasMore,
      lastKey: lastKey,
      total: sessions.length
    };
    
  } catch (error) {
    console.error('최적화된 세션 목록 조회 오류:', error);
    
    // Firestore 쿼리 에러 처리
    if (error.message?.includes('requires an index') || error.code === 'failed-precondition') {
      console.warn('📊 Firestore 인덱스가 필요합니다. Firebase 콘솔에서 인덱스를 생성해주세요.');
      return { 
        sessions: [], 
        hasMore: false, 
        lastKey: null, 
        total: 0,
        error: 'Firestore 인덱스가 필요합니다. Firebase 콘솔에서 인덱스를 생성해주세요.'
      };
    }
    
    throw error;
  }
};

// 캐시를 위한 간단한 메모리 저장소
const sessionCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 관리자용: 캐시된 세션 목록 조회
export const getCachedUserSessionsList = async (limitNum = 50, lastKey = null, forceRefresh = false) => {
  const cacheKey = `sessions_${limitNum}_${lastKey || 'first'}`;
  
  if (!forceRefresh && sessionCache.has(cacheKey)) {
    const cached = sessionCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📊 캐시된 세션 목록 반환');
      return cached.data;
    }
  }
  
  const data = await getUserSessionsList(limitNum, lastKey);
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
    const sessionRef = doc(firestore, 'users', userId, 'perfumeSessions', sessionId);
    const sessionSnapshot = await getDoc(sessionRef);
    
    // 관련 이미지 분석 데이터
    const analysesRef = collection(firestore, 'users', userId, 'imageAnalyses');
    const analysesQuery = query(analysesRef, where('sessionId', '==', sessionId));
    const analysesSnapshot = await getDocs(analysesQuery);
    
    // 관련 피드백 데이터
    const feedbacksRef = collection(firestore, 'users', userId, 'feedbacks');
    const feedbacksQuery = query(feedbacksRef, where('sessionId', '==', sessionId));
    const feedbacksSnapshot = await getDocs(feedbacksQuery);
    
    // 관련 레시피 데이터
    const recipesRef = collection(firestore, 'users', userId, 'recipes');
    const recipesQuery = query(recipesRef, where('sessionId', '==', sessionId));
    const recipesSnapshot = await getDocs(recipesQuery);
    
    // 관련 확정 데이터
    const confirmedRef = collection(firestore, 'users', userId, 'confirmedPerfumes');
    const confirmedQuery = query(confirmedRef, where('sessionId', '==', sessionId));
    const confirmedSnapshot = await getDocs(confirmedQuery);
    
    const result = {
      session: sessionSnapshot.exists() ? { id: sessionSnapshot.id, ...sessionSnapshot.data() } : null,
      analyses: [],
      feedbacks: [],
      recipes: [],
      confirmed: []
    };
    
    // 분석 데이터 추가
    analysesSnapshot.forEach((doc) => {
      result.analyses.push({ id: doc.id, ...doc.data() });
    });
    
    // 피드백 데이터 추가
    feedbacksSnapshot.forEach((doc) => {
      result.feedbacks.push({ id: doc.id, ...doc.data() });
    });
    
    // 레시피 데이터 추가
    recipesSnapshot.forEach((doc) => {
      result.recipes.push({ id: doc.id, ...doc.data() });
    });
    
    // 확정 데이터 추가
    confirmedSnapshot.forEach((doc) => {
      result.confirmed.push({ id: doc.id, ...doc.data() });
    });
    
    return result;
  } catch (error) {
    console.error('세션 전체 데이터 조회 오류:', error);
    throw error;
  }
};

// 이미지 분석별 레시피 히스토리 조회 함수
export const getAnalysisRecipes = async (userId, analysisId) => {
  try {
    console.log('🔍 getAnalysisRecipes 호출됨:', { userId, analysisId });
    
    const recipesRef = collection(firestore, 'users', userId, 'recipes');
    const q = query(
      recipesRef, 
      where('analysisId', '==', analysisId),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    
    const analysisRecipes = [];
    snapshot.forEach((doc) => {
      analysisRecipes.push({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().timestamp || doc.data().generatedAt
      });
    });
    
    console.log(`🔍 분석 ${analysisId}의 레시피 ${analysisRecipes.length}개 조회 완료`);
    return analysisRecipes;
  } catch (error) {
    console.error('🔍 분석별 레시피 조회 오류:', error);
    throw error;
  }
};

// 세션별 레시피 조회 (하위호환성)
export const getSessionRecipes = async (userId, sessionId) => {
  try {
    console.log('🔍 getSessionRecipes 호출됨 (하위호환):', { userId, sessionId });
    
    const recipesRef = collection(firestore, 'users', userId, 'recipes');
    const q = query(
      recipesRef, 
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    
    const sessionRecipes = [];
    snapshot.forEach((doc) => {
      sessionRecipes.push({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().timestamp || doc.data().generatedAt
      });
    });
    
    console.log(`🔍 세션 ${sessionId}의 레시피 ${sessionRecipes.length}개 조회 완료`);
    return sessionRecipes;
  } catch (error) {
    console.error('🔍 세션 레시피 조회 오류:', error);
    throw error;
  }
};

// 특정 레시피 상세 조회 함수
export const getRecipeById = async (userId, recipeId) => {
  try {
    const recipeRef = doc(firestore, 'users', userId, 'recipes', recipeId);
    const snapshot = await getDoc(recipeRef);
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
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
    const sessionRef = doc(firestore, 'users', userId, 'perfumeSessions', sessionId);
    await updateDoc(sessionRef, {
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
    const recipeRef = doc(firestore, 'users', userId, 'recipes', recipeId);
    await updateDoc(recipeRef, {
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

// 🗑️ 관리자용: 오래된 데이터 정리 함수 (Firestore용으로 수정 필요)
export const cleanupOldSessions = async (keepLatestCount = 30, dryRun = true) => {
  try {
    console.log(`🗑️ 데이터 정리 시작 (최신 ${keepLatestCount}개 유지, 시뮬레이션: ${dryRun})`);
    
    // Firestore에서는 더 복잡한 구현이 필요
    // 현재는 기본 응답만 반환
    console.warn('🗑️ Firestore용 데이터 정리는 별도 구현이 필요합니다.');
    
    return {
      success: true,
      dryRun,
      totalSessions: 0,
      keptCount: 0,
      deletedCount: 0,
      estimatedDeleteCount: 0,
      executionTime: 0,
      keptSessions: [],
      deletionLog: []
    };
    
  } catch (error) {
    console.error('🗑️ 데이터 정리 오류:', error);
    throw error;
  }
};
