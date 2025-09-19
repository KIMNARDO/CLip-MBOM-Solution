import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useBOMData } from '../../contexts/BOMDataContext';
import MoveableBOMGrid from '../grid/MoveableBOMGrid';

const VSCodeMBOMDashboard = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const {
    bomData,
    selectedItem,
    changeHistory,
    loading,
    setSelectedItem,
    saveBOMData,
    loadBOMData
  } = useBOMData();

  const [activeTab, setActiveTab] = useState('structure');
  const [showChanges, setShowChanges] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set([1]));
  const [selectedTreeItem, setSelectedTreeItem] = useState(null);

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

  // Render tree items recursively
  const renderTreeItems = (items, level = 0) => {
    return items.map(item => {
      const isExpanded = expandedItems.has(item.id);
      const hasChildren = item.children && item.children.length > 0;
      const isSelected = selectedTreeItem?.id === item.id;

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
              <span className="tree-icon">{item.icon || '📄'}</span>
              <span className="tree-label">{item.partNumber}</span>
              {item.changed && <span className="tree-badge">M</span>}
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderTreeItems(item.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  const handleSave = async () => {
    const result = await saveBOMData();
    if (result.success) {
      showSuccess('BOM 데이터가 저장되었습니다');
    } else {
      showError('저장 실패');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* VS Code Title Bar */}
      <div className="vscode-titlebar">
        <div className="vscode-title">M-BOM Management System - VS Code Edition</div>
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
              <button className="vscode-button secondary">변경 취소</button>
            </div>
          </div>
          <div className="changes-list">
            {changeHistory.map(change => (
              <div key={change.id} className="change-item">
                <input type="checkbox" className="change-checkbox" />
                <span className="change-icon">✏️</span>
                <span className="change-description">
                  <span className="change-part">{change.partNumber}</span>
                  <span className="change-details">
                    {change.field}: {change.oldValue} → {change.newValue}
                  </span>
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
              <span className="level-indicator">15</span>
            </div>
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
          </div>

          {/* Grid Area */}
          <div style={{ flex: 1, overflow: 'hidden', padding: '10px' }}>
            {activeTab === 'structure' && (
              <div className="ag-theme-alpine-dark" style={{ height: 'calc(100% - 20px)', width: '100%' }}>
                <MoveableBOMGrid data={bomData} />
              </div>
            )}
            {activeTab === 'changes' && (
              <div style={{ padding: '20px', overflow: 'auto', height: '100%' }}>
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
                    {changeHistory.map((change, index) => (
                      <tr key={change.id || index}>
                        <td>{change.date} {change.time}</td>
                        <td>{change.user}</td>
                        <td style={{ color: '#9cdcfe' }}>{change.partNumber}</td>
                        <td>{change.field}</td>
                        <td style={{ color: '#ce9178' }}>{change.oldValue}</td>
                        <td style={{ color: '#b5cea8' }}>{change.newValue}</td>
                        <td>{change.reason || '수동 편집'}</td>
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
            {activeTab === 'analysis' && (
              <div style={{ padding: '20px', overflow: 'auto', height: '100%' }}>
                <h2 style={{ marginBottom: '20px', color: '#cccccc' }}>BOM 분석 대시보드</h2>

                {/* Statistics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                  <div className="change-card" style={{ borderLeftColor: '#007acc' }}>
                    <div className="change-type">총 부품수</div>
                    <div className="change-count">{bomData.length}</div>
                  </div>
                  <div className="change-card" style={{ borderLeftColor: '#27ae60' }}>
                    <div className="change-type">승인됨</div>
                    <div className="change-count">{bomData.filter(item => item.status === 'approved').length}</div>
                  </div>
                  <div className="change-card" style={{ borderLeftColor: '#f39c12' }}>
                    <div className="change-type">검토중</div>
                    <div className="change-count">{bomData.filter(item => item.status === 'review').length}</div>
                  </div>
                  <div className="change-card" style={{ borderLeftColor: '#e74c3c' }}>
                    <div className="change-type">변경됨</div>
                    <div className="change-count">{bomData.filter(item => item.changed).length}</div>
                  </div>
                </div>

                {/* Cost Analysis */}
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ marginBottom: '15px', color: '#969696' }}>원가 분석</h3>
                  <table className="mbom-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>레벨</th>
                        <th>부품 수</th>
                        <th>총 원가</th>
                        <th>평균 원가</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[0, 1, 2].map(level => {
                        const levelItems = bomData.filter(item => item.level === level);
                        const totalCost = levelItems.reduce((sum, item) => sum + (item.cost || 0), 0);
                        const avgCost = levelItems.length > 0 ? totalCost / levelItems.length : 0;
                        return (
                          <tr key={level}>
                            <td>Level {level}</td>
                            <td>{levelItems.length}</td>
                            <td>{new Intl.NumberFormat('ko-KR').format(totalCost)}원</td>
                            <td>{new Intl.NumberFormat('ko-KR').format(avgCost)}원</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
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
                  <span className="property-label">작업장:</span>
                  <span className="property-value">{selectedItem.workcenter || '-'}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">공급업체:</span>
                  <span className="property-value">{selectedItem.supplier || '-'}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">리드타임:</span>
                  <span className="property-value">{selectedItem.leadtime || 0}일</span>
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
                  <span className="property-label">중량:</span>
                  <span className="property-value">{selectedItem.weight || 0} kg</span>
                </div>
              </div>

              <div className="property-group">
                <div className="property-group-title">상태</div>
                <div className="property-item">
                  <span className="property-label">상태:</span>
                  <span className="property-value">
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
          <span>📊 {bomData.length} items</span>
        </div>
        <div className="status-item">
          <span>💾 {changeHistory.length} changes</span>
        </div>
        <div className="status-item">
          <span>🌐 UTF-8</span>
        </div>
        <div className="status-item">
          <span>Ln 1, Col 1</span>
        </div>
      </div>
    </div>
  );
};

export default VSCodeMBOMDashboard;