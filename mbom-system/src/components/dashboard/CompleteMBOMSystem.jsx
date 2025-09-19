import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useBOMData } from '../../contexts/BOMDataContext';
import MoveableBOMGrid from '../grid/MoveableBOMGrid';
import { statusColors, statusLabels } from '../../data/sampleBOMData';

const CompleteMBOMSystem = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const {
    bomData,
    selectedItem,
    changeHistory,
    loading,
    setSelectedItem,
    setChangeHistory,
    saveBOMData,
    loadBOMData,
    updateBOMItem
  } = useBOMData();

  // States
  const [activeTab, setActiveTab] = useState('structure');
  const [showChanges, setShowChanges] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set([1, 2, 7, 10, 13]));
  const [selectedTreeItem, setSelectedTreeItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [analysisData, setAnalysisData] = useState(null);

  // Calculate statistics
  const calculateStatistics = useCallback(() => {
    let totalCost = 0;
    let totalWeight = 0;
    let itemCount = 0;
    let statusCount = { approved: 0, review: 0, draft: 0, rejected: 0 };
    let levelCount = { 0: 0, 1: 0, 2: 0, 3: 0 };
    let criticalLeadtime = [];

    const processItem = (item) => {
      itemCount++;
      totalCost += item.cost || 0;
      totalWeight += item.weight || 0;

      if (item.status) statusCount[item.status] = (statusCount[item.status] || 0) + 1;
      if (item.level !== undefined) levelCount[item.level] = (levelCount[item.level] || 0) + 1;
      if ((item.leadtime || 0) > 30) criticalLeadtime.push(item);

      if (item.children && item.children.length > 0) {
        item.children.forEach(processItem);
      }
    };

    bomData.forEach(processItem);

    return {
      totalCost,
      totalWeight,
      itemCount,
      statusCount,
      levelCount,
      criticalLeadtime,
      avgCost: itemCount > 0 ? totalCost / itemCount : 0
    };
  }, [bomData]);

  // Initialize analysis data
  useEffect(() => {
    const stats = calculateStatistics();
    setAnalysisData(stats);
  }, [bomData, calculateStatistics]);

  // Toggle tree item expansion
  const toggleExpand = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Filter items based on search and status
  const filterItems = (items) => {
    return items.filter(item => {
      const matchesSearch = !searchTerm ||
        item.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  };

  // Render tree items recursively
  const renderTreeItems = (items, level = 0) => {
    const filteredItems = filterItems(items);

    return filteredItems.map(item => {
      const isExpanded = expandedItems.has(item.id);
      const hasChildren = item.children && item.children.length > 0;
      const isSelected = selectedTreeItem?.id === item.id;
      const statusColor = statusColors[item.status] || '#666';

      return (
        <div key={item.id}>
          <div
            className={`tree-item ${isSelected ? 'selected' : ''}`}
            style={{ paddingLeft: `${15 + level * 20}px` }}
            onClick={() => {
              setSelectedTreeItem(item);
              setSelectedItem(item);
            }}
          >
            <div className="tree-item-content">
              {hasChildren && (
                <span
                  className="tree-expand"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(item.id);
                  }}
                >
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
              {!hasChildren && <span className="tree-expand"></span>}
              <span className="tree-icon">{item.icon || (level === 0 ? '📦' : level === 1 ? '🔧' : '⚙️')}</span>
              <span className="tree-label">{item.partNumber}</span>
              <span
                className="tree-badge"
                style={{
                  background: statusColor,
                  color: 'white',
                  padding: '1px 4px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  marginLeft: '5px'
                }}
              >
                {item.level}
              </span>
              {item.changed && <span className="tree-badge" style={{ marginLeft: '3px', background: '#e74c3c' }}>M</span>}
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderTreeItems(item.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  // Apply eBOM changes
  const applyEBOMChanges = () => {
    setShowModal(false);
    setShowNotificationBanner(false);

    // Simulate applying changes
    const newChanges = [
      {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        user: user?.name || 'Admin',
        partNumber: 'ENG-BLOCK-SYS-001',
        field: 'leadtime',
        oldValue: '12',
        newValue: '15',
        reason: 'eBOM 동기화',
        status: 'pending'
      },
      {
        id: Date.now() + 1,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        user: user?.name || 'Admin',
        partNumber: 'CRK-SFT-001',
        field: 'cost',
        oldValue: '2500000',
        newValue: '2800000',
        reason: 'eBOM 동기화',
        status: 'pending'
      },
      {
        id: Date.now() + 2,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        user: user?.name || 'Admin',
        partNumber: 'CLUTCH-ASM-001',
        field: 'supplier',
        oldValue: '평화발레오',
        newValue: '발레오만도',
        reason: 'eBOM 동기화',
        status: 'pending'
      }
    ];

    setChangeHistory([...changeHistory, ...newChanges]);
    showSuccess('eBOM 변경사항이 적용되었습니다');
  };

  const handleSave = async () => {
    const result = await saveBOMData();
    if (result.success) {
      showSuccess('BOM 데이터가 저장되었습니다');
      setChangeHistory([]);
    } else {
      showError('저장 실패');
    }
  };

  const handleExport = () => {
    showInfo('Excel 내보내기 기능 준비중...');
  };

  const handleImport = () => {
    showInfo('데이터 가져오기 기능 준비중...');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Notification Banner */}
      {showNotificationBanner && (
        <div className="notification-banner show">
          <div className="notification-content">
            <span className="notification-icon">🔔</span>
            <span><strong>eBOM 변경 감지:</strong> ENGINE_BLOCK_v2.3에서 3개 부품이 변경되었습니다.</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="notification-btn" onClick={() => setShowModal(true)}>
              변경사항 보기
            </button>
            <button className="notification-btn" onClick={() => setShowNotificationBanner(false)}>
              나중에
            </button>
          </div>
        </div>
      )}

      {/* VS Code Title Bar */}
      <div className="vscode-titlebar">
        <div className="vscode-title">M-BOM Management System - Complete Edition</div>
        <div className="window-controls">
          <span className="control-btn minimize"></span>
          <span className="control-btn maximize"></span>
          <span className="control-btn close" onClick={logout}></span>
        </div>
      </div>

      {/* VS Code Menu Bar */}
      <div className="vscode-menubar">
        <div className="menu-item">파일</div>
        <div className="menu-item">편집</div>
        <div className="menu-item">보기</div>
        <div className="menu-item active" onClick={() => setShowChanges(!showChanges)}>
          변경사항 {changeHistory.length > 0 && `(${changeHistory.length})`}
        </div>
        <div className="menu-item" onClick={handleExport}>내보내기</div>
        <div className="menu-item" onClick={handleImport}>가져오기</div>
        <div className="menu-item">도구</div>
        <div className="menu-item">도움말</div>
      </div>

      {/* Changes Dashboard */}
      {showChanges && (
        <div className="changes-dashboard show">
          <div className="dashboard-header">
            <div className="dashboard-title">
              ⚠️ 미저장 변경사항: {changeHistory.length}개 항목
            </div>
            <div className="dashboard-actions">
              <button className="vscode-button" onClick={handleSave}>모두 저장</button>
              <button className="vscode-button secondary" onClick={() => setChangeHistory([])}>
                변경 취소
              </button>
            </div>
          </div>
          <div className="changes-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '15px' }}>
            <div className="change-card added">
              <div className="change-type" style={{ color: '#27ae60' }}>추가됨</div>
              <div className="change-count">{changeHistory.filter(c => c.type === 'added').length}</div>
            </div>
            <div className="change-card modified">
              <div className="change-type" style={{ color: '#f39c12' }}>수정됨</div>
              <div className="change-count">{changeHistory.filter(c => c.type !== 'added' && c.type !== 'deleted').length}</div>
            </div>
            <div className="change-card deleted">
              <div className="change-type" style={{ color: '#e74c3c' }}>삭제됨</div>
              <div className="change-count">{changeHistory.filter(c => c.type === 'deleted').length}</div>
            </div>
          </div>
          <div className="changes-list">
            {changeHistory.map(change => (
              <div key={change.id} className="change-item">
                <input type="checkbox" className="change-checkbox" defaultChecked />
                <span className="change-icon">✏️</span>
                <span className="change-description">
                  <span className="change-part">{change.partNumber}</span>
                  <span className="change-details">
                    {change.field}: {change.oldValue} → {change.newValue}
                  </span>
                </span>
                <span style={{ fontSize: '11px', color: '#969696', marginLeft: 'auto' }}>
                  {change.user} • {change.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="vscode-layout">
        {/* Sidebar - Tree View */}
        <div className="vscode-sidebar">
          <div className="vscode-sidebar-header">
            <div className="sidebar-title">
              📁 BOM EXPLORER
              <span className="level-indicator">{analysisData?.itemCount || 0}</span>
            </div>
          </div>

          {/* Search and Filter */}
          <div style={{ padding: '10px', borderBottom: '1px solid #3e3e42' }}>
            <input
              type="text"
              className="vscode-input"
              placeholder="🔍 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', marginBottom: '5px' }}
            />
            <select
              className="vscode-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="all">모든 상태</option>
              <option value="approved">✅ 승인</option>
              <option value="review">🔍 검토중</option>
              <option value="draft">📝 작성중</option>
              <option value="rejected">❌ 반려</option>
            </select>
          </div>

          <div className="tree-container">
            {loading ? (
              <div style={{ padding: '20px', color: '#969696' }}>로딩중...</div>
            ) : (
              renderTreeItems(bomData)
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="vscode-content">
          {/* Tabs */}
          <div className="vscode-tabs">
            <div
              className={`tab-item ${activeTab === 'structure' ? 'active' : ''}`}
              onClick={() => setActiveTab('structure')}
            >
              📊 BOM Structure
            </div>
            <div
              className={`tab-item ${activeTab === 'changes' ? 'active' : ''}`}
              onClick={() => setActiveTab('changes')}
            >
              📝 Changes ({changeHistory.length})
            </div>
            <div
              className={`tab-item ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              📈 Analysis
            </div>
            <div
              className={`tab-item ${activeTab === 'comparison' ? 'active' : ''}`}
              onClick={() => setActiveTab('comparison')}
            >
              🔍 E-BOM vs M-BOM
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'structure' && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className="ag-theme-alpine-dark" style={{ height: '100%', width: '100%' }}>
                <MoveableBOMGrid data={bomData} />
              </div>
            </div>
          )}

          {activeTab === 'changes' && (
            <div style={{ padding: '20px', overflow: 'auto' }}>
              <h2 style={{ marginBottom: '20px', color: '#cccccc' }}>변경 이력</h2>
              <table className="mbom-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>날짜/시간</th>
                    <th>사용자</th>
                    <th>품번</th>
                    <th>필드</th>
                    <th>이전값</th>
                    <th>변경값</th>
                    <th>사유</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {changeHistory.map(change => (
                    <tr key={change.id}>
                      <td>{change.date} {change.time}</td>
                      <td>{change.user}</td>
                      <td style={{ color: '#9cdcfe' }}>{change.partNumber}</td>
                      <td>{change.field}</td>
                      <td style={{ color: '#ce9178' }}>{change.oldValue}</td>
                      <td style={{ color: '#b5cea8' }}>{change.newValue}</td>
                      <td>{change.reason}</td>
                      <td>
                        <span style={{
                          background: change.status === 'approved' ? '#27ae60' : '#f39c12',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          fontSize: '11px'
                        }}>
                          {change.status === 'approved' ? '승인' : '대기'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'analysis' && analysisData && (
            <div style={{ padding: '20px', overflow: 'auto' }}>
              <h2 style={{ marginBottom: '20px', color: '#cccccc' }}>BOM 분석 대시보드</h2>

              {/* Statistics Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div className="change-card" style={{ borderLeftColor: '#007acc' }}>
                  <div className="change-type">총 부품수</div>
                  <div className="change-count">{analysisData.itemCount}</div>
                </div>
                <div className="change-card" style={{ borderLeftColor: '#27ae60' }}>
                  <div className="change-type">총 원가</div>
                  <div className="change-count">
                    {new Intl.NumberFormat('ko-KR').format(analysisData.totalCost)}원
                  </div>
                </div>
                <div className="change-card" style={{ borderLeftColor: '#f39c12' }}>
                  <div className="change-type">총 중량</div>
                  <div className="change-count">{analysisData.totalWeight.toFixed(1)} kg</div>
                </div>
                <div className="change-card" style={{ borderLeftColor: '#e74c3c' }}>
                  <div className="change-type">긴급 리드타임</div>
                  <div className="change-count">{analysisData.criticalLeadtime.length} 개</div>
                </div>
              </div>

              {/* Status Distribution */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#969696' }}>상태별 분포</h3>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  {Object.entries(analysisData.statusCount).map(([status, count]) => (
                    <div key={status} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        background: statusColors[status],
                        height: `${Math.max(30, count * 20)}px`,
                        borderRadius: '4px',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {count}
                      </div>
                      <div style={{ fontSize: '12px', color: '#969696' }}>
                        {statusLabels[status]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level Distribution */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#969696' }}>레벨별 분포</h3>
                <table className="mbom-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>레벨</th>
                      <th>부품 수</th>
                      <th>비율</th>
                      <th>그래프</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(analysisData.levelCount).map(([level, count]) => (
                      <tr key={level}>
                        <td>Level {level}</td>
                        <td>{count}</td>
                        <td>{((count / analysisData.itemCount) * 100).toFixed(1)}%</td>
                        <td>
                          <div style={{
                            background: '#007acc',
                            width: `${(count / analysisData.itemCount) * 100}%`,
                            height: '20px',
                            borderRadius: '3px',
                            minWidth: '20px'
                          }}></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Critical Leadtime Items */}
              <div>
                <h3 style={{ marginBottom: '15px', color: '#969696' }}>
                  ⚠️ 긴급 리드타임 항목 (30일 초과)
                </h3>
                <table className="mbom-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>품번</th>
                      <th>품명</th>
                      <th>리드타임</th>
                      <th>공급업체</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.criticalLeadtime.map(item => (
                      <tr key={item.id}>
                        <td style={{ color: '#9cdcfe' }}>{item.partNumber}</td>
                        <td>{item.description}</td>
                        <td style={{ color: '#e74c3c', fontWeight: 'bold' }}>{item.leadtime}일</td>
                        <td>{item.supplier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'comparison' && (
            <div style={{ padding: '20px', overflow: 'auto' }}>
              <h2 style={{ marginBottom: '20px', color: '#cccccc' }}>E-BOM vs M-BOM 비교</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h3 style={{ color: '#007acc', marginBottom: '15px' }}>E-BOM (Engineering)</h3>
                  <div style={{ background: '#252526', padding: '15px', borderRadius: '6px' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>버전:</strong> v2.3.0
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>최종 수정:</strong> 2024-03-14 14:30
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>부품 수:</strong> 156개
                    </div>
                    <div>
                      <strong>상태:</strong> <span style={{ color: '#27ae60' }}>승인됨</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ color: '#f39c12', marginBottom: '15px' }}>M-BOM (Manufacturing)</h3>
                  <div style={{ background: '#252526', padding: '15px', borderRadius: '6px' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>버전:</strong> v2.2.8
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>최종 수정:</strong> 2024-03-10 09:15
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>부품 수:</strong> 153개
                    </div>
                    <div>
                      <strong>상태:</strong> <span style={{ color: '#f39c12' }}>검토 필요</span>
                    </div>
                  </div>
                </div>
              </div>

              <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#e74c3c' }}>
                🔄 차이점 (3개 항목)
              </h3>
              <table className="mbom-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>품번</th>
                    <th>변경 유형</th>
                    <th>E-BOM</th>
                    <th>M-BOM</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ color: '#9cdcfe' }}>ENG-BLOCK-SYS-001</td>
                    <td><span style={{ color: '#f39c12' }}>수정</span></td>
                    <td>리드타임: 15일</td>
                    <td>리드타임: 12일</td>
                    <td>
                      <button className="vscode-button" style={{ padding: '2px 8px', fontSize: '12px' }}>
                        동기화
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: '#9cdcfe' }}>CRK-SFT-001</td>
                    <td><span style={{ color: '#f39c12' }}>수정</span></td>
                    <td>단가: 2,800,000원</td>
                    <td>단가: 2,500,000원</td>
                    <td>
                      <button className="vscode-button" style={{ padding: '2px 8px', fontSize: '12px' }}>
                        동기화
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: '#9cdcfe' }}>NEW-COMP-001</td>
                    <td><span style={{ color: '#27ae60' }}>추가</span></td>
                    <td>신규 부품</td>
                    <td>-</td>
                    <td>
                      <button className="vscode-button" style={{ padding: '2px 8px', fontSize: '12px' }}>
                        추가
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                <button className="vscode-button" onClick={() => setShowModal(true)}>
                  모든 변경사항 적용
                </button>
                <button className="vscode-button secondary">
                  선택 항목만 적용
                </button>
                <button className="vscode-button secondary">
                  차이점 보고서 생성
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Properties */}
        {selectedItem && (
          <div className="vscode-panel">
            <div className="panel-header">
              속성: {selectedItem.partNumber}
            </div>
            <div className="panel-content">
              <div className="property-group">
                <div className="property-group-title">기본 정보</div>
                <div className="property-item">
                  <span className="property-label">품번:</span>
                  <span className="property-value">{selectedItem.partNumber}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">품명:</span>
                  <span className="property-value">{selectedItem.description}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">레벨:</span>
                  <span className="property-value">Level {selectedItem.level}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">수량:</span>
                  <span className="property-value">{selectedItem.quantity} {selectedItem.unit}</span>
                </div>
              </div>

              <div className="property-group">
                <div className="property-group-title">생산 정보</div>
                <div className="property-item">
                  <span className="property-label">작업:</span>
                  <span className="property-value">{selectedItem.operation || '-'}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">작업장:</span>
                  <span className="property-value">{selectedItem.workcenter || '-'}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">공급업체:</span>
                  <span className="property-value">{selectedItem.supplier || '-'}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">리드타임:</span>
                  <span className="property-value" style={{
                    color: (selectedItem.leadtime || 0) > 30 ? '#e74c3c' : '#cccccc',
                    fontWeight: (selectedItem.leadtime || 0) > 30 ? 'bold' : 'normal'
                  }}>
                    {selectedItem.leadtime || 0}일
                  </span>
                </div>
              </div>

              <div className="property-group">
                <div className="property-group-title">원가 정보</div>
                <div className="property-item">
                  <span className="property-label">단가:</span>
                  <span className="property-value">
                    {new Intl.NumberFormat('ko-KR').format(selectedItem.cost || 0)}원
                  </span>
                </div>
                <div className="property-item">
                  <span className="property-label">재질:</span>
                  <span className="property-value">{selectedItem.material || '-'}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">중량:</span>
                  <span className="property-value">{(selectedItem.weight || 0).toFixed(1)} kg</span>
                </div>
              </div>

              <div className="property-group">
                <div className="property-group-title">상태</div>
                <div className="property-item">
                  <span className="property-label">상태:</span>
                  <span className="property-value" style={{
                    color: statusColors[selectedItem.status] || '#cccccc'
                  }}>
                    {selectedItem.status === 'approved' ? '✅ 승인' :
                     selectedItem.status === 'review' ? '🔍 검토중' :
                     selectedItem.status === 'draft' ? '📝 작성중' : '❌ 반려'}
                  </span>
                </div>
                <div className="property-item">
                  <span className="property-label">변경:</span>
                  <span className="property-value">
                    {selectedItem.changed ? '🔴 변경됨' : '✅ 변경없음'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="vscode-button" style={{ width: '100%' }}>
                  편집
                </button>
                <button className="vscode-button secondary" style={{ width: '100%' }}>
                  복사
                </button>
                <button className="vscode-button secondary" style={{ width: '100%' }}>
                  이력 보기
                </button>
                <button
                  className="vscode-button secondary"
                  style={{ width: '100%', background: '#e74c3c' }}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="vscode-statusbar">
        <div className="status-item">
          <span>👤 {user?.name || 'User'}</span>
        </div>
        <div className="status-item">
          <span>📊 {analysisData?.itemCount || 0} items</span>
        </div>
        <div className="status-item">
          <span>💰 {new Intl.NumberFormat('ko-KR').format(analysisData?.totalCost || 0)}원</span>
        </div>
        <div className="status-item">
          <span>⚖️ {(analysisData?.totalWeight || 0).toFixed(1)}kg</span>
        </div>
        <div className="status-item">
          <span>💾 {changeHistory.length} changes</span>
        </div>
        <div className="status-item">
          <span>🌐 UTF-8</span>
        </div>
        <div className="status-item">
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Modal for eBOM Changes */}
      {showModal && (
        <div className="modal-overlay show" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal" style={{
            background: '#2d2d30',
            borderRadius: '8px',
            width: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div className="modal-header" style={{
              padding: '20px',
              borderBottom: '1px solid #3e3e42',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div className="modal-title" style={{ fontSize: '16px', fontWeight: '600', color: '#e74c3c' }}>
                eBOM 변경사항 적용 확인
              </div>
              <div
                className="modal-close"
                onClick={() => setShowModal(false)}
                style={{ cursor: 'pointer', fontSize: '20px', color: '#cccccc' }}
              >
                ×
              </div>
            </div>

            <div className="modal-body" style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1
            }}>
              <p style={{ marginBottom: '20px', color: '#cccccc' }}>
                다음 eBOM 변경사항을 M-BOM에 적용하시겠습니까?
              </p>

              <div style={{ background: '#1e1e1e', padding: '15px', borderRadius: '6px' }}>
                <h4 style={{ marginBottom: '15px', color: '#f39c12' }}>변경 항목</h4>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <input type="checkbox" defaultChecked style={{ marginRight: '10px' }} />
                    <span style={{ color: '#9cdcfe' }}>ENG-BLOCK-SYS-001</span>
                    <span style={{ marginLeft: 'auto', color: '#969696', fontSize: '12px' }}>
                      리드타임: 12일 → 15일
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <input type="checkbox" defaultChecked style={{ marginRight: '10px' }} />
                    <span style={{ color: '#9cdcfe' }}>CRK-SFT-001</span>
                    <span style={{ marginLeft: 'auto', color: '#969696', fontSize: '12px' }}>
                      단가: 2,500,000원 → 2,800,000원
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" defaultChecked style={{ marginRight: '10px' }} />
                    <span style={{ color: '#9cdcfe' }}>CLUTCH-ASM-001</span>
                    <span style={{ marginLeft: 'auto', color: '#969696', fontSize: '12px' }}>
                      공급업체: 평화발레오 → 발레오만도
                    </span>
                  </label>
                </div>
              </div>

              <div style={{
                marginTop: '20px',
                padding: '10px',
                background: '#3c3c3c',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#f39c12'
              }}>
                ⚠️ 주의: 이 작업은 되돌릴 수 없습니다. 적용 전 백업을 권장합니다.
              </div>
            </div>

            <div className="modal-footer" style={{
              padding: '20px',
              borderTop: '1px solid #3e3e42',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                className="vscode-button secondary"
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button
                className="vscode-button"
                onClick={applyEBOMChanges}
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompleteMBOMSystem;