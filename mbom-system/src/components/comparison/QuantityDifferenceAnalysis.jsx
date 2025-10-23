import React, { useState, useMemo, useCallback } from 'react';
import { useBOMData } from '../../contexts/BOMDataContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * EBOM vs MBOM 수량 차이 분석 대시보드
 * AI 기반 분석 및 추가 파트 레벨 분석 포함
 */
const QuantityDifferenceAnalysis = () => {
  const { bomData } = useBOMData();
  const { showSuccess, showWarning, showError, showInfo } = useNotification();
  const { theme } = useTheme();

  const [filter, setFilter] = useState('all'); // all, increased, decreased, added, deleted
  const [sortBy, setSortBy] = useState('difference'); // difference, percentage, partNumber
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  // EBOM 데이터 시뮬레이션 (실제로는 API에서 가져옴)
  const ebomData = useMemo(() => {
    return bomData.map(item => ({
      ...item,
      ebomQuantity: item.quantity || 1,
      mbomQuantity: item.quantity + Math.floor(Math.random() * 5 - 2), // 시뮬레이션
      isNew: Math.random() > 0.9, // 10% 확률로 새 파트
      isDeleted: Math.random() > 0.95 // 5% 확률로 삭제된 파트
    }));
  }, [bomData]);

  // 수량 차이 계산
  const quantityDifferences = useMemo(() => {
    return ebomData.map(item => {
      const diff = item.mbomQuantity - item.ebomQuantity;
      const percentage = item.ebomQuantity > 0
        ? ((diff / item.ebomQuantity) * 100).toFixed(1)
        : item.mbomQuantity > 0 ? 100 : 0;

      return {
        ...item,
        difference: diff,
        differencePercentage: parseFloat(percentage),
        status: item.isNew ? 'added' :
                item.isDeleted ? 'deleted' :
                diff > 0 ? 'increased' :
                diff < 0 ? 'decreased' : 'same',
        severity: Math.abs(percentage) >= 10 ? 'high' :
                 Math.abs(percentage) >= 5 ? 'medium' : 'low'
      };
    });
  }, [ebomData]);

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    let filtered = quantityDifferences;

    if (filter !== 'all') {
      filtered = filtered.filter(item => item.status === filter);
    }

    // 정렬
    filtered.sort((a, b) => {
      if (sortBy === 'difference') {
        return Math.abs(b.difference) - Math.abs(a.difference);
      } else if (sortBy === 'percentage') {
        return Math.abs(b.differencePercentage) - Math.abs(a.differencePercentage);
      } else {
        return a.partNumber.localeCompare(b.partNumber);
      }
    });

    return filtered;
  }, [quantityDifferences, filter, sortBy]);

  // 통계 계산
  const statistics = useMemo(() => {
    const totalEBOM = quantityDifferences.reduce((sum, item) => sum + item.ebomQuantity, 0);
    const totalMBOM = quantityDifferences.reduce((sum, item) => sum + item.mbomQuantity, 0);
    const totalDiff = totalMBOM - totalEBOM;

    const increased = quantityDifferences.filter(item => item.status === 'increased').length;
    const decreased = quantityDifferences.filter(item => item.status === 'decreased').length;
    const same = quantityDifferences.filter(item => item.status === 'same').length;
    const added = quantityDifferences.filter(item => item.status === 'added').length;
    const deleted = quantityDifferences.filter(item => item.status === 'deleted').length;

    const highSeverity = quantityDifferences.filter(item => item.severity === 'high').length;

    return {
      totalEBOM,
      totalMBOM,
      totalDiff,
      diffPercentage: totalEBOM > 0 ? ((totalDiff / totalEBOM) * 100).toFixed(1) : 0,
      increased,
      decreased,
      same,
      added,
      deleted,
      highSeverity,
      total: quantityDifferences.length
    };
  }, [quantityDifferences]);

  // AI 분석 실행
  const runAIAnalysis = useCallback(() => {
    setShowAIAnalysis(true);
    showInfo('AI 분석을 실행 중입니다...');

    // 실제로는 백엔드 AI API 호출
    setTimeout(() => {
      showSuccess('AI 분석이 완료되었습니다');
    }, 2000);
  }, [showInfo, showSuccess]);

  // 수량 동기화
  const syncQuantities = useCallback((item) => {
    showSuccess(`${item.partNumber}의 수량이 동기화되었습니다`);
    // 실제 동기화 로직
  }, [showSuccess]);

  // Excel 내보내기
  const exportToExcel = useCallback(() => {
    showInfo('Excel 파일로 내보내기 중...');
    // 실제 Excel 내보내기 로직
  }, [showInfo]);

  // 차이 승인/거부
  const approveDifference = useCallback((item, approved) => {
    if (approved) {
      showSuccess(`${item.partNumber}의 수량 차이가 승인되었습니다`);
    } else {
      showWarning(`${item.partNumber}의 수량 차이가 거부되었습니다`);
    }
  }, [showSuccess, showWarning]);

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: theme === 'dark' ? '#1e1e1e' : '#f9fafb' }}>
      {/* 헤더 */}
      <div style={{ padding: '20px', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb' }}>
        <h2 style={{ color: theme === 'dark' ? '#cccccc' : '#111827', marginBottom: '20px' }}>
          🔍 EBOM vs MBOM 수량 차이 분석
        </h2>

        {/* 상단 요약 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px' }}>
          <div style={{ background: theme === 'dark' ? '#2d2d30' : '#ffffff', padding: '15px', borderRadius: '6px', borderLeft: '3px solid #007acc', border: theme === 'dark' ? 'none' : '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#969696' : '#6b7280', marginBottom: '5px' }}>총 수량 차이</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: statistics.totalDiff > 0 ? '#27ae60' : statistics.totalDiff < 0 ? '#e74c3c' : '#4fc3f7' }}>
              {statistics.totalDiff > 0 ? '+' : ''}{statistics.totalDiff}개
            </div>
            <div style={{ fontSize: '11px', color: theme === 'dark' ? '#969696' : '#6b7280', marginTop: '5px' }}>
              EBOM: {statistics.totalEBOM} → MBOM: {statistics.totalMBOM}
            </div>
          </div>

          <div style={{ background: theme === 'dark' ? '#2d2d30' : '#ffffff', padding: '15px', borderRadius: '6px', borderLeft: '3px solid #27ae60', border: theme === 'dark' ? 'none' : '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#969696' : '#6b7280', marginBottom: '5px' }}>증가된 부품</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#27ae60' }}>
              {statistics.increased}개
            </div>
            <div style={{ fontSize: '11px', color: theme === 'dark' ? '#969696' : '#6b7280', marginTop: '5px' }}>
              ({((statistics.increased / statistics.total) * 100).toFixed(1)}%)
            </div>
          </div>

          <div style={{ background: theme === 'dark' ? '#2d2d30' : '#ffffff', padding: '15px', borderRadius: '6px', borderLeft: '3px solid #e74c3c', border: theme === 'dark' ? 'none' : '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#969696' : '#6b7280', marginBottom: '5px' }}>감소된 부품</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c' }}>
              {statistics.decreased}개
            </div>
            <div style={{ fontSize: '11px', color: theme === 'dark' ? '#969696' : '#6b7280', marginTop: '5px' }}>
              ({((statistics.decreased / statistics.total) * 100).toFixed(1)}%)
            </div>
          </div>

          <div style={{ background: theme === 'dark' ? '#2d2d30' : '#ffffff', padding: '15px', borderRadius: '6px', borderLeft: '3px solid #f39c12', border: theme === 'dark' ? 'none' : '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#969696' : '#6b7280', marginBottom: '5px' }}>새로 추가</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f39c12' }}>
              {statistics.added}개
            </div>
            <div style={{ fontSize: '11px', color: theme === 'dark' ? '#969696' : '#6b7280', marginTop: '5px' }}>
              신규 파트
            </div>
          </div>

          <div style={{ background: theme === 'dark' ? '#2d2d30' : '#ffffff', padding: '15px', borderRadius: '6px', borderLeft: '3px solid #9b59b6', border: theme === 'dark' ? 'none' : '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#969696' : '#6b7280', marginBottom: '5px' }}>⚠️ 주의 필요</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c' }}>
              {statistics.highSeverity}개
            </div>
            <div style={{ fontSize: '11px', color: theme === 'dark' ? '#969696' : '#6b7280', marginTop: '5px' }}>
              10% 이상 차이
            </div>
          </div>
        </div>

        {/* 툴바 */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="vscode-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="all">전체 보기</option>
            <option value="increased">증가된 부품</option>
            <option value="decreased">감소된 부품</option>
            <option value="added">추가된 부품</option>
            <option value="deleted">삭제된 부품</option>
            <option value="same">동일 수량</option>
          </select>

          <select
            className="vscode-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="difference">차이 순</option>
            <option value="percentage">차이율 순</option>
            <option value="partNumber">부품번호 순</option>
          </select>

          <button className="vscode-button" onClick={runAIAnalysis}>
            🤖 AI 분석 실행
          </button>

          <button className="vscode-button secondary" onClick={exportToExcel}>
            📊 Excel 내보내기
          </button>

          <button className="vscode-button secondary">
            🔄 전체 동기화
          </button>
        </div>
      </div>

      {/* 메인 테이블 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: theme === 'dark' ? '#252526' : '#ffffff' }}>
          <thead>
            <tr style={{ background: theme === 'dark' ? '#2d2d30' : '#f3f4f6', position: 'sticky', top: 0 }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #007acc', color: theme === 'dark' ? '#cccccc' : '#111827' }}>Level</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #007acc', color: theme === 'dark' ? '#cccccc' : '#111827' }}>Part Number</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #007acc', color: theme === 'dark' ? '#cccccc' : '#111827' }}>Part Name</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #007acc', color: theme === 'dark' ? '#cccccc' : '#111827' }}>EBOM 수량</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #007acc', color: theme === 'dark' ? '#cccccc' : '#111827' }}>MBOM 수량</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #007acc', color: theme === 'dark' ? '#cccccc' : '#111827' }}>차이</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #007acc', color: theme === 'dark' ? '#cccccc' : '#111827' }}>차이율</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #007acc', color: theme === 'dark' ? '#cccccc' : '#111827' }}>상태</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #007acc', color: theme === 'dark' ? '#cccccc' : '#111827' }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr
                key={item.id}
                style={{
                  borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb',
                  background: selectedItem?.id === item.id ? '#094771' :
                             item.severity === 'high' ? 'rgba(231, 76, 60, 0.1)' :
                             index % 2 === 0 ? '#1e1e1e' : '#252526',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedItem(item)}
              >
                <td style={{ padding: '10px', color: theme === 'dark' ? '#cccccc' : '#111827' }}>
                  {item.level}
                </td>
                <td style={{ padding: '10px', color: '#9cdcfe', fontWeight: 'bold' }}>
                  {item.partNumber}
                </td>
                <td style={{ padding: '10px', color: theme === 'dark' ? '#cccccc' : '#111827' }}>
                  {item.description || item.partName || '-'}
                </td>
                <td style={{ padding: '10px', textAlign: 'center', color: theme === 'dark' ? '#cccccc' : '#111827' }}>
                  {item.ebomQuantity}
                </td>
                <td style={{ padding: '10px', textAlign: 'center', color: theme === 'dark' ? '#cccccc' : '#111827' }}>
                  {item.mbomQuantity}
                </td>
                <td style={{
                  padding: '10px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: item.difference > 0 ? '#27ae60' :
                         item.difference < 0 ? '#e74c3c' : '#969696'
                }}>
                  {item.difference > 0 ? '+' : ''}{item.difference}
                </td>
                <td style={{
                  padding: '10px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: item.severity === 'high' ? '#e74c3c' :
                         item.severity === 'medium' ? '#f39c12' : '#969696'
                }}>
                  {item.differencePercentage}%
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    background: item.status === 'increased' ? '#27ae60' :
                               item.status === 'decreased' ? '#e74c3c' :
                               item.status === 'added' ? '#f39c12' :
                               item.status === 'deleted' ? '#9b59b6' : '#3498db',
                    color: 'white'
                  }}>
                    {item.status === 'increased' ? '증가' :
                     item.status === 'decreased' ? '감소' :
                     item.status === 'added' ? '추가' :
                     item.status === 'deleted' ? '삭제' : '동일'}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button
                    className="vscode-button"
                    style={{ padding: '2px 8px', fontSize: '11px', marginRight: '5px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      syncQuantities(item);
                    }}
                  >
                    동기화
                  </button>
                  <button
                    className="vscode-button secondary"
                    style={{ padding: '2px 8px', fontSize: '11px', marginRight: '5px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      approveDifference(item, true);
                    }}
                  >
                    ✓
                  </button>
                  <button
                    className="vscode-button secondary"
                    style={{ padding: '2px 8px', fontSize: '11px', background: '#e74c3c' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      approveDifference(item, false);
                    }}
                  >
                    ✗
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI 분석 결과 패널 */}
      {showAIAnalysis && (
        <div style={{
          position: 'absolute',
          right: '20px',
          top: '100px',
          width: '400px',
          background: theme === 'dark' ? '#2d2d30' : '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          padding: '20px',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ color: theme === 'dark' ? '#cccccc' : '#111827' }}>🤖 AI 분석 결과</h3>
            <button
              style={{ background: 'transparent', border: 'none', color: theme === 'dark' ? '#cccccc' : '#111827', cursor: 'pointer' }}
              onClick={() => setShowAIAnalysis(false)}
            >
              ✕
            </button>
          </div>

          <div style={{ color: theme === 'dark' ? '#cccccc' : '#111827', fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '15px', padding: '10px', background: theme === 'dark' ? '#1e1e1e' : '#f3f4f6', borderRadius: '4px' }}>
              <strong>📊 주요 발견사항:</strong>
              <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                <li>엔진 관련 부품에서 평균 15% 수량 증가</li>
                <li>전장 부품 10개 항목 신규 추가</li>
                <li>볼트류 전체적으로 20% 과다 책정</li>
              </ul>
            </div>

            <div style={{ marginBottom: '15px', padding: '10px', background: theme === 'dark' ? '#1e1e1e' : '#f3f4f6', borderRadius: '4px' }}>
              <strong>⚠️ 리스크 요인:</strong>
              <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                <li>핵심 부품 3개 공급 부족 예상</li>
                <li>리드타임 30일 초과 부품 5개</li>
                <li>단가 상승으로 예산 초과 위험</li>
              </ul>
            </div>

            <div style={{ marginBottom: '15px', padding: '10px', background: theme === 'dark' ? '#1e1e1e' : '#f3f4f6', borderRadius: '4px' }}>
              <strong>💡 권장사항:</strong>
              <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                <li>볼트류 수량 재검토 필요</li>
                <li>신규 추가 부품 승인 프로세스 진행</li>
                <li>공급업체와 긴급 협의 필요</li>
              </ul>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button className="vscode-button" style={{ flex: 1 }}>
                상세 리포트
              </button>
              <button className="vscode-button secondary" style={{ flex: 1 }}>
                Excel 내보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 선택된 항목 상세 정보 */}
      {selectedItem && (
        <div style={{
          borderTop: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb',
          padding: '20px',
          background: theme === 'dark' ? '#252526' : '#f9fafb',
          height: '200px'
        }}>
          <h3 style={{ color: theme === 'dark' ? '#cccccc' : '#111827', marginBottom: '15px' }}>
            📋 상세 분석: {selectedItem.partNumber}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ color: theme === 'dark' ? '#969696' : '#6b7280', fontSize: '12px', marginBottom: '10px' }}>수량 정보</h4>
              <div style={{ color: theme === 'dark' ? '#cccccc' : '#111827', fontSize: '13px' }}>
                <div>EBOM: {selectedItem.ebomQuantity}개</div>
                <div>MBOM: {selectedItem.mbomQuantity}개</div>
                <div style={{ fontWeight: 'bold', color: selectedItem.difference > 0 ? '#27ae60' : '#e74c3c' }}>
                  차이: {selectedItem.difference > 0 ? '+' : ''}{selectedItem.difference}개 ({selectedItem.differencePercentage}%)
                </div>
              </div>
            </div>
            <div>
              <h4 style={{ color: theme === 'dark' ? '#969696' : '#6b7280', fontSize: '12px', marginBottom: '10px' }}>부품 정보</h4>
              <div style={{ color: theme === 'dark' ? '#cccccc' : '#111827', fontSize: '13px' }}>
                <div>레벨: {selectedItem.level}</div>
                <div>공급업체: {selectedItem.supplier || '-'}</div>
                <div>리드타임: {selectedItem.leadtime || 0}일</div>
              </div>
            </div>
            <div>
              <h4 style={{ color: theme === 'dark' ? '#969696' : '#6b7280', fontSize: '12px', marginBottom: '10px' }}>영향도 분석</h4>
              <div style={{ color: theme === 'dark' ? '#cccccc' : '#111827', fontSize: '13px' }}>
                <div>비용 영향: {(selectedItem.difference * (selectedItem.cost || 1000)).toLocaleString()}원</div>
                <div>중요도: {selectedItem.severity === 'high' ? '높음' : selectedItem.severity === 'medium' ? '중간' : '낮음'}</div>
                <div>승인 상태: {selectedItem.approved ? '승인됨' : '검토 필요'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuantityDifferenceAnalysis;