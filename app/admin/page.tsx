"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface SessionData {
  userId: string;
  sessionId: string;
  phoneNumber: string;
  createdAt: any;
  updatedAt: any;
  status: string;
  customerName: string;
  idolName: string;
  hasImageAnalysis: boolean;
  hasFeedback: boolean;
  hasRecipe: boolean;
  hasConfirmation: boolean;
  completionStatus: string;
}

interface AdminResponse {
  success: boolean;
  sessions: SessionData[];
  totalSessions: number;
  hasMore: boolean;
  lastKey: string | null;
  cached: boolean;
  error?: string;
}

export default function AdminPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadSessions(false);
  }, []);

  // 세션 데이터 로드 함수 (최적화됨)
  const loadSessions = useCallback(async (isLoadMore = false, forceRefresh = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        if (forceRefresh) {
          setIsRefreshing(true);
        }
      }

      const params = new URLSearchParams({
        limit: '20', // 페이지당 20개로 제한
        ...(isLoadMore && lastKey ? { lastKey } : {}),
        ...(forceRefresh ? { refresh: 'true' } : {})
      });

      console.log('📊 API 호출:', { isLoadMore, lastKey, forceRefresh });

      const response = await fetch(`/api/admin?${params.toString()}`);
      const data: AdminResponse = await response.json();
      
      if (data.success) {
        if (isLoadMore) {
          // 더 많은 데이터 추가
          setSessions(prev => [...prev, ...data.sessions]);
        } else {
          // 새로운 데이터로 교체
          setSessions(data.sessions);
        }
        
        setLastKey(data.lastKey);
        setHasMore(data.hasMore);
        setTotalSessions(data.totalSessions);
        
        console.log(`📊 세션 로드 완료: ${data.sessions.length}개 (캐시: ${data.cached})`);
      } else {
        setError(data.error || '데이터 로드 실패');
      }
    } catch (err) {
      setError('서버 연결 오류');
      console.error('Admin 데이터 로드 오류:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [lastKey]);

  // 더 많은 데이터 로드
  const loadMoreSessions = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadSessions(true);
    }
  }, [loadSessions, loadingMore, hasMore]);

  // 새로고침
  const refreshSessions = useCallback(() => {
    setLastKey(null);
    setHasMore(true);
    loadSessions(false, true);
  }, [loadSessions]);

  // 캐시 초기화
  const clearCache = useCallback(async () => {
    try {
      await fetch('/api/admin', { method: 'DELETE' });
      refreshSessions();
      console.log('📊 캐시 초기화 완료');
    } catch (err) {
      console.error('캐시 초기화 오류:', err);
    }
  }, [refreshSessions]);

  // 🗑️ 데이터 정리 함수
  const handleCleanup = useCallback(async (dryRun = true, keepCount = 30) => {
    try {
      setIsCleaningUp(true);
      console.log(`🗑️ 데이터 정리 ${dryRun ? '시뮬레이션' : '실행'} 시작...`);
      
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cleanup',
          keepLatestCount: keepCount,
          dryRun: dryRun
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCleanupResult(result.data);
        console.log('🗑️ 데이터 정리 완료:', result.data);
        
        // 실제 삭제가 완료되면 세션 목록 새로고침
        if (!dryRun) {
          setTimeout(() => {
            refreshSessions();
          }, 2000);
        }
      } else {
        console.error('🗑️ 데이터 정리 실패:', result.error);
        setError(result.error);
      }
    } catch (err) {
      console.error('🗑️ 데이터 정리 오류:', err);
      setError('데이터 정리 중 오류가 발생했습니다.');
    } finally {
      setIsCleaningUp(false);
    }
  }, [refreshSessions]);

  // 시간 포맷팅
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '알 수 없음';
    
    let date;
    if (typeof timestamp === 'object' && timestamp.seconds) {
      // Firebase Timestamp 객체
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return '알 수 없음';
    }
    
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case '완료': return 'bg-green-100 text-green-800';
      case '레시피 생성': return 'bg-blue-100 text-blue-800';
      case '피드백 완료': return 'bg-yellow-100 text-yellow-800';
      case '분석 완료': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 필터링
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.phoneNumber.includes(searchTerm) ||
      session.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || session.completionStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ 오류 발생</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => loadSessions(false)}
            className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AC'SCENT 관리자</h1>
              <p className="text-gray-600">향수 분석 내역 관리</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                총 {totalSessions}개 세션 (로드됨: {sessions.length}개)
              </div>
              <button
                onClick={refreshSessions}
                disabled={isRefreshing}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isRefreshing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    새로고침 중...
                  </>
                ) : (
                  <>🔄 새로고침</>
                )}
              </button>
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={clearCache}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  🗑️ 캐시 초기화
                </button>
              )}
              <button
                onClick={() => setShowCleanupModal(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                🧹 데이터 정리
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 경고문 */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex-shrink-0">
              <div className="text-4xl animate-pulse">⚠️</div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                🚨 주의: AC'SCENT ID 일반용 퍼스널 센트 분석 전용 🚨
              </h2>
              <p className="text-red-100 text-lg font-medium">
                이 시스템은 <span className="font-bold text-white underline">퍼스널 센트 분석 전용</span>입니다. 
                <span className="font-bold text-yellow-300"> 뿌덕(Puduck) 시스템과 헷갈리지 마세요!</span>
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="text-4xl animate-pulse">⚠️</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검색 (비밀번호, 고객명)
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="검색어를 입력하세요..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                진행 상태
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">전체</option>
                <option value="완료">완료</option>
                <option value="레시피 생성">레시피 생성</option>
                <option value="피드백 완료">피드백 완료</option>
                <option value="분석 완료">분석 완료</option>
                <option value="진행 중">진행 중</option>
              </select>
            </div>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    고객 정보
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    최애
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    진행 상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    분석 일시
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSessions.map((session, index) => (
                  <motion.tr
                    key={session.sessionId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.phoneNumber}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{session.idolName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.completionStatus)}`}>
                        {session.completionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(session.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/report/${session.userId}_${session.sessionId}`}
                        className="text-yellow-600 hover:text-yellow-900 mr-4"
                      >
                        보고서 보기
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            
            {filteredSessions.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-gray-500">검색 결과가 없습니다.</div>
              </div>
            )}
          </div>

          {/* 더 보기 버튼 */}
          {hasMore && filteredSessions.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 text-center">
              <button
                onClick={loadMoreSessions}
                disabled={loadingMore}
                className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    로딩 중...
                  </>
                ) : (
                  <>더 보기 ({totalSessions - sessions.length}개 남음)</>
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* 🗑️ 데이터 정리 모달 */}
        {showCleanupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">🗑️ 데이터베이스 정리</h3>
                <button
                  onClick={() => {
                    setShowCleanupModal(false);
                    setCleanupResult(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {!cleanupResult ? (
                <div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-lg font-medium text-yellow-800">주의사항</h4>
                        <div className="mt-2 text-sm text-yellow-700">
                          <ul className="list-disc list-inside space-y-1">
                            <li>이 작업은 오래된 데이터를 영구적으로 삭제합니다</li>
                            <li>최신 30개 세션만 유지되고 나머지는 모두 삭제됩니다</li>
                            <li>삭제된 데이터는 복구할 수 없습니다</li>
                            <li>먼저 시뮬레이션으로 확인해보세요</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleCleanup(true, 30)}
                      disabled={isCleaningUp}
                      className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCleaningUp ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          분석 중...
                        </>
                      ) : (
                        <>🔍 시뮬레이션 (안전)</>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleCleanup(false, 30)}
                      disabled={isCleaningUp}
                      className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCleaningUp ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          삭제 중...
                        </>
                      ) : (
                        <>🗑️ 실제 삭제 (위험)</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-3">📊 정리 결과</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">전체 세션:</span>
                        <span className="ml-2 font-medium">{cleanupResult.totalSessions}개</span>
                      </div>
                      <div>
                        <span className="text-gray-600">유지된 세션:</span>
                        <span className="ml-2 font-medium text-green-600">{cleanupResult.keptCount}개</span>
                      </div>
                      <div>
                        <span className="text-gray-600">삭제 대상:</span>
                        <span className="ml-2 font-medium text-red-600">{cleanupResult.estimatedDeleteCount}개</span>
                      </div>
                      <div>
                        <span className="text-gray-600">실행 시간:</span>
                        <span className="ml-2 font-medium">{cleanupResult.executionTime}ms</span>
                      </div>
                    </div>
                  </div>
                  
                  {cleanupResult.dryRun ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="text-blue-800">
                        <strong>🔍 시뮬레이션 완료</strong>
                        <p className="mt-2 text-sm">실제 삭제되지 않았습니다. 위의 결과를 확인하고 실제 삭제를 진행하세요.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="text-green-800">
                        <strong>✅ 삭제 완료</strong>
                        <p className="mt-2 text-sm">{cleanupResult.deletedCount}개의 세션이 성공적으로 삭제되었습니다.</p>
                      </div>
                    </div>
                  )}
                  
                  {cleanupResult.deletionLog && cleanupResult.deletionLog.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 mb-2">
                        {cleanupResult.dryRun ? '삭제 예정 목록 (미리보기)' : '삭제된 목록'}
                      </h5>
                      <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                        {cleanupResult.deletionLog.slice(0, 10).map((item: any, index: number) => (
                          <div key={index} className="text-sm text-gray-600 py-1">
                            {index + 1}. {item.customerName} ({item.userId})
                            {item.deletedAt && <span className="text-xs text-gray-400 ml-2">{item.deletedAt}</span>}
                          </div>
                        ))}
                        {cleanupResult.deletionLog.length > 10 && (
                          <div className="text-xs text-gray-400 mt-2">
                            ... 외 {cleanupResult.deletionLog.length - 10}개 더
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 