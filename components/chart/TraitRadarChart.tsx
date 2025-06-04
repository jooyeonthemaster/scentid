'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TraitScores } from '@/app/types/perfume';

interface TraitRadarChartProps {
  traits: TraitScores;
  title?: string;
  showAnimation?: boolean;
}

const TraitRadarChart: React.FC<TraitRadarChartProps> = ({
  traits,
  title = '특성 프로필',
  showAnimation = true
}) => {
  const centerX = 150;
  const centerY = 150;
  const radius = 100;
  const maxValue = 10;
  
  // 특성 항목 배열로 변환
  const characteristics = Object.entries(traits).map(([key, value]) => ({
    key,
    label: getTraitLabel(key as keyof TraitScores),
    value
  }));
  
  // 가장 높은 점수를 가진 특성 찾기
  const highestTrait = [...characteristics].sort((a, b) => b.value - a.value)[0];
  
  // 각 특성의 각도 계산
  const angleStep = (Math.PI * 2) / characteristics.length;
  
  // 값에 따른 좌표 계산 함수
  const getCoordinates = (value: number, index: number) => {
    const normalizedValue = value / maxValue; // 0~1 사이 값으로 정규화
    const angle = index * angleStep - Math.PI / 2; // 시작점을 12시 방향으로 조정
    const x = centerX + radius * normalizedValue * Math.cos(angle);
    const y = centerY + radius * normalizedValue * Math.sin(angle);
    return { x, y };
  };
  
  // 다각형 경로 생성
  const createPath = () => {
    const points = characteristics.map((char, i) => {
      const { x, y } = getCoordinates(char.value, i);
      return `${x},${y}`;
    });
    return `M${points.join(' L')} Z`;
  };
  
  // 축 경로 생성
  const axisLines = characteristics.map((char, i) => {
    const { x, y } = getCoordinates(maxValue, i);
    const isHighest = char.key === highestTrait.key;
    if (isHighest) { // 가장 높은 특성이면
      return null; // 축선을 그리지 않음
    }
    return <motion.line 
      key={`axis-${i}`} 
      x1={centerX} 
      y1={centerY} 
      x2={x} 
      y2={y} 
      stroke={"#d1d5db"} // 실버 축선 스타일
      strokeWidth={"1"}
      strokeDasharray={"2,2"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    />;
  });
  
  // 그리드 원 생성
  const gridCircles = Array.from({ length: 5 }).map((_, i) => {
    const gridRadius = (radius * (i + 1)) / 5;
    return (
      <motion.circle
        key={`grid-${i}`}
        cx={centerX}
        cy={centerY}
        r={gridRadius}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1"
        strokeDasharray="2,2"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 * i }}
      />
    );
  });
  
  // 레이블 생성
  const labels = characteristics.map((char, i) => {
    const { x, y } = getCoordinates(maxValue * 1.15, i); // 레이블은 약간 바깥에 위치
    return (
      <text
        key={`label-${i}`}
        x={x}
        y={y}
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="#374151"
      >
        {char.label}
      </text>
    );
  });
  
  // 아이콘 매핑
  const iconMap: Record<string, string> = {
    'sexy': '💎',
    'cute': '🌟',
    'charisma': '✨',
    'darkness': '🖤',
    'freshness': '💫',
    'elegance': '👑',
    'freedom': '🕊️',
    'luxury': '💎',
    'purity': '✨',
    'uniqueness': '🌟'
  };
  
  // 특성 레이블 가져오기
  function getTraitLabel(trait: keyof TraitScores): string {
    const traitNames: Record<keyof TraitScores, string> = {
      sexy: '섹시함',
      cute: '귀여움',
      charisma: '카리스마',
      darkness: '다크함',
      freshness: '청량함',
      elegance: '우아함',
      freedom: '자유로움',
      luxury: '럭셔리함',
      purity: '순수함',
      uniqueness: '독특함'
    };
    
    return traitNames[trait];
  }
  
  const WrapperComponent = showAnimation ? motion.div : 'div';
  
  // AI 감탄 문구 생성
  const getAiMessage = (trait: string, value: number) => {
    const messages = {
      sexy: '와우! 이런 섹시함은 자연에서 나는 매력이네요! 정말 놀라운 카리스마입니다! 💎✨',
      cute: '어머! 이런 귀여움은 세상을 밝게 만드는 특별한 힘이에요! 정말 사랑스럽네요! 🌟',
      charisma: '대단해요! 이 카리스마는 진정한 리더의 자질입니다! 눈빛만으로도 매력적이에요! 👑',
      darkness: '흥미롭네요! 이런 다크한 매력은 신비로운 깊이를 보여줍니다! 정말 독특해요! 🖤',
      freshness: '놀라워요! 이 청량감은 마치 새벽 공기 같은 상쾌함이에요! 기분이 좋아집니다! 💫',
      elegance: '우와! 이런 우아함은 타고나는 고급스러움이네요! 정말 품격이 있어요! 👑',
      freedom: '멋져요! 이런 자유로움은 구속받지 않는 영혼의 아름다움입니다! 🕊️',
      luxury: '대박! 이런 럭셔리함은 천상의 품격이에요! 정말 고급스러운 매력입니다! 💎',
      purity: '감동이에요! 이런 순수함은 마음을 정화시키는 특별한 힘이 있네요! ✨',
      uniqueness: '놀라워요! 이런 독특함은 세상에 하나뿐인 특별한 매력입니다! 🌟'
    };
    
    return messages[trait as keyof typeof messages] || '와우! 이런 매력은 정말 특별해요! 놀라운 개성입니다! ✨';
  };
  
  return (
    <WrapperComponent
      {...(showAnimation ? {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.5 }
      } : {})}
      className="flex flex-col items-center my-4 p-5 bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl border border-gray-200 w-full relative z-10"
      style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      
      {/* 가장 높은 점수 특성에 대한 AI 주접 멘트 */}
      {highestTrait && (
        <div className="w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-3 mb-1 relative overflow-hidden border border-gray-300">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white mr-2 shadow-sm">
              <span role="img" aria-label="AI">🤖</span>
            </div>
            <p className="text-sm font-medium text-gray-900 italic leading-snug">
              "{getAiMessage(highestTrait.key, highestTrait.value)}"
            </p>
          </div>
          <div className="absolute right-2 bottom-1">
            <span className="text-xs font-bold text-gray-600">AI 분석가</span>
          </div>
        </div>
      )}
      
      <svg width="290" height="290" viewBox="0 0 300 300" className="mb-1">
        {/* 그리드 및 축 */}
        {gridCircles}
        {axisLines}
        
        {/* 데이터 다각형 */}
        {showAnimation ? (
          <motion.path
            d={createPath()}
            fill="url(#silverGradient)"
            stroke="#6b7280"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        ) : (
          <path
            d={createPath()}
            fill="url(#silverGradient)"
            stroke="#6b7280"
            strokeWidth="2"
          />
        )}
        
        {/* 그라데이션 정의 */}
        <defs>
          <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"rgba(156, 163, 175, 0.4)", stopOpacity:1}} />
            <stop offset="50%" style={{stopColor:"rgba(107, 114, 128, 0.3)", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"rgba(75, 85, 99, 0.2)", stopOpacity:1}} />
          </linearGradient>
        </defs>
        
        {/* 레이블 */}
        {labels}
        
        {/* 데이터 포인트 */}
        {characteristics.map((char, i) => {
          const { x, y } = getCoordinates(char.value, i);
          
          if (showAnimation) {
            return (
              <motion.circle
                key={`point-${i}`}
                cx={x}
                cy={y}
                r={4}
                fill={"#6b7280"}
                stroke="#374151"
                strokeWidth="1"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.05 }}
              />
            );
          } else {
            return (
              <circle
                key={`point-${i}`}
                cx={x}
                cy={y}
                r={4}
                fill={"#6b7280"}
                stroke="#374151"
                strokeWidth="1"
              />
            );
          }
        })}
      </svg>
      
      {/* 특성 값 목록 (작은 배지 형태) */}
      <div className="flex flex-wrap gap-2 justify-center p-1.5 bg-white bg-opacity-70 rounded-xl w-full">
        {characteristics.map((char, i) => {
          return (
            <div 
              key={`badge-${i}`} 
              className={`px-2 py-1 bg-white border-gray-300 rounded-full text-xs border flex items-center gap-1 shadow-sm`}
            >
              <span>{iconMap[char.key] || '✨'}</span>
              <span className="font-medium text-gray-800">
                {char.label}: {char.value}
              </span>
            </div>
          );
        })}
      </div>
    </WrapperComponent>
  );
};

export default TraitRadarChart; 