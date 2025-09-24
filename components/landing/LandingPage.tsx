"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  const handleStart = () => {
    router.push('/info');
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

        
        {/* 상단 제목 영역 (로고 제거) */}
        <div className="flex flex-col items-center mb-6">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center"
          >
            <h2 className="text-xs font-bold text-gray-500 mb-1 tracking-widest uppercase">Scent Destination</h2>
            <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
              <span className="bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent px-1 py-1 inline-block">Scent Destination</span>
            </h1>
          </motion.div>
          
          <motion.p
            initial={{ y: -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-gray-600 text-base text-center mt-1 font-medium"
          >
            당신만의 향을 찾는 특별한 여정을 시작하세요
          </motion.p>
        </div>
        
        {/* 중간 컨텐츠 영역 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-3 mb-5"
        >
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center text-sm">
              <span className="text-base mr-2">🌟</span>
              이런 분들에게 추천해요!
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2 text-gray-700 font-bold">•</span>
                <span className="text-gray-700 text-sm">자신만의 특별한 향을 찾고 싶은 분</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-gray-700 font-bold">•</span>
                <span className="text-gray-700 text-sm">개성에 어울리는 맞춤 향수를 원하는 분</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-gray-700 font-bold">•</span>
                <span className="text-gray-700 text-sm">AI 분석을 통한 정확한 추천을 받고 싶은 분</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-4 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center text-sm">
              <span className="text-base mr-2">📝</span>
              서비스 이용 방법
            </h3>
            <ol className="space-y-2">
              <li className="flex items-center">
                <div className="bg-gradient-to-r from-gray-700 to-black w-6 h-6 rounded-full flex items-center justify-center text-white font-bold mr-3 text-[11px] shadow-md">1</div>
                <span className="text-gray-700 text-sm">개인 스타일과 성격 정보를 입력해요</span>
              </li>
              <li className="flex items-center">
                <div className="bg-gradient-to-r from-gray-700 to-black w-6 h-6 rounded-full flex items-center justify-center text-white font-bold mr-3 text-[11px] shadow-md">2</div>
                <span className="text-gray-700 text-sm">AI와 대화하며 취향을 소개해요</span>
              </li>
              <li className="flex items-center">
                <div className="bg-gradient-to-r from-gray-700 to-black w-6 h-6 rounded-full flex items-center justify-center text-white font-bold mr-3 text-[11px] shadow-md">3</div>
                <span className="text-gray-700 text-sm">개인 이미지를 업로드하면 향수를 추천받아요</span>
              </li>
            </ol>
          </div>
        </motion.div>
        
        {/* 하단 버튼 영역 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex justify-center"
        >
          <motion.button
            onClick={handleStart}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-gray-800 to-black text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-900 transition-all duration-200 flex items-center"
          >
            자세히 보기
            <span className="ml-1 text-lg">→</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}