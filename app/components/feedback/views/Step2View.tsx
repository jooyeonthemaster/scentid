"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CategorySelector } from '../components/CategorySelector';
import { PerfumeCategory, CategoryPreference, PerfumeFeedback } from '@/app/types/perfume';

interface Step2ViewProps {
  feedback: PerfumeFeedback;
  setFeedback: React.Dispatch<React.SetStateAction<PerfumeFeedback>>;
}

export const Step2View: React.FC<Step2ViewProps> = ({ feedback, setFeedback }) => {
  // 카테고리 선호도 변경 처리
  const handleCategoryPreferenceChange = (category: PerfumeCategory, preference: CategoryPreference) => {
    setFeedback({
      ...feedback,
      categoryPreferences: {
        ...(feedback.categoryPreferences || {
          citrus: 'maintain',
          floral: 'maintain',
          woody: 'maintain',
          musky: 'maintain',
          fruity: 'maintain',
          spicy: 'maintain'
        }),
        [category]: preference,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="min-h-screen p-4"
      style={{ 
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
      }}
    >
      {/* 세련된 헤더 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative mb-8 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-lg border border-white/30"
        style={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-white/10"></div>
        
        <div className="relative px-6 py-6 text-center">
          <div 
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)',
              boxShadow: 'inset 0 4px 8px rgba(255, 255, 255, 0.8), 0 15px 30px rgba(0, 0, 0, 0.2)'
            }}
          >
            <span className="text-xl">🧪</span>
          </div>
          
          <h1 className="text-xl font-black text-white mb-2 tracking-wide drop-shadow-xl">
            향 카테고리 선호도 설정
          </h1>
          
          <p className="text-sm text-gray-200 font-medium max-w-2xl mx-auto leading-relaxed">
            원하는 향의 강도를 조절해보세요
          </p>
          
          {/* 장식적 구분선 */}
          <div className="flex items-center justify-center mt-4">
            <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
            <div className="mx-3 w-1.5 h-1.5 rounded-full bg-white/60"></div>
            <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          </div>
        </div>
      </motion.div>

      {/* 메인 콘텐츠 컨테이너 */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {Object.keys(feedback.categoryPreferences || {}).map((category, index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.15, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
              className="transform transition-all duration-300"
            >
              <CategorySelector
                category={category as PerfumeCategory}
                currentValue={feedback.categoryPreferences?.[category as PerfumeCategory] || 'maintain'}
                onChange={handleCategoryPreferenceChange}
              />
            </motion.div>
          ))}
        </div>
        
        {/* 하단 안내 메시지 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="mt-8 text-center"
        >
          <div 
            className="inline-flex items-center px-4 py-2 rounded-2xl shadow-lg border border-gray-300/50"
            style={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.8)'
            }}
          >
            <span className="text-lg mr-2">💡</span>
            <p className="text-sm text-gray-700 font-medium">
              당신만의 시그니처 향수를 완성하세요
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};