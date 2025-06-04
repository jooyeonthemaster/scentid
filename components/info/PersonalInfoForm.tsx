"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PersonalImageUpload from '../PersonalImageUpload';

// 개인 정보 인터페이스
interface PersonalInfo {
  userPhone: string;
  name: string;
  gender: string;
  style: string[];
  personality: string[];
  charms: string;
  image?: File;
}

export default function PersonalInfoForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<string>('이미지 전송 중...');
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    userPhone: '',
    name: '',
    gender: '',
    style: [],
    personality: [],
    charms: '',
  });
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 스타일 옵션
  const styleOptions = [
    { id: 'cute', label: '귀여운' },
    { id: 'sexy', label: '섹시한' },
    { id: 'chic', label: '시크한' },
    { id: 'elegant', label: '우아한' },
    { id: 'energetic', label: '활발한' },
    { id: 'fresh', label: '청량한' },
    { id: 'retro', label: '레트로' },
    { id: 'casual', label: '캐주얼' },
  ];

  // 성격 옵션
  const personalityOptions = [
    { id: 'bright', label: '밝은' },
    { id: 'calm', label: '차분한' },
    { id: 'funny', label: '유머러스한' },
    { id: 'shy', label: '수줍은' },
    { id: 'confident', label: '자신감 있는' },
    { id: 'thoughtful', label: '사려 깊은' },
    { id: 'passionate', label: '열정적인' },
    { id: 'caring', label: '다정한' },
  ];

  // 입력값 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
  };

  // 체크박스 변경 핸들러
  const handleCheckboxChange = (category: 'style' | 'personality', id: string) => {
    setPersonalInfo(prev => {
      const current = prev[category];
      
      // 이미 선택된 항목인 경우 제거, 아니면 추가
      if (current.includes(id)) {
        return { ...prev, [category]: current.filter(item => item !== id) };
      } else {
        return { ...prev, [category]: [...current, id] };
      }
    });
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (file: File) => {
    setPersonalInfo(prev => ({ ...prev, image: file }));
    
    // 이미지 크기 확인 및 경고
    if (file.size > 2 * 1024 * 1024) { // 2MB 초과
      alert('이미지 크기가 큽니다. 분석에 시간이 오래 걸릴 수 있습니다.');
    }
  };

  // 이미지 압축 함수
  const compressImage = async (file: File, maxSizeMB: number = 1): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          
          // 최대 크기 제한 (가로/세로 1200px)
          const MAX_SIZE = 1200;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round(height * (MAX_SIZE / width));
              width = MAX_SIZE;
            } else {
              width = Math.round(width * (MAX_SIZE / height));
              height = MAX_SIZE;
            }
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('캔버스 컨텍스트를 생성할 수 없습니다.'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // 압축 품질 조정
          let quality = 0.9; // 90% 품질로 시작
          const maxSizeBytes = maxSizeMB * 1024 * 1024;
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('이미지 압축에 실패했습니다.'));
                return;
              }
              
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              
              console.log(`압축 전: ${Math.round(file.size / 1024)}KB, 압축 후: ${Math.round(compressedFile.size / 1024)}KB`);
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => {
          reject(new Error('이미지 로드에 실패했습니다.'));
        };
      };
      reader.onerror = () => {
        reject(new Error('파일 읽기에 실패했습니다.'));
      };
    });
  };

  // 다음 단계로 진행
  const handleNext = () => {
    if (step === 1) {
      if (!personalInfo.userPhone) {
        alert('비밀번호를 입력해주세요.');
        return;
      }
      if (!personalInfo.name) {
        alert('이름을 입력해주세요.');
        return;
      }
      if (!personalInfo.gender) {
        alert('성별을 선택해주세요.');
        return;
      }
      // 비밀번호 형식 검증 (4자리 숫자만 허용)
      const passwordRegex = /^[0-9]{4}$/;
      if (!passwordRegex.test(personalInfo.userPhone)) {
        alert('비밀번호는 4자리 숫자만 입력 가능합니다.');
        return;
      }
    }
    
    if (step === 2 && personalInfo.style.length === 0) {
      alert('최소 하나 이상의 스타일을 선택해주세요.');
      return;
    }
    
    if (step === 3 && personalInfo.personality.length === 0) {
      alert('최소 하나 이상의 성격을 선택해주세요.');
      return;
    }
    
    if (step === 5) {
      // 이미지 유효성 검사
      if (!personalInfo.image) {
        alert('이미지를 업로드해주세요.');
        return;
      }
      
      // 분석 시작
      handleAnalyzeImage();
    } else {
      setStep(step + 1);
    }
  };

  // 분석 요청 함수
  const handleAnalyzeImage = async () => {
    try {
      // 폼 데이터 생성 및 전송
      const formData = new FormData();
      
      // 사용자 및 세션 정보 추가 (Firebase 저장을 위해)
      const userId = personalInfo.userPhone.replace(/-/g, ''); // 하이픈 제거해서 userId로 사용
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      formData.append('userId', userId);
      formData.append('sessionId', sessionId);
      
      formData.append('idolName', personalInfo.name);
      formData.append('idolGender', personalInfo.gender);
      
      // 배열 데이터는 여러 개의 동일한 이름으로 추가
      personalInfo.style.forEach(style => {
        formData.append('idolStyle', style);
      });
      
      personalInfo.personality.forEach(personality => {
        formData.append('idolPersonality', personality);
      });
      
      formData.append('idolCharms', personalInfo.charms);
      
      // 이미지 압축 후 추가
      if (personalInfo.image) {
        try {
          const compressedImage = await compressImage(personalInfo.image, 1); // 1MB로 압축
          formData.append('image', compressedImage);
          console.log(`이미지 압축 완료: ${Math.round(compressedImage.size / 1024)}KB`);
        } catch (compressionError) {
          console.error('이미지 압축 오류:', compressionError);
          // 압축 실패 시 원본 이미지 사용
        formData.append('image', personalInfo.image);
          console.log(`원본 이미지 사용: ${Math.round(personalInfo.image.size / 1024)}KB`);
        }
      }
      
      setIsSubmitting(true);
      
      // 타임아웃 설정 (90초)
      const timeoutDuration = 90000; // 90초
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      
      // 10초마다 분석 상태 메시지 업데이트
      const progressCheckInterval: NodeJS.Timeout = setInterval(() => {
        // 분석 단계별 메시지 업데이트
        if (analysisStage === '이미지 전송 중...') {
          setAnalysisStage('이미지 분석 중...');
        } else if (analysisStage === '이미지 분석 중...') {
          setAnalysisStage('특성 점수 계산 중...');
        } else if (analysisStage === '특성 점수 계산 중...') {
          setAnalysisStage('퍼스널 컬러 분석 중...');
        } else if (analysisStage === '퍼스널 컬러 분석 중...') {
          setAnalysisStage('향수 추천 계산 중...');
        } else {
          setAnalysisStage('결과 생성 중... 잠시만 기다려주세요');
        }
      }, 10000);
      
      // API 호출
      console.time('analyze-api-call');
      console.log('분석 API 호출 시작');
      
      // 추가 디버깅 로그
      console.log('API 요청 경로:', '/api/analyze');
      console.log('FormData 내용:', {
        userPhone: personalInfo.userPhone,
        userId: userId,
        sessionId: sessionId,
        idolName: personalInfo.name,
        idolStyle: personalInfo.style,
        idolPersonality: personalInfo.personality,
        idolCharms: personalInfo.charms,
        imageSize: personalInfo.image ? `${Math.round(personalInfo.image.size / 1024)}KB` : 'No image'
      });

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          credentials: 'same-origin', // 쿠키 포함
          // Content-Type 헤더를 명시적으로 설정하지 않음 (FormData가 자동으로 설정)
        });
        
        // 타임아웃과 인터벌 해제
        clearTimeout(timeoutId);
        clearInterval(progressCheckInterval);
        console.timeEnd('analyze-api-call');
        
        console.log('API 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
          if (response.status === 413) {
            throw new Error('이미지 크기가 너무 큽니다. 더 작은 이미지를 사용해주세요.');
          } else if (response.status === 429) {
            throw new Error('너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.');
          } else if (response.status >= 500) {
            throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          } else {
            const errorText = await response.text();
            console.error('API 응답 에러 내용:', errorText);
            throw new Error(`분석 요청에 실패했습니다. 상태 코드: ${response.status}`);
          }
        }
        
        // 응답 데이터 로드
        const data = await response.json();
        console.log('분석 결과 수신 완료');
        
        // 상세 로깅 추가
        console.log('==== 클라이언트 - API 응답 상세 내용 ====');
        console.log('응답 구조:', Object.keys(data).join(', '));
        
        // API 응답 구조 확인 (이전 버전 호환성 유지)
        const analysisData = data.result || data;
        
        // 필수 필드 확인
        const hasRequiredFields = 
          !!analysisData.traits && 
          !!analysisData.scentCategories && 
          !!analysisData.matchingPerfumes;
        
        console.log('필수 필드 존재 여부:', hasRequiredFields);
        console.log('traits:', !!analysisData.traits);
        console.log('scentCategories:', !!analysisData.scentCategories);
        console.log('matchingPerfumes:', !!analysisData.matchingPerfumes);
        
        if (!hasRequiredFields) {
          console.error('분석 결과에 필수 필드가 누락되었습니다:', analysisData);
          throw new Error('분석 결과가 완전하지 않습니다. 다시 시도해주세요.');
        }
        
        console.log('==== 클라이언트 - API 응답 상세 내용 끝 ====');
        
        // 분석 결과를 로컬 스토리지에 저장
        localStorage.setItem('analysisResult', JSON.stringify(analysisData));
        
        // 아이돌 정보 저장 (이미지는 별도 처리)
        localStorage.setItem('idolInfo', JSON.stringify({
          ...personalInfo,
          // File 객체는 직렬화되지 않으므로 image 속성은 제외
          image: undefined
        }));
        
        // 이미지가 있다면 별도로 처리
        if (personalInfo.image && imagePreview) {
          localStorage.setItem('idolImagePreview', imagePreview);
        }
        
        // 분석 결과 페이지로 이동
        router.push('/result');
      } catch (error: any) {
        // 타임아웃과 인터벌 해제
        clearTimeout(timeoutId);
        clearInterval(progressCheckInterval);
        
        if (error.name === 'AbortError') {
          console.error('요청 시간이 초과되었습니다.');
          alert('분석 요청 시간이 초과되었습니다. 이미지 크기를 줄이거나 더 간단한 이미지를 업로드한 후 다시 시도해주세요.');
        } else {
          console.error('분석 오류:', error);
          alert(`분석 중 오류가 발생했습니다: ${error.message}`);
        }
        
        setIsSubmitting(false);
      }
    } catch (error: any) {
      setIsSubmitting(false);
      console.error('예상치 못한 오류:', error);
      alert(`예상치 못한 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    }
  };

  // 이전 단계로 돌아가기
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-200 p-0 overflow-x-hidden">
      {/* 큰 카드 컨테이너 - 380픽셀로 고정 */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.95 }}
        transition={{ duration: 0.6 }}
        className="relative w-[380px] h-auto bg-white rounded-3xl border border-gray-200 shadow-2xl backdrop-blur-lg p-6 pt-10 pb-12"
        style={{ 
          maxHeight: '100vh', 
          overflowY: 'auto', 
          overflowX: 'hidden',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5)'
        }}
      >
        {/* 상단 인스타그램 아이디 */}
        <div className="absolute top-6 right-6 text-gray-600 font-medium text-sm tracking-wide">
          @acscent_id
        </div>
        
        {/* 왼쪽 위 점 장식 - 실버 */}
        <div className="absolute -left-3 top-20 w-6 h-6 bg-gradient-to-br from-gray-300 to-gray-400 border-4 border-white rounded-full shadow-lg"></div>
        
        {/* 오른쪽 상단 캐릭터 */}
        <motion.div 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
          className="absolute -right-10 top-6 w-20 h-20"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center shadow-2xl">
              <div className="text-white text-2xl">✨</div>
            </div>
          </div>
        </motion.div>
        
        {/* 왼쪽 아래 캐릭터 */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8, type: "spring" }}
          className="absolute -left-10 bottom-10 w-20 h-20"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center shadow-2xl">
              <div className="text-white text-2xl">🎭</div>
            </div>
          </div>
        </motion.div>
        
        {/* 왼쪽 하단 장식 - 실버 */}
        <div className="absolute -left-3 bottom-28 w-6 h-6 bg-gradient-to-br from-gray-300 to-gray-400 border-4 border-white rounded-full shadow-lg"></div>
        
        {/* 상단 로고 및 제목 영역 */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center mb-6"
        >
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center"
          >
            <h2 className="text-xs font-bold text-gray-500 mb-1 tracking-widest uppercase">AC'SCENT IDENTITY</h2>
            <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
              <span className="bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent px-1 py-1 inline-block">
                {step === 1 && '개인 정보'}
                {step === 2 && '스타일 취향'}
                {step === 3 && '성격 특성'}
                {step === 4 && '개성 표현'}
                {step === 5 && '이미지 분석'}
              </span>
            </h1>
          </motion.div>
          
          <motion.p
            initial={{ y: -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-gray-600 text-base text-center mt-1 font-medium"
          >
            당신만의 향을 찾기 위한 여정 ({step}/5)
          </motion.p>
          
          {/* 진행 상태 바 - 그라데이션 */}
          <div className="w-full bg-gray-200 rounded-full h-3 mt-4 shadow-inner">
            <div 
              className="bg-gradient-to-r from-gray-700 to-black h-3 rounded-full transition-all duration-500 ease-out shadow-sm" 
              style={{ width: `${step * 20}%` }}
            ></div>
          </div>
        </motion.div>
        
        {/* 단계별 폼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-3 mb-5"
        >
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="userPhone" className="block text-sm font-semibold text-gray-700 mb-2">
                  개인 비밀번호 (4자리) <span className="text-gray-900">*</span>
                </label>
                <input
                  type="password"
                  id="userPhone"
                  name="userPhone"
                  value={personalInfo.userPhone}
                  onChange={handleInputChange}
                  placeholder="4자리 숫자를 입력하세요"
                  maxLength={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-100 text-gray-900 placeholder-gray-400 bg-gray-50 transition-all duration-200"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">결과 조회 시 사용되는 개인 비밀번호입니다</p>
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  이름 <span className="text-gray-900">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={personalInfo.name}
                  onChange={handleInputChange}
                  placeholder="당신의 이름을 입력해주세요"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-100 text-gray-900 placeholder-gray-400 bg-gray-50 transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-2">
                  성별 <span className="text-gray-900">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={personalInfo.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-100 text-gray-900 bg-gray-50 transition-all duration-200"
                  required
                >
                  <option value="">성별을 선택해주세요</option>
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                </select>
              </div>
            </div>
          )}
          
          {/* 단계 2: 스타일 */}
          {step === 2 && (
            <div>
              <p className="text-sm text-gray-600 mb-5 font-medium">
                당신의 스타일 선호도를 선택해주세요. (복수 선택 가능)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {styleOptions.map((style) => (
                  <label 
                    key={style.id} 
                    className={`
                      flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105
                      ${personalInfo.style.includes(style.id) 
                        ? 'border-gray-700 bg-gradient-to-br from-gray-800 to-black text-white shadow-lg' 
                        : 'border-gray-200 hover:border-gray-400 bg-white text-gray-700 hover:bg-gray-50'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={personalInfo.style.includes(style.id)}
                      onChange={() => handleCheckboxChange('style', style.id)}
                      className="sr-only"
                    />
                    <span className="font-medium text-center w-full">
                      {style.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {/* 단계 3: 성격 */}
          {step === 3 && (
            <div>
              <p className="text-sm text-gray-600 mb-5 font-medium">
                당신의 성격 특성을 선택해주세요. (복수 선택 가능)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {personalityOptions.map((personality) => (
                  <label 
                    key={personality.id} 
                    className={`
                      flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105
                      ${personalInfo.personality.includes(personality.id) 
                        ? 'border-gray-700 bg-gradient-to-br from-gray-800 to-black text-white shadow-lg' 
                        : 'border-gray-200 hover:border-gray-400 bg-white text-gray-700 hover:bg-gray-50'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={personalInfo.personality.includes(personality.id)}
                      onChange={() => handleCheckboxChange('personality', personality.id)}
                      className="sr-only"
                    />
                    <span className="font-medium text-center w-full">
                      {personality.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {/* 단계 4: 개성 표현 */}
          {step === 4 && (
            <div>
              <p className="text-sm text-gray-600 mb-5 font-medium">
                당신만의 특별한 매력이나 개성을 자유롭게 표현해주세요.
              </p>
              <textarea
                id="charms"
                name="charms"
                value={personalInfo.charms}
                onChange={handleInputChange}
                placeholder="예: 은은하면서도 강렬한 인상을 주고 싶어요. 세련되고 독특한 스타일을 추구하며, 다른 사람들과는 차별화된 향을 원해요."
                className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-100 resize-none bg-gray-50 text-gray-900 placeholder-gray-400 transition-all duration-200"
              />
            </div>
          )}
          
          {/* 단계 5: 이미지 업로드 */}
          {step === 5 && (
            <div>
              <p className="text-sm text-gray-600 mb-5 font-medium">
                당신의 이미지를 업로드해주세요. AI가 분석하여 맞춤 향수를 추천해드립니다.
              </p>
              <PersonalImageUpload 
                onImageUpload={(file: File) => {
                  handleImageUpload(file);
                  const preview = URL.createObjectURL(file);
                  setImagePreview(preview);
                }}
                previewUrl={imagePreview}
              />
              <p className="mt-3 text-xs text-gray-500 text-center">
                * 고화질 이미지일수록 더 정확한 분석과 추천을 받을 수 있습니다
              </p>
            </div>
          )}
        </motion.div>
        
        {/* 버튼 영역 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex justify-center space-x-4"
        >
          <motion.button
            onClick={handleBack}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-full shadow-md hover:shadow-lg hover:border-gray-400 transition-all duration-200 flex items-center"
            disabled={isSubmitting}
          >
            {step === 1 ? '처음으로' : '이전'}
          </motion.button>
          
          <motion.button
            onClick={handleNext}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className={`bg-gradient-to-r from-gray-800 to-black text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:from-gray-700 hover:to-gray-900'}`}
            disabled={isSubmitting}
          >
            {step === 5 ? (
              isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {analysisStage || '이미지 분석 중...'}
                </span>
              ) : '분석 시작'
            ) : '다음'}
            {!isSubmitting && <span className="ml-1 text-lg">→</span>}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}