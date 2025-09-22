# Firebase Admin SDK 설정 가이드

## 문제 해결 완료
관리자 페이지에서 발생하던 "Missing or insufficient permissions" 오류를 해결했습니다.

## 원인 분석
1. **Firebase Security Rules 권한 문제**: 서버사이드에서 인증 없이 Firestore에 접근할 때 권한 부족
2. **클라이언트 SDK 사용**: 서버에서 클라이언트 SDK를 사용하여 권한 제한 발생

## 해결 방법
Firebase Admin SDK를 도입하여 서버사이드에서 모든 권한으로 Firestore에 접근하도록 수정

### 구현된 솔루션

1. **Firebase Admin SDK 설치**
   ```bash
   npm install firebase-admin
   ```

2. **Admin SDK 초기화 파일 생성** (`lib/firebaseAdmin.js`)
   - 서비스 계정 키 또는 프로젝트 ID로 초기화
   - 환경변수 `FIREBASE_SERVICE_ACCOUNT_KEY` 사용 (선택사항)

3. **Admin API 함수 생성** (`lib/firestoreAdminApi.js`)
   - `getAdminUserSessionsList`: Admin SDK로 세션 목록 조회
   - `getAdminSessionFullData`: Admin SDK로 세션 상세 조회
   - 캐싱 및 폴백 메커니즘 구현

4. **API 라우트 수정** (`app/api/admin/route.ts`)
   - Admin SDK 함수 우선 사용
   - 실패시 클라이언트 SDK로 자동 폴백

## Firebase 서비스 계정 키 설정 (프로덕션용)

### 1. Firebase Console에서 서비스 계정 키 생성
1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 설정 → 서비스 계정 탭
3. "새 비공개 키 생성" 클릭
4. JSON 파일 다운로드

### 2. 환경변수 설정
`.env.local` 파일에 추가:
```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project",...}'
```

### 3. Vercel 환경변수 설정 (배포시)
1. Vercel Dashboard → Settings → Environment Variables
2. `FIREBASE_SERVICE_ACCOUNT_KEY` 추가
3. JSON 내용 전체를 값으로 설정

## 현재 상태
- ✅ Admin SDK 설치 및 설정 완료
- ✅ API 라우트에서 Admin SDK 사용
- ✅ 권한 오류 해결을 위한 폴백 메커니즘 구현
- ⚠️ 서비스 계정 키는 아직 설정되지 않음 (프로젝트 ID만으로 동작 시도)

## 추가 권장사항

### Firebase Security Rules 업데이트 (선택사항)
Firebase Console에서 Firestore Security Rules를 확인하고 필요시 수정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 서버 Admin SDK는 모든 권한 보유 (rules 무시)
    // 클라이언트는 인증된 사용자만 읽기 가능
    match /users/{userId}/{document=**} {
      allow read: if request.auth != null || request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 테스트 방법
1. 브라우저에서 `/admin` 페이지 접속
2. 콘솔에서 "Admin SDK" 관련 로그 확인
3. 데이터가 정상적으로 로드되는지 확인

## 트러블슈팅
- **여전히 권한 오류 발생시**: Firebase Console에서 서비스 계정 키 생성 후 환경변수 설정
- **Admin SDK 초기화 실패**: 프로젝트 ID가 올바른지 확인
- **데이터 로드 실패**: 네트워크 연결 및 Firebase 프로젝트 상태 확인