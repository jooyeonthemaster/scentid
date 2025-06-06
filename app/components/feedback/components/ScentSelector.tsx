"use client";

import React from 'react';
import { PerfumeCategory, SpecificScent } from '@/app/types/perfume';
import { CATEGORY_NAMES } from '../constants/categories';
import { formatScentCode } from '../utils/formatters';

interface ScentSelectorProps {
  availableScents: SpecificScent[];
  selectedScent: SpecificScent | null;
  setSelectedScent: (scent: SpecificScent | null) => void;
  scentSearchTerm: string;
  setScentSearchTerm: (term: string) => void;
  selectedCategory: PerfumeCategory;
  setSelectedCategory: (category: PerfumeCategory) => void;
  onAddScent: () => void;
}

export const ScentSelector: React.FC<ScentSelectorProps> = ({
  availableScents,
  selectedScent,
  setSelectedScent,
  scentSearchTerm,
  setScentSearchTerm,
  selectedCategory,
  setSelectedCategory,
  onAddScent
}) => {
  // 사용 가능한 모든 카테고리
  const categoryOptions: PerfumeCategory[] = ['citrus', 'floral', 'woody', 'musky', 'fruity', 'spicy'];

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center mb-3">
          <div className="flex-1 mr-2">
            <input
              type="text"
              placeholder="향료 이름으로 검색하세요..."
              value={scentSearchTerm}
              onChange={(e) => setScentSearchTerm(e.target.value)}
              className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 placeholder-gray-600 transition-all duration-200 shadow-sm"
              style={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
            />
          </div>
          
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as PerfumeCategory)}
              className="p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 shadow-sm"
              style={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div 
          className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg shadow-lg"
          style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.8)'
          }}
        >
          {availableScents
            .filter(scent => 
              (scentSearchTerm === '' || scent.name.toLowerCase().includes(scentSearchTerm.toLowerCase())) &&
              (scent.category === selectedCategory)
            )
            .slice(0, 8) // 최대 8개까지만 표시
            .map((scent) => (
              <div
                key={scent.id}
                onClick={() => setSelectedScent(scent)}
                className={`p-3 border-b border-gray-100 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                  selectedScent?.id === scent.id 
                    ? 'shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                style={{ 
                  background: selectedScent?.id === scent.id 
                    ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
                    : 'transparent'
                }}
              >
                <div className="flex justify-between">
                  <div>
                    <p 
                      className="font-bold"
                      style={{ 
                        color: selectedScent?.id === scent.id ? '#1e293b' : '#475569'
                      }}
                    >
                      {formatScentCode(scent.id || '')}
                    </p>
                    <p className="text-sm text-gray-600">{scent.name}</p>
                    <p className="text-xs text-gray-500">{scent.description}</p>
                  </div>
                  <div 
                    className="text-xs h-fit rounded-full px-2 py-0.5 shadow-sm"
                    style={{ 
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      color: '#475569',
                      border: '1px solid #cbd5e1'
                    }}
                  >
                    {scent.category || 'woody'}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onAddScent}
          disabled={!selectedScent}
          className={`px-5 py-2.5 rounded-lg transition-all duration-200 transform shadow-lg ${
            selectedScent
              ? 'hover:scale-105 hover:shadow-xl'
              : 'cursor-not-allowed opacity-50'
          }`}
          style={{
            background: selectedScent
              ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
              : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
            color: selectedScent ? '#ffffff' : '#9ca3af',
            boxShadow: selectedScent
              ? '0 10px 25px rgba(30, 41, 59, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
              : '0 4px 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          선택한 향료 추가하기
        </button>
      </div>
    </div>
  );
};

// 선택된 향료 표시 컴포넌트
interface SelectedScentsProps {
  scents: SpecificScent[];
  onRemove: (id: string) => void;
  onRatioChange: (id: string, ratio: number) => void;
}

export const SelectedScents: React.FC<SelectedScentsProps> = ({ 
  scents, 
  onRemove, 
  onRatioChange 
}) => {
  if (!scents || scents.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h3 className="font-medium text-gray-800 mb-4">선택한 향료 ({scents.length}/2)</h3>
      
      <div className="space-y-4 overflow-y-auto overflow-x-hidden scrollbar-hide" style={{ maxHeight: '300px' }}>
        {scents.map((scent) => (
          <div 
            key={scent.id} 
            className="border border-gray-300 rounded-lg p-4 shadow-lg transition-all duration-200 hover:shadow-xl"
            style={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.8)'
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-700">{formatScentCode(scent.id || '')}</p>
                <p className="text-sm text-gray-600">{scent.name}</p>
              </div>
              <button
                onClick={() => onRemove(scent.id || '')}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 shadow-md"
                style={{ 
                  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                  color: '#dc2626',
                  border: '1px solid #fecaca'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <input
              type="hidden"
              value={scent.ratio ?? 50}
              onChange={(e) => onRatioChange(scent.id || '', parseInt(e.target.value))}
            />
          </div>
        ))}
      </div>
    </div>
  );
};