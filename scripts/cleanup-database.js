/**
 * 🗑️ Firebase 데이터베이스 정리 스크립트
 * 
 * 사용법:
 * 1. 시뮬레이션 (안전): node scripts/cleanup-database.js --dry-run
 * 2. 실제 삭제 (위험): node scripts/cleanup-database.js --execute --keep=30
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.vercel.app'  // 실제 배포 URL로 변경 필요
  : 'http://localhost:3000';

async function cleanupDatabase(keepLatestCount = 30, dryRun = true) {
  try {
    console.log('🗑️ 데이터베이스 정리 시작...');
    console.log(`📊 설정: 최신 ${keepLatestCount}개 유지, 시뮬레이션 모드: ${dryRun}`);
    
    const response = await fetch(`${API_BASE_URL}/api/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'cleanup',
        keepLatestCount: keepLatestCount,
        dryRun: dryRun
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      const data = result.data;
      
      console.log('');
      console.log('📊 ===== 정리 결과 =====');
      console.log(`🗂️  전체 세션: ${data.totalSessions}개`);
      console.log(`✅ 유지할 세션: ${data.keptCount}개`);
      console.log(`🗑️  삭제 대상: ${data.estimatedDeleteCount}개`);
      console.log(`⏱️  실행 시간: ${data.executionTime}ms`);
      console.log(`🎯 모드: ${data.dryRun ? '시뮬레이션' : '실제 삭제'}`);
      
      if (data.dryRun) {
        console.log('');
        console.log('⚠️  시뮬레이션 모드입니다. 실제로 삭제되지 않았습니다.');
        console.log('');
        console.log('🔍 삭제될 데이터 미리보기 (처음 10개):');
        data.deletionLog.slice(0, 10).forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.customerName} (${item.userId})`);
        });
        
        console.log('');
        console.log('💡 실제 삭제를 원한다면:');
        console.log(`   node scripts/cleanup-database.js --execute --keep=${keepLatestCount}`);
      } else {
        console.log('');
        console.log(`✅ 실제로 ${data.deletedCount}개의 세션이 삭제되었습니다.`);
        console.log('');
        console.log('🗑️  삭제된 데이터 (최근 10개):');
        data.deletionLog.slice(0, 10).forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.customerName} (${item.userId}) - ${item.deletedAt}`);
        });
      }
      
      console.log('');
      console.log('📈 유지된 최신 세션 (5개):');
      data.keptSessions.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.customerName} (${item.userId})`);
      });
      
    } else {
      console.error('❌ 정리 실패:', result.error);
      console.error('상세:', result.details);
    }
    
  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
  }
}

// 명령행 인수 파싱
const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');
const keepArg = args.find(arg => arg.startsWith('--keep='));
const keepLatestCount = keepArg ? parseInt(keepArg.split('=')[1]) : 30;

// 확인 메시지
if (!dryRun) {
  console.log('');
  console.log('⚠️  ==================== 경고 ====================');
  console.log('🚨 실제 데이터 삭제 모드입니다!');
  console.log(`🗑️  최신 ${keepLatestCount}개를 제외한 모든 데이터가 영구 삭제됩니다.`);
  console.log('💀 이 작업은 되돌릴 수 없습니다!');
  console.log('================================================');
  console.log('');
  
  // 10초 대기
  console.log('10초 후 삭제를 시작합니다... (Ctrl+C로 중단 가능)');
  setTimeout(() => {
    cleanupDatabase(keepLatestCount, dryRun);
  }, 10000);
} else {
  console.log('');
  console.log('🔍 시뮬레이션 모드로 실행합니다...');
  cleanupDatabase(keepLatestCount, dryRun);
}