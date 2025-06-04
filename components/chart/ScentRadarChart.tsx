'use client';

import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { ScentCategoryScores } from '@/app/types/perfume';
import { motion } from 'framer-motion';

// Chart.js 컴포넌트 등록
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface ScentRadarChartProps {
  categories: ScentCategoryScores;
  title?: string;
  showAnimation?: boolean;
}

const ScentRadarChart: React.FC<ScentRadarChartProps> = ({ 
  categories, 
  title = '향 카테고리 프로필',
  showAnimation = true
}) => {
  // 카테고리 이름 매핑
  const categoryNames: Record<keyof ScentCategoryScores, string> = {
    citrus: '시트러스',
    floral: '플로럴',
    woody: '우디',
    musky: '머스크',
    fruity: '프루티',
    spicy: '스파이시'
  };
  
  // 카테고리 색상 매핑 (실버 계열)
  const categoryColors: Record<keyof ScentCategoryScores, string> = {
    citrus: '#9CA3AF', // 라이트 그레이
    floral: '#6B7280', // 그레이
    woody: '#4B5563', // 다크 그레이
    musky: '#374151', // 딥 그레이
    fruity: '#8B8B8B', // 실버
    spicy: '#555555'  // 다크 실버
  };
  
  // 가장 높은 값을 가진 카테고리 찾기
  const entries = Object.entries(categories);
  const maxCategory = entries.reduce(
    (max, [key, value]) => (value > max.value ? { key, value } : max),
    { key: '', value: 0 }
  );
  
  // Chart.js 데이터 구성
  const data = {
    labels: Object.keys(categories).map(key => categoryNames[key as keyof ScentCategoryScores]),
    datasets: [
      {
        label: '향 강도',
        data: Object.values(categories),
        backgroundColor: 'rgba(107, 114, 128, 0.2)', // 그레이 투명
        borderColor: 'rgba(107, 114, 128, 1)', // 그레이
        borderWidth: 2,
        pointBackgroundColor: Object.keys(categories).map(key => 
          categoryColors[key as keyof ScentCategoryScores]
        ),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(107, 114, 128, 1)',
        pointRadius: 5,
        pointHoverRadius: 7
      },
    ],
  };
  
  // Chart.js 옵션 구성
  const options = {
    scales: {
      r: {
        angleLines: {
          display: true,
          color: '#D1D5DB' // 라이트 그레이
        },
        grid: {
          color: '#E5E7EB' // 더 연한 그레이
        },
        pointLabels: {
          color: '#374151', // 딥 그레이
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        ticks: {
          color: '#6B7280', // 그레이
          backdropColor: 'rgba(255, 255, 255, 0.8)'
        },
        suggestedMin: 0,
        suggestedMax: 10
      },
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  const WrapperComponent = showAnimation ? motion.div : 'div';
  
  return (
    <WrapperComponent
      {...(showAnimation ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
      } : {})}
      className="flex flex-col items-center p-4 bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl border border-gray-200 shadow-sm"
      style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      <h3 className="text-lg font-bold mb-4 text-gray-800">{title}</h3>
      
      <div className="w-full max-w-md bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <Radar data={data} options={options} />
      </div>
      
      {/* 주요 향 카테고리 표시 */}
      <div className="mt-4 bg-gradient-to-r from-gray-100 to-gray-200 p-3 rounded-lg text-center border border-gray-300">
        <p className="text-sm text-gray-700">주요 향 카테고리</p>
        <p className="font-medium text-lg" style={{ color: categoryColors[maxCategory.key as keyof ScentCategoryScores] || '#374151' }}>
          {categoryNames[maxCategory.key as keyof ScentCategoryScores] || maxCategory.key} ({maxCategory.value}/10)
        </p>
      </div>
      
      {/* 카테고리 배지 */}
      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        {Object.entries(categories).map(([key, value]) => (
          <div 
            key={key} 
            className="px-2 py-1 bg-white rounded-full text-xs border flex items-center gap-1 shadow-sm"
            style={{ borderColor: categoryColors[key as keyof ScentCategoryScores] || '#ddd' }}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: categoryColors[key as keyof ScentCategoryScores] || '#ddd' }}
            />
            <span className="font-medium text-gray-800">
              {categoryNames[key as keyof ScentCategoryScores]}: {value}
            </span>
          </div>
        ))}
      </div>
    </WrapperComponent>
  );
};

export default ScentRadarChart; 