/**
 * Leading Zero 누락된 userId 수정 스크립트
 * 
 * 문제: "0252"로 입력된 사용자 ID가 Firestore에서 "252"로 저장되어
 * 관리자 페이지에서 조회되지 않는 문제 해결
 * 
 * 사용법:
 * node scripts/fix-leading-zero-userids.js
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  collectionGroup, 
  doc, 
  getDocs, 
  writeBatch, 
  query, 
  where 
} from 'firebase/firestore';

// Firebase 설정 (환경 변수에서 가져오기)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

/**
 * 4자리 미만의 숫자 userId를 4자리로 패딩하는 함수
 */
function padUserId(userId) {
  const userIdStr = String(userId);
  
  // 숫자로만 이루어진 4자리 미만의 문자열인지 확인
  if (/^\d{1,3}$/.test(userIdStr)) {
    return userIdStr.padStart(4, '0');
  }
  
  return userIdStr;
}

/**
 * 특정 사용자의 모든 데이터를 새로운 userId로 이전하는 함수
 */
async function migrateUserData(oldUserId, newUserId, dryRun = true) {
  const batch = writeBatch(firestore);
  const changes = [];
  
  console.log(`🔄 사용자 데이터 이전 시작: ${oldUserId} → ${newUserId} (DRY RUN: ${dryRun})`);
  
  try {
    // 1. 세션 데이터 이전
    const sessionsRef = collection(firestore, 'users', oldUserId, 'perfumeSessions');
    const sessionsSnapshot = await getDocs(sessionsRef);
    
    sessionsSnapshot.forEach((sessionDoc) => {
      const sessionData = sessionDoc.data();
      const newSessionRef = doc(firestore, 'users', newUserId, 'perfumeSessions', sessionDoc.id);
      
      if (!dryRun) {
        batch.set(newSessionRef, {
          ...sessionData,
          userId: newUserId // userId 필드도 업데이트
        });
      }
      
      changes.push({
        type: 'session',
        oldPath: `users/${oldUserId}/perfumeSessions/${sessionDoc.id}`,
        newPath: `users/${newUserId}/perfumeSessions/${sessionDoc.id}`,
        data: sessionData
      });
    });
    
    // 2. 이미지 분석 데이터 이전
    const analysesRef = collection(firestore, 'users', oldUserId, 'imageAnalyses');
    const analysesSnapshot = await getDocs(analysesRef);
    
    analysesSnapshot.forEach((analysisDoc) => {
      const analysisData = analysisDoc.data();
      const newAnalysisRef = doc(firestore, 'users', newUserId, 'imageAnalyses', analysisDoc.id);
      
      if (!dryRun) {
        batch.set(newAnalysisRef, analysisData);
      }
      
      changes.push({
        type: 'analysis',
        oldPath: `users/${oldUserId}/imageAnalyses/${analysisDoc.id}`,
        newPath: `users/${newUserId}/imageAnalyses/${analysisDoc.id}`,
        data: analysisData
      });
    });
    
    // 3. 피드백 데이터 이전
    const feedbacksRef = collection(firestore, 'users', oldUserId, 'feedbacks');
    const feedbacksSnapshot = await getDocs(feedbacksRef);
    
    feedbacksSnapshot.forEach((feedbackDoc) => {
      const feedbackData = feedbackDoc.data();
      const newFeedbackRef = doc(firestore, 'users', newUserId, 'feedbacks', feedbackDoc.id);
      
      if (!dryRun) {
        batch.set(newFeedbackRef, feedbackData);
      }
      
      changes.push({
        type: 'feedback',
        oldPath: `users/${oldUserId}/feedbacks/${feedbackDoc.id}`,
        newPath: `users/${newUserId}/feedbacks/${feedbackDoc.id}`,
        data: feedbackData
      });
    });
    
    // 4. 레시피 데이터 이전
    const recipesRef = collection(firestore, 'users', oldUserId, 'recipes');
    const recipesSnapshot = await getDocs(recipesRef);
    
    recipesSnapshot.forEach((recipeDoc) => {
      const recipeData = recipeDoc.data();
      const newRecipeRef = doc(firestore, 'users', newUserId, 'recipes', recipeDoc.id);
      
      if (!dryRun) {
        batch.set(newRecipeRef, recipeData);
      }
      
      changes.push({
        type: 'recipe',
        oldPath: `users/${oldUserId}/recipes/${recipeDoc.id}`,
        newPath: `users/${newUserId}/recipes/${recipeDoc.id}`,
        data: recipeData
      });
    });
    
    // 5. 확정된 향수 데이터 이전
    const confirmedRef = collection(firestore, 'users', oldUserId, 'confirmedPerfumes');
    const confirmedSnapshot = await getDocs(confirmedRef);
    
    confirmedSnapshot.forEach((confirmedDoc) => {
      const confirmedData = confirmedDoc.data();
      const newConfirmedRef = doc(firestore, 'users', newUserId, 'confirmedPerfumes', confirmedDoc.id);
      
      if (!dryRun) {
        batch.set(newConfirmedRef, confirmedData);
      }
      
      changes.push({
        type: 'confirmed',
        oldPath: `users/${oldUserId}/confirmedPerfumes/${confirmedDoc.id}`,
        newPath: `users/${newUserId}/confirmedPerfumes/${confirmedDoc.id}`,
        data: confirmedData
      });
    });
    
    console.log(`📊 이전할 데이터: ${changes.length}개`);
    changes.forEach((change, index) => {
      console.log(`  ${index + 1}. [${change.type}] ${change.oldPath} → ${change.newPath}`);
    });
    
    if (!dryRun && changes.length > 0) {
      await batch.commit();
      console.log(`✅ ${oldUserId} → ${newUserId} 이전 완료`);
    } else if (dryRun) {
      console.log(`🔍 DRY RUN: 실제 이전은 수행되지 않았습니다.`);
    }
    
    return { success: true, changes: changes.length };
    
  } catch (error) {
    console.error(`❌ 데이터 이전 오류:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * 수정이 필요한 userId 찾기
 */
async function findUsersToFix() {
  const usersToFix = [];
  
  try {
    console.log('🔍 수정이 필요한 사용자 검색 중...');
    
    // collectionGroup을 사용하여 모든 세션 검색
    const sessionsQuery = query(
      collectionGroup(firestore, 'perfumeSessions')
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    
    const userIdSet = new Set();
    
    sessionsSnapshot.forEach((doc) => {
      const docPath = doc.ref.path;
      const pathParts = docPath.split('/');
      const userId = pathParts[1];
      
      // 1-3자리 숫자인 userId만 수집
      if (/^\d{1,3}$/.test(userId)) {
        userIdSet.add(userId);
      }
    });
    
    userIdSet.forEach(userId => {
      const paddedUserId = padUserId(userId);
      if (userId !== paddedUserId) {
        usersToFix.push({
          oldUserId: userId,
          newUserId: paddedUserId
        });
      }
    });
    
    console.log(`📋 수정이 필요한 사용자: ${usersToFix.length}명`);
    usersToFix.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.oldUserId} → ${user.newUserId}`);
    });
    
    return usersToFix;
    
  } catch (error) {
    console.error('❌ 사용자 검색 오류:', error);
    return [];
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  
  console.log('🚀 Leading Zero userId 수정 스크립트 시작');
  console.log(`📝 모드: ${dryRun ? 'DRY RUN (시뮬레이션)' : 'EXECUTE (실제 실행)'}`);
  console.log('');
  
  if (dryRun) {
    console.log('💡 실제 수정을 원한다면 --execute 플래그를 추가하세요.');
    console.log('   예: node scripts/fix-leading-zero-userids.js --execute');
    console.log('');
  }
  
  // 1. 수정이 필요한 사용자 찾기
  const usersToFix = await findUsersToFix();
  
  if (usersToFix.length === 0) {
    console.log('✅ 수정이 필요한 사용자가 없습니다.');
    return;
  }
  
  // 2. 각 사용자 데이터 이전
  let successCount = 0;
  let failCount = 0;
  
  for (const user of usersToFix) {
    console.log('');
    const result = await migrateUserData(user.oldUserId, user.newUserId, dryRun);
    
    if (result.success) {
      successCount++;
      console.log(`✅ ${user.oldUserId} → ${user.newUserId} 처리 완료 (${result.changes}개 항목)`);
    } else {
      failCount++;
      console.log(`❌ ${user.oldUserId} → ${user.newUserId} 처리 실패: ${result.error}`);
    }
  }
  
  console.log('');
  console.log('📊 최종 결과:');
  console.log(`  ✅ 성공: ${successCount}명`);
  console.log(`  ❌ 실패: ${failCount}명`);
  console.log(`  📝 모드: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`);
  
  if (dryRun && successCount > 0) {
    console.log('');
    console.log('💡 시뮬레이션이 완료되었습니다. 실제 실행을 원한다면:');
    console.log('   node scripts/fix-leading-zero-userids.js --execute');
  }
}

// 스크립트 실행
main().catch(console.error);
