"use client";

import React from 'react';
import { PerfumeCategory, CategoryPreference } from '@/app/types/perfume';
import { CATEGORY_NAMES, CATEGORY_ICONS, CATEGORY_DESCRIPTIONS, CATEGORY_EXAMPLES } from '../constants/categories';

interface CategorySelectorProps {
  category: PerfumeCategory;
  currentValue: CategoryPreference;
  onChange: (cat: PerfumeCategory, pref: CategoryPreference) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  category, 
  currentValue, 
  onChange 
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl mb-6 shadow-xl backdrop-blur-sm border border-gray-200/50"
         style={{ 
           background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
           boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.7)'
         }}>
      
      {/* 세련된 헤더 섹션 */}
      <div className="relative p-4 pb-3"
           style={{ 
             background: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%)'
           }}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-white/10"></div>
        
        <div className="relative flex items-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mr-3 text-2xl shadow-lg border border-white/20"
               style={{ 
                 background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)',
                 boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.8), 0 8px 16px rgba(0, 0, 0, 0.15)'
               }}>
            {CATEGORY_ICONS[category]}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-white mb-1 tracking-wide drop-shadow-lg">
              {CATEGORY_NAMES[category]}
            </h3>
            <p className="text-xs text-gray-200 leading-relaxed font-medium">
              {CATEGORY_DESCRIPTIONS[category]}
            </p>
          </div>
        </div>
      </div>
      
      {/* 예시 섹션 */}
      <div className="px-4 py-2 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200/50">
        <p className="text-sm text-gray-700">
          <span className="font-bold text-gray-900 mr-2">✨ 대표 향료</span>
          <span className="text-gray-600">{CATEGORY_EXAMPLES[category]}</span>
        </p>
      </div>
      
      {/* 세련된 버튼 그룹 */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => onChange(category, 'decrease')}
            className={`group relative py-3 px-1 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              currentValue === 'decrease' 
                ? 'bg-gradient-to-br from-gray-800 to-black text-white shadow-xl border-2 border-gray-600' 
                : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 shadow-md border border-gray-300'
            }`}
            style={currentValue === 'decrease' ? {
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
            } : {}}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex flex-col items-center">
              <span className="text-lg mb-1 transform group-hover:scale-110 transition-transform duration-300">👇</span>
              <span className="text-xs font-bold tracking-wide">더 약하게</span>
            </div>
          </button>
          
          <button
            onClick={() => onChange(category, 'maintain')}
            className={`group relative py-3 px-1 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              currentValue === 'maintain' 
                ? 'bg-gradient-to-br from-gray-800 to-black text-white shadow-xl border-2 border-gray-600' 
                : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 shadow-md border border-gray-300'
            }`}
            style={currentValue === 'maintain' ? {
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
            } : {}}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex flex-col items-center">
              <span className="text-lg mb-1 transform group-hover:scale-110 transition-transform duration-300">👌</span>
              <span className="text-xs font-bold tracking-wide">현재 유지</span>
            </div>
          </button>
          
          <button 
            onClick={() => onChange(category, 'increase')}
            className={`group relative py-3 px-1 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              currentValue === 'increase' 
                ? 'bg-gradient-to-br from-gray-800 to-black text-white shadow-xl border-2 border-gray-600' 
                : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 shadow-md border border-gray-300'
            }`}
            style={currentValue === 'increase' ? {
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
            } : {}}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex flex-col items-center">
              <span className="text-lg mb-1 transform group-hover:scale-110 transition-transform duration-300">👆</span>
              <span className="text-xs font-bold tracking-wide">더 강하게</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};