"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ScentSelector, SelectedScents } from '../components/ScentSelector';
import { PerfumeCategory, PerfumeFeedback, SpecificScent } from '@/app/types/perfume';
import { generateAvailableScents } from '../utils/formatters';

interface Step3ViewProps {
  feedback: PerfumeFeedback;
  setFeedback: React.Dispatch<React.SetStateAction<PerfumeFeedback>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const Step3View: React.FC<Step3ViewProps> = ({ 
  feedback, 
  setFeedback,
  setError
}) => {
  const [selectedScent, setSelectedScent] = useState<SpecificScent | null>(null);
  const [scentSearchTerm, setScentSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PerfumeCategory>('citrus');
  
  // 향료 데이터
  const availableScents = generateAvailableScents();

  // 향료 추가 처리
  const handleAddScent = () => {
    if (selectedScent) {
      const updatedScents = [...(feedback.specificScents || [])];
      
      // 이미 있는 향료인지 확인
      const existingIndex = updatedScents.findIndex(s => s.id === selectedScent.id);
      
      if (existingIndex >= 0) {
        // 이미 있는 향료면 알림
        setError('이미 선택한 향료입니다.');
        setTimeout(() => setError(null), 3000); // 3초 후 에러 메시지 사라짐
      } else {
        // 새 향료 추가 (최대 2개까지만 허용)
        if (updatedScents.length >= 2) {
          // 이미 2개가 있으면 알림 표시 후 종료
          setError('향료는 최대 2개까지만 선택할 수 있습니다.');
          setTimeout(() => setError(null), 3000); // 3초 후 에러 메시지 사라짐
          setSelectedScent(null);
          return;
        }
        
        // SpecificScent 형식에 맞추기
        updatedScents.push({
          id: selectedScent.id,
          name: selectedScent.name,
          ratio: 50, // 기본값 50%
          action: 'add' // 필수 속성
        });
      }
      
      setFeedback({
        ...feedback,
        specificScents: updatedScents,
      });
      
      setSelectedScent(null);
    }
  };

  // 향료 제거 처리
  const handleRemoveScent = (id: string) => {
    if (feedback.specificScents) {
      setFeedback({
        ...feedback,
        specificScents: feedback.specificScents.filter(s => s.id !== id),
      });
    }
  };

  // 향료 비율 변경 처리
  const handleScentRatioChange = (id: string, ratio: number) => {
    if (feedback.specificScents) {
      const newScents = [...feedback.specificScents];
      const index = newScents.findIndex(s => s.id === id);
      if (index >= 0) {
        newScents[index] = {
          ...newScents[index],
          ratio: ratio
        };
        setFeedback({...feedback, specificScents: newScents});
      }
    }
  };

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{ 
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
      }}
    >
      {/* 세련된 헤더 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mb-8 rounded-2xl overflow-hidden"
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
          
          <h2 className="text-2xl font-bold text-white mb-2">
            특정 향료 추가하기
          </h2>
          <p className="text-sm text-gray-300">
            원하는 향료를 추가하여 나만의 향수를 완성하세요
          </p>
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* 향료 검색 및 선택 UI */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-xl p-5 shadow-lg border border-gray-300/50"
          style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.8)'
          }}
        >
          <h3 className="font-medium text-gray-800 mb-4 text-center">향료 검색 및 선택</h3>
          
          <ScentSelector
            availableScents={availableScents}
            selectedScent={selectedScent}
            setSelectedScent={setSelectedScent}
            scentSearchTerm={scentSearchTerm}
            setScentSearchTerm={setScentSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onAddScent={handleAddScent}
          />

          {/* 선택된 향료 목록 */}
          {feedback.specificScents?.length ? (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.4 }}
              className="mt-6"
            >
              <SelectedScents
                scents={feedback.specificScents}
                onRemove={handleRemoveScent}
                onRatioChange={handleScentRatioChange}
              />
            </motion.div>
          ) : null}
        </motion.div>

        {/* 하단 안내 메시지 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
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
              최대 2개의 향료를 선택하여 개성을 더해보세요
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};