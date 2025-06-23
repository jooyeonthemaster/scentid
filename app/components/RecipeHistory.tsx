'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RecipeHistoryItem, RecipeHistoryResponse, RecipeActionResponse, TestingGranule } from '../types/perfume';

interface RecipeHistoryProps {
  userId: string;
  sessionId: string;
  analysisId?: string;
  currentRecipe?: RecipeHistoryItem;
  onRecipeSelect?: (recipe: RecipeHistoryItem) => void;
  onRecipeActivate?: (recipe: RecipeHistoryItem) => void;
  className?: string;
}

const RecipeHistory: React.FC<RecipeHistoryProps> = ({
  userId,
  sessionId,
  analysisId,
  currentRecipe,
  onRecipeSelect,
  onRecipeActivate,
  className = ''
}) => {
  const [recipes, setRecipes] = useState<RecipeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeHistoryItem | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [activatingRecipe, setActivatingRecipe] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRecipe, setDetailRecipe] = useState<RecipeHistoryItem | null>(null);
  const [selectedVolumeType, setSelectedVolumeType] = useState<'10ml' | '50ml'>('10ml');

  // 레시피 히스토리 로드
  const loadRecipeHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // analysisId가 있으면 분석별로, 없으면 세션별로 조회
      const params = new URLSearchParams();
      params.append('userId', userId);
      
      if (analysisId) {
        params.append('analysisId', analysisId);
        console.log('분석별 레시피 히스토리 조회:', { userId, analysisId });
      } else {
        params.append('sessionId', sessionId);
        console.log('세션별 레시피 히스토리 조회 (하위호환):', { userId, sessionId });
      }
      
      const response = await fetch(`/api/recipe-history?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setRecipes(data.recipes || []);
        console.log(`레시피 히스토리 로드 완료: ${data.recipes?.length || 0}개`);
      } else {
        setError(data.error || '레시피 히스토리를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('레시피 히스토리 로딩 오류:', err);
      setError('레시피 히스토리를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId, sessionId, analysisId]);

  useEffect(() => {
    if (userId && (sessionId || analysisId)) {
      loadRecipeHistory();
    }
  }, [loadRecipeHistory]);

  // 레시피 북마크 토글
  const toggleBookmark = async (recipeId: string, isBookmarked: boolean) => {
    try {
      const response = await fetch('/api/recipe-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bookmark',
          userId,
          recipeId,
          isBookmarked: !isBookmarked
        })
      });

      const data: RecipeActionResponse = await response.json();
      
      if (data.success) {
        setRecipes(prev => prev.map(recipe =>
          recipe.id === recipeId
            ? { ...recipe, isBookmarked: data.isBookmarked }
            : recipe
        ));
      } else {
        alert('북마크 업데이트에 실패했습니다.');
      }
    } catch (err) {
      alert('북마크 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 레시피 활성화
  const activateRecipe = async (recipe: RecipeHistoryItem) => {
    setActivatingRecipe(recipe.id);
    
    try {
      const response = await fetch('/api/recipe-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          userId,
          sessionId,
          recipeData: recipe
        })
      });

      const data: RecipeActionResponse = await response.json();
      
      if (data.success) {
        onRecipeActivate?.(recipe);
        alert(data.message);
      } else {
        alert('레시피 활성화에 실패했습니다.');
      }
    } catch (err) {
      alert('레시피 활성화 중 오류가 발생했습니다.');
    } finally {
      setActivatingRecipe(null);
    }
  };

  // 레시피 선택
  const handleRecipeSelect = (recipe: RecipeHistoryItem) => {
    setSelectedRecipe(recipe);
    onRecipeSelect?.(recipe);
  };

  // 레시피 상세 보기
  const showRecipeDetail = (recipe: RecipeHistoryItem) => {
    setDetailRecipe(recipe);
    setShowDetailModal(true);
  };

  // 레시피 비교 기능
  const compareRecipes = () => {
    if (!currentRecipe || !selectedRecipe) return null;

    const currentGranules = currentRecipe.improvedRecipe?.testingRecipe?.granules || [];
    const selectedGranules = selectedRecipe.improvedRecipe?.testingRecipe?.granules || [];

    return {
      current: currentRecipe,
      selected: selectedRecipe,
      differences: {
        granules: {
          added: selectedGranules.filter(sg => 
            !currentGranules.find(cg => cg.id === sg.id)
          ),
          removed: currentGranules.filter(cg => 
            !selectedGranules.find(sg => sg.id === cg.id)
          ),
          modified: selectedGranules.filter(sg => {
            const currentGranule = currentGranules.find(cg => cg.id === sg.id);
            return currentGranule && (
              currentGranule.drops !== sg.drops || 
              currentGranule.ratio !== sg.ratio
            );
          })
        },
        ratioChanges: []
      }
    };
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderGranulesList = (granules: TestingGranule[]) => (
    <div className="mt-2">
      {granules.length > 3 ? (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {granules.slice(0, 2).map((granule, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {granule.name}
              </span>
            ))}
            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{granules.length - 2}개 더
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {granules.map((granule, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {granule.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  // 향료 계산 함수 (기준량 2배 증가: 10ml=2g, 50ml=10g)
  const calculateGrams = (drops: number, volumeType: '10ml' | '50ml') => {
    if (volumeType === '10ml') {
      // 10ml 기준: 2g 총량 (방울당 0.2g)
      return (drops * 0.2).toFixed(1);
    } else {
      // 50ml 기준: 10g 총량 (방울당 1g)
      return (drops * 1.0).toFixed(1);
    }
  };

  // 총 무게 계산 함수
  const calculateTotalWeight = (granules: any[], volumeType: '10ml' | '50ml') => {
    const totalDrops = granules.reduce((sum: number, g: any) => sum + g.drops, 0);
    return calculateGrams(totalDrops, volumeType);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          <span className="ml-3 text-gray-600">레시피 히스토리 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️ 오류 발생</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadRecipeHistory}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            📝 레시피 히스토리
          </h3>
          <span className="text-xs sm:text-sm text-gray-500">
            총 {recipes.length}개
          </span>
        </div>

        {recipes.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-gray-400 text-3xl mb-3">📋</div>
            <p className="text-gray-500 text-sm">아직 생성된 레시피가 없습니다.</p>
            <p className="text-gray-400 text-xs mt-2">
              피드백을 통해 첫 번째 레시피를 만들어보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe, index) => (
              <div
                key={recipe.id}
                className={`border rounded-lg transition-all cursor-pointer ${
                  selectedRecipe?.id === recipe.id
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleRecipeSelect(recipe)}
              >
                {/* 모바일 최적화된 헤더 */}
                <div className="px-3 py-2 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        레시피 #{recipes.length - index}
                      </span>
                      {recipe.isBookmarked && (
                        <span className="text-yellow-500 text-sm">⭐</span>
                      )}
                      {recipe.selectedFromHistory && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          활성화됨
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(recipe.createdAt)}
                    </span>
                  </div>
                </div>

                {/* 컨텐츠 영역 */}
                <div className="p-3">
                  {recipe.improvedRecipe?.originalPerfumeName && (
                    <p className="text-sm text-gray-600 mb-2">
                      기반: <span className="font-medium">{recipe.improvedRecipe.originalPerfumeName}</span>
                    </p>
                  )}

                  {recipe.improvedRecipe?.testingRecipe?.granules && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 mb-1">
                        향료 {recipe.improvedRecipe.testingRecipe.granules.length}개
                      </p>
                      {renderGranulesList(recipe.improvedRecipe.testingRecipe.granules)}
                    </div>
                  )}

                  {recipe.improvedRecipe?.overallExplanation && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {recipe.improvedRecipe.overallExplanation}
                    </p>
                  )}

                  {/* 모바일 최적화된 버튼 영역 */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showRecipeDetail(recipe);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 font-medium"
                      title="레시피 상세 정보 보기"
                    >
                      상세 보기
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(recipe.id, recipe.isBookmarked || false);
                        }}
                        className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                          recipe.isBookmarked
                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600'
                        }`}
                        title={recipe.isBookmarked ? '북마크 제거' : '북마크 추가'}
                      >
                        ⭐
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          activateRecipe(recipe);
                        }}
                        disabled={activatingRecipe === recipe.id}
                        className="flex-1 px-3 py-2 bg-pink-500 text-white text-sm rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        title="이 레시피를 현재 레시피로 설정"
                      >
                        {activatingRecipe === recipe.id ? '설정 중...' : '활성화'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {selectedRecipe && currentRecipe && selectedRecipe.id !== currentRecipe.id && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3">🔄 레시피 비교</h4>
                <div className="text-sm text-blue-800">
                  <p className="mb-2">
                    <strong>현재:</strong> {currentRecipe.improvedRecipe?.originalPerfumeName || '현재 레시피'}
                  </p>
                  <p className="mb-3">
                    <strong>선택:</strong> {selectedRecipe.improvedRecipe?.originalPerfumeName || '선택한 레시피'}
                  </p>
                  
                  {(() => {
                    const comparison = compareRecipes();
                    if (!comparison) return null;
                    
                    return (
                      <div className="space-y-2">
                        {comparison.differences.granules.added.length > 0 && (
                          <p>
                            <span className="text-green-600">추가된 향료:</span> {
                              comparison.differences.granules.added.map(g => g.name).join(', ')
                            }
                          </p>
                        )}
                        {comparison.differences.granules.removed.length > 0 && (
                          <p>
                            <span className="text-red-600">제거된 향료:</span> {
                              comparison.differences.granules.removed.map(g => g.name).join(', ')
                            }
                          </p>
                        )}
                        {comparison.differences.granules.modified.length > 0 && (
                          <p>
                            <span className="text-orange-600">변경된 향료:</span> {
                              comparison.differences.granules.modified.map(g => g.name).join(', ')
                            }
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 레시피 상세 모달 */}
      {showDetailModal && detailRecipe && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <span className="text-xl mr-2">⚗️</span>
                향료 정보
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold p-1"
              >
                ×
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* 용량 선택 토글 */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">향수 용량 선택</h4>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedVolumeType('10ml')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedVolumeType === '10ml'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    10ml (총 2g)
                  </button>
                  <button
                    onClick={() => setSelectedVolumeType('50ml')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedVolumeType === '50ml'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    50ml (총 10g)
                  </button>
                </div>
              </div>

              {/* 향료 조합 */}
              {detailRecipe.improvedRecipe?.testingRecipe?.granules && detailRecipe.improvedRecipe.testingRecipe.granules.length > 0 ? (
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">🧪</span>향료 조합
                  </h4>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="space-y-2">
                      {detailRecipe.improvedRecipe.testingRecipe.granules.map((granule: any, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm truncate">{granule.name}</p>
                            <p className="text-xs text-gray-500">({granule.id})</p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-lg font-bold text-blue-600">{calculateGrams(granule.drops, selectedVolumeType)}g</p>
                            <p className="text-xs text-gray-500">{granule.drops}방울</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 총 무게 */}
                    <div className="mt-3 pt-2 border-t border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800 text-sm">총 무게:</span>
                        <span className="text-lg font-bold text-blue-600">
                          {calculateTotalWeight(detailRecipe.improvedRecipe.testingRecipe.granules, selectedVolumeType)}g
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">🚨</span>향료 정보 없음
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-sm">이 레시피에는 향료 정보가 없습니다.</p>
                  </div>
                </div>
              )}

              {/* 버튼들 */}
              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    activateRecipe(detailRecipe);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-medium text-sm"
                >
                  이 레시피 활성화
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeHistory; 