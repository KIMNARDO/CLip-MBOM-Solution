import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useBOMData } from '../../contexts/BOMDataContext';
import { TreeGrid } from '../TreeGrid';
import { Sidebar } from '../Sidebar';
import { useBOM } from '../../contexts/BOMContext';
import UnifiedNotificationManager from '../notification/UnifiedNotificationManager';
import QuantityDifferenceAnalysis from '../comparison/QuantityDifferenceAnalysis';
import MBOMAnalyticsDashboard from './MBOMAnalyticsDashboard';
import ExcelSync from '../ExcelSync';
import DraftStatusDialog from '../dialogs/DraftStatusDialog';
import ApprovalDialog from '../dialogs/ApprovalDialog';
import { useApproval } from '../../contexts/ApprovalContext';
import { BOMRulesGuide } from '../testing/BOMRulesGuide';
import { Sun, Moon, Edit, CheckCircle, FileText, Clock } from 'lucide-react';

const CompleteMBOMDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError, showInfo, showWarning, notifications } = useNotification();

  // BOMContext에서 가져오기
  const {
    selectedId: bomSelectedId,
    itemsById,
    setSelected: setBOMSelected,
    expandedIds,
    toggleExpanded,
    expandAll,
    collapseAll
  } = useBOM();

  const {
    bomData,
    selectedItem,
    changeHistory,
    loading,
    expandedNodeIds,
    customColumns,
    gridApi,
    setSelectedItem,
    setChangeHistory,
    setGridApi,
    saveBOMData,
    loadBOMData,
    updateBOMItem,
    addBOMItem,
    deleteBOMItem,
    toggleNodeExpanded,
    addCustomColumn,
    removeCustomColumn
  } = useBOMData();

  // States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showChanges, setShowChanges] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTreeItem, setSelectedTreeItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [ebomChanges, setEbomChanges] = useState([]);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumn, setNewColumn] = useState({ headerName: '', field: '', type: 'text' });
  const [ebomData, setEbomData] = useState(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showExcelSync, setShowExcelSync] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showBOMRules, setShowBOMRules] = useState(false);

  // Approval Context
  const {
    pendingChanges,
    documentStatus,
    approvalQueue,
    showDraftStatus
  } = useApproval();

  // 초기화 시 eBOM 변경사항 시뮬레이션
  useEffect(() => {
    // EBOM 데이터 시뮬레이션 (실제로는 API에서 가져옴)
    const simulatedEBOMData = bomData.map(item => ({
      ...item,
      quantity: item.quantity + Math.floor(Math.random() * 3) - 1,
      cost: item.cost ? item.cost * (1 + (Math.random() * 0.2 - 0.1)) : null,
      leadtime: item.leadtime ? item.leadtime + Math.floor(Math.random() * 5) - 2 : null
    }));
    setEbomData(simulatedEBOMData);

    // eBOM 변경사항
    const ebomChangeList = [
      { id: 1, partNumber: 'ENG-BLOCK-SYS-001', field: 'leadtime', oldValue: '12', newValue: '15', type: 'modified' },
      { id: 2, partNumber: 'CRK-SFT-001', field: 'cost', oldValue: '2500000', newValue: '2800000', type: 'modified' },
      { id: 3, partNumber: 'NEW-COMP-001', field: 'all', oldValue: null, newValue: '신규 부품', type: 'added' }
    ];
    setEbomChanges(ebomChangeList);
  }, []);


  // Toggle tree item expansion (synchronized with grid)
  const toggleExpand = (itemId) => {
    const isExpanded = expandedNodeIds.has(itemId);
    toggleNodeExpanded(itemId, !isExpanded);
  };

  // Add root BOM item
  const handleAddRootItem = () => {
    const rootItem = {
      partNumber: `ASSY-${Date.now()}`,
      description: 'New Assembly',
      quantity: 1,
      unit: 'EA',
      level: 0,
      status: 'draft'
    };
    addBOMItem(null, rootItem);
    showSuccess('루트 BOM 항목이 추가되었습니다');
  };

  // Delete with confirmation
  const handleDeleteItem = (item) => {
    if (window.confirm(`정말로 "${item.partNumber}"를 삭제하시겠습니까?\n하위 항목도 모두 삭제됩니다.`)) {
      deleteBOMItem(item.id);
      setSelectedItem(null);
      showSuccess(`${item.partNumber}가 삭제되었습니다`);
    }
  };

  // Add custom column
  const handleAddColumn = () => {
    if (!newColumn.headerName || !newColumn.field) {
      showWarning('컬럼 이름과 필드 키를 입력하세요');
      return;
    }
    addCustomColumn(newColumn);
    setNewColumn({ headerName: '', field: '', type: 'text' });
    setShowAddColumnModal(false);
    showSuccess(`"${newColumn.headerName}" 컬럼이 추가되었습니다`);
  };

  // Filter items based on search and status - Memoized
  const filterItems = useCallback((items) => {
    return items.filter(item => {
      const matchesSearch = !searchTerm ||
        item.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, filterStatus]);

  // Render tree items recursively - Memoized
  const renderTreeItems = useCallback((items, level = 0) => {
    const filteredItems = filterItems(items);

    return filteredItems.map(item => {
      const isExpanded = expandedNodeIds.has(item.id);
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
              <span className="tree-icon">{item.icon || (level === 0 ? '📦' : level === 1 ? '🔧' : '⚙️')}</span>
              <span className="tree-label">{item.partNumber}</span>
              <span
                className="tree-badge"
                style={{
                  background: item.level === 0 ? (theme === 'dark' ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.08)') :
                             item.level === 1 ? (theme === 'dark' ? 'rgba(245, 87, 108, 0.15)' : 'rgba(245, 87, 108, 0.08)') :
                             item.level === 2 ? (theme === 'dark' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(79, 172, 254, 0.08)') :
                             item.level === 3 ? (theme === 'dark' ? 'rgba(56, 249, 215, 0.15)' : 'rgba(67, 233, 123, 0.08)') :
                             item.level === 4 ? (theme === 'dark' ? 'rgba(254, 225, 64, 0.15)' : 'rgba(250, 112, 154, 0.08)') :
                                               (theme === 'dark' ? 'rgba(168, 237, 234, 0.15)' : 'rgba(224, 224, 224, 0.3)'),
                  border: item.level === 0 ? '1px solid #667eea' :
                          item.level === 1 ? '1px solid #f5576c' :
                          item.level === 2 ? (theme === 'dark' ? '1px solid #00f2fe' : '1px solid #4facfe') :
                          item.level === 3 ? (theme === 'dark' ? '1px solid #38f9d7' : '1px solid #43e97b') :
                          item.level === 4 ? (theme === 'dark' ? '1px solid #fee140' : '1px solid #fa709a') :
                                            (theme === 'dark' ? '1px solid #a8edea' : '1px solid #d0d0d0'),
                  color: item.level === 0 ? '#667eea' :
                         item.level === 1 ? '#f5576c' :
                         item.level === 2 ? (theme === 'dark' ? '#00f2fe' : '#4facfe') :
                         item.level === 3 ? (theme === 'dark' ? '#38f9d7' : '#43e97b') :
                         item.level === 4 ? (theme === 'dark' ? '#fee140' : '#fa709a') :
                                           (theme === 'dark' ? '#a8edea' : '#666666'),
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}
              >
                L{item.level}
              </span>
              {item.changed && <span className="tree-badge" style={{ background: '#e74c3c' }}>M</span>}
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderTreeItems(item.children, level + 1)}</div>
          )}
        </div>
      );
    });
  }, [expandedNodeIds, selectedTreeItem, theme, filterItems, toggleExpand]);

  // Apply eBOM changes - Memoized
  const applyEBOMChanges = useCallback(() => {
    setShowModal(false);
    setShowNotificationBanner(false);

    // 변경사항 적용
    ebomChanges.forEach(change => {
      const newChange = {
        id: Date.now() + Math.random(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        user: user?.name || 'Admin',
        partNumber: change.partNumber,
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        reason: 'eBOM 동기화',
        status: 'pending'
      };
      setChangeHistory(prev => [...prev, newChange]);
    });

    showSuccess(`${ebomChanges.length}개 eBOM 변경사항이 적용되었습니다`);
  }, [ebomChanges, user, setChangeHistory, showSuccess]);

  // 일괄 작업 기능들 - Memoized
  const handleBulkApprove = useCallback(() => {
    const pendingItems = changeHistory.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) {
      showWarning('승인할 대기 중인 항목이 없습니다');
      return;
    }

    setChangeHistory(prev => prev.map(item =>
      item.status === 'pending' ? { ...item, status: 'approved' } : item
    ));
    showSuccess(`${pendingItems.length}개 항목이 승인되었습니다`);
  }, [changeHistory, setChangeHistory, showSuccess, showWarning]);

  const handleExportExcel = useCallback(() => {
    showInfo('Excel 내보내기 준비 중...');
    setTimeout(() => {
      const filename = `MBOM_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      showSuccess(`파일이 다운로드되었습니다: ${filename}`);
    }, 2000);
  }, [showInfo, showSuccess]);


  const handleImportData = useCallback(() => {
    showInfo('데이터 가져오기 대화상자 열기...');
  }, [showInfo]);

  const handleSave = useCallback(async () => {
    const result = await saveBOMData();
    if (result.success) {
      showSuccess('BOM 데이터가 저장되었습니다');
      setChangeHistory([]);
    } else {
      showError('저장 실패');
    }
  }, [saveBOMData, setChangeHistory, showSuccess, showError]);

  // 드롭다운 메뉴 표시
  const showDropdown = (e, menu) => {
    setActiveDropdown(menu);
  };

  // 메뉴 기능 핸들러들
  const handleNewFile = () => {
    if (confirm('새 BOM 파일을 생성하시겠습니까? 현재 작업을 저장해주세요.')) {
      // BOM 데이터 초기화
      loadBOMData();
      setChangeHistory([]);
      showSuccess('새 BOM 파일이 생성되었습니다');
    }
  };

  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.xlsx,.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        showInfo(`${file.name} 파일을 여는 중...`);

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const fileContent = event.target.result;

            if (file.name.endsWith('.json')) {
              // JSON 파일 처리
              const importedData = JSON.parse(fileContent);
              loadBOMData(importedData);
              showSuccess('JSON 파일을 성공적으로 불러왔습니다');
            } else if (file.name.endsWith('.csv')) {
              // CSV 파일 처리
              const rows = fileContent.split('\n');
              const headers = rows[0].split(',');
              const data = rows.slice(1).map(row => {
                const values = row.split(',');
                const item = {};
                headers.forEach((header, index) => {
                  item[header.trim()] = values[index]?.trim();
                });
                return item;
              });
              loadBOMData(data);
              showSuccess('CSV 파일을 성공적으로 불러왔습니다');
            } else {
              showWarning('지원하지 않는 파일 형식입니다');
            }
          } catch (error) {
            showError('파일을 읽는 중 오류가 발생했습니다: ' + error.message);
          }
        };

        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Undo/Redo를 위한 히스토리 관리
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedo, setIsUndoRedo] = useState(false);

  // BOM 데이터 변경 시 히스토리에 추가
  useEffect(() => {
    if (!isUndoRedo && bomData.length > 0) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(bomData)));

      // 히스토리 최대 20개 유지
      if (newHistory.length > 20) {
        newHistory.shift();
      }

      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    setIsUndoRedo(false);
  }, [bomData]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setIsUndoRedo(true);
      const previousState = history[historyIndex - 1];
      loadBOMData(previousState);
      setHistoryIndex(historyIndex - 1);
      showSuccess('실행 취소되었습니다');
    } else {
      showWarning('더 이상 실행 취소할 수 없습니다');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedo(true);
      const nextState = history[historyIndex + 1];
      loadBOMData(nextState);
      setHistoryIndex(historyIndex + 1);
      showSuccess('다시 실행되었습니다');
    } else {
      showWarning('더 이상 다시 실행할 수 없습니다');
    }
  };

  const handleCut = async () => {
    if (!selectedItem) {
      showWarning('잘라낼 항목을 선택해주세요');
      return;
    }

    try {
      const dataToClip = JSON.stringify(selectedItem, null, 2);
      await navigator.clipboard.writeText(dataToClip);

      // 잘라내기는 복사 후 삭제
      deleteBOMItem(selectedItem.id);
      setSelectedItem(null);
      showSuccess('항목이 잘라내기되었습니다');
    } catch (error) {
      showError('잘라내기에 실패했습니다');
    }
  };

  const handleCopy = async () => {
    if (!selectedItem) {
      showWarning('복사할 항목을 선택해주세요');
      return;
    }

    try {
      const dataToClip = JSON.stringify(selectedItem, null, 2);
      await navigator.clipboard.writeText(dataToClip);
      showSuccess('항목이 클립보드에 복사되었습니다');
    } catch (error) {
      showError('복사에 실패했습니다');
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const pastedData = JSON.parse(clipboardText);

      // 새로운 ID로 붙여넣기
      const newItem = {
        ...pastedData,
        id: Date.now(),
        partNumber: pastedData.partNumber + '-COPY',
        status: 'draft'
      };

      if (selectedItem) {
        // 선택된 항목의 하위에 추가
        addBOMItem(newItem, selectedItem.id);
      } else {
        // 루트 레벨에 추가
        addBOMItem(newItem, null);
      }

      showSuccess('항목이 붙여넣기되었습니다');
    } catch (error) {
      showWarning('클립보드에 유효한 BOM 데이터가 없습니다');
    }
  };

  const handleFind = () => {
    const searchInput = document.querySelector('.vscode-input');
    if (searchInput) {
      searchInput.focus();
    }
  };

  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [replaceValues, setReplaceValues] = useState({ find: '', replace: '' });

  const handleReplace = () => {
    setShowReplaceDialog(true);
  };

  const executeReplace = () => {
    const { find, replace } = replaceValues;
    if (!find) {
      showWarning('찾을 텍스트를 입력해주세요');
      return;
    }

    let count = 0;
    const updatedData = bomData.map(item => {
      const updateItem = (obj) => {
        let updated = false;
        Object.keys(obj).forEach(key => {
          if (typeof obj[key] === 'string' && obj[key].includes(find)) {
            obj[key] = obj[key].replace(new RegExp(find, 'g'), replace);
            updated = true;
            count++;
          }
        });
        if (obj.children && obj.children.length > 0) {
          obj.children = obj.children.map(child => updateItem(child));
        }
        return obj;
      };
      return updateItem({ ...item });
    });

    if (count > 0) {
      loadBOMData(updatedData);
      showSuccess(`${count}개 항목이 바뀌었습니다`);
      setShowReplaceDialog(false);
      setReplaceValues({ find: '', replace: '' });
    } else {
      showWarning('일치하는 텍스트를 찾을 수 없습니다');
    }
  };

  const handleToggleSidebar = () => {
    const sidebar = document.querySelector('.vscode-sidebar');
    if (sidebar) {
      sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
    }
  };

  const handleSettings = () => {
    setActiveTab('settings');
  };

  const handleAbout = () => {
    alert('M-BOM Management System\nVersion 1.0.0\n\n© 2024 FabsNet EPL System');
  };

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        switch(e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'e':
            e.preventDefault();
            handleExportExcel();
            break;
          case 'f':
            e.preventDefault();
            document.querySelector('.vscode-input')?.focus();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 자동 저장
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (changeHistory.length > 0) {
        showInfo('자동 저장 중...');
      }
    }, 60000); // 1분마다

    return () => clearInterval(autoSaveInterval);
  }, [changeHistory]);


  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Unified Notification Manager */}
      <UnifiedNotificationManager />

      {/* Excel Sync Modal */}
      {showExcelSync && (
        <ExcelSync onClose={() => setShowExcelSync(false)} />
      )}

      {/* Notification Banner */}
      {showNotificationBanner && (
        <div className="notification-banner show" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(90deg, #e74c3c, #c0392b)',
          color: 'white',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10000,
          animation: 'bannerBlink 1.2s ease-in-out 0s 7'
        }}>
          <div className="notification-content">
            <span className="notification-icon">🔔</span>
            <span><strong>eBOM 변경 감지:</strong> {ebomChanges.length}개 항목이 변경되었습니다.</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="vscode-button" onClick={() => setShowModal(true)}>
              변경사항 보기
            </button>
            <button className="vscode-button secondary" onClick={() => setShowNotificationBanner(false)}>
              나중에
            </button>
          </div>
        </div>
      )}

      {/* VS Code Title Bar */}
      <div className="vscode-titlebar">
        <div className="vscode-title">M-BOM Management System - Enterprise Edition</div>
        <div className="window-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 작성 상태 표시 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '4px',
            background: documentStatus === 'draft' ? '#f39c12' :
                       documentStatus === 'reviewing' ? '#3498db' :
                       documentStatus === 'approved' ? '#27ae60' : '#e74c3c',
            color: 'white',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {documentStatus === 'draft' ? <Edit className="w-3 h-3" /> :
             documentStatus === 'reviewing' ? <Clock className="w-3 h-3" /> :
             documentStatus === 'approved' ? <CheckCircle className="w-3 h-3" /> :
             <FileText className="w-3 h-3" />}
            <span>
              {documentStatus === 'draft' ? '작성 중' :
               documentStatus === 'reviewing' ? '검토 중' :
               documentStatus === 'approved' ? '승인됨' : '반려됨'}
            </span>
            {pendingChanges.length > 0 && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.3)',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px'
              }}>
                {pendingChanges.length}
              </span>
            )}
          </div>

          {/* 작성 관리 버튼들 */}
          <button
            onClick={() => setShowDraftDialog(true)}
            className="vscode-button"
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="작성 상태 관리"
          >
            <Edit className="w-3 h-3" />
            작성 관리
          </button>

          {/* 결재 관리 버튼 */}
          <button
            onClick={() => setShowApprovalDialog(true)}
            className="vscode-button"
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              position: 'relative'
            }}
            title="결재 승인 관리"
          >
            <FileText className="w-3 h-3" />
            결재함
            {approvalQueue.filter(r => r.status === 'pending').length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#e74c3c',
                color: 'white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {approvalQueue.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            style={{
              background: theme === 'dark' ? '#3c3c3c' : '#f3f4f6',
              border: `1px solid ${theme === 'dark' ? '#555' : '#d1d5db'}`,
              borderRadius: '4px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginRight: '10px'
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme === 'dark' ? '#4a4a4a' : '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme === 'dark' ? '#3c3c3c' : '#f3f4f6';
            }}
          >
            {theme === 'dark' ? (
              <Sun style={{ width: 16, height: 16, color: '#fbbf24' }} />
            ) : (
              <Moon style={{ width: 16, height: 16, color: '#6366f1' }} />
            )}
          </button>
          <span className="control-btn minimize"></span>
          <span className="control-btn maximize"></span>
          <span className="control-btn close" onClick={logout}></span>
        </div>
      </div>

      {/* VS Code Menu Bar */}
      <div className="vscode-menubar">
        <div className="menu-item dropdown" onMouseEnter={(e) => showDropdown(e, 'file')}>
          파일
        </div>
        <div className="menu-item dropdown" onMouseEnter={(e) => showDropdown(e, 'edit')}>
          편집
        </div>
        <div className="menu-item dropdown" onMouseEnter={(e) => showDropdown(e, 'view')}>
          보기
        </div>
        <div className="menu-item active" onClick={() => setShowChanges(!showChanges)}>
          변경사항 {changeHistory.length > 0 && `(${changeHistory.length})`}
        </div>
        <div className="menu-item" onClick={handleExportExcel}>내보내기</div>
        <div className="menu-item" onClick={handleImportData}>가져오기</div>
        <div className="menu-item dropdown" onMouseEnter={(e) => showDropdown(e, 'tools')}>
          도구
        </div>
        <div className="menu-item dropdown" onMouseEnter={(e) => showDropdown(e, 'help')}>
          도움말
        </div>
      </div>

      {/* Dropdown Menus */}
      {activeDropdown === 'file' && (
        <div className="dropdown-menu" style={{ top: '56px', left: '0' }} onMouseLeave={() => setActiveDropdown(null)}>
          <div className="menu-dropdown-item" onClick={handleNewFile}>새 파일</div>
          <div className="menu-dropdown-item" onClick={handleOpenFile}>열기...</div>
          <div className="menu-dropdown-item" onClick={handleSave}>저장</div>
          <div className="menu-dropdown-item" onClick={handleExportExcel}>다른 이름으로 저장...</div>
          <div className="dropdown-divider" />
          <div className="menu-dropdown-item" onClick={() => { setShowExcelSync(true); setActiveDropdown(null); }}>
            Excel 템플릿 동기화...
          </div>
          <div className="dropdown-divider" />
          <div className="menu-dropdown-item" onClick={logout}>종료</div>
        </div>
      )}

      {activeDropdown === 'edit' && (
        <div className="dropdown-menu" style={{ top: '56px', left: '40px' }} onMouseLeave={() => setActiveDropdown(null)}>
          <div className="menu-dropdown-item" onClick={handleUndo}>실행 취소</div>
          <div className="menu-dropdown-item" onClick={handleRedo}>다시 실행</div>
          <div className="dropdown-divider" />
          <div className="menu-dropdown-item" onClick={handleCut}>잘라내기</div>
          <div className="menu-dropdown-item" onClick={handleCopy}>복사</div>
          <div className="menu-dropdown-item" onClick={handlePaste}>붙여넣기</div>
          <div className="dropdown-divider" />
          <div className="menu-dropdown-item" onClick={handleFind}>찾기</div>
          <div className="menu-dropdown-item" onClick={handleReplace}>바꾸기</div>
        </div>
      )}

      {activeDropdown === 'view' && (
        <div className="dropdown-menu" style={{ top: '56px', left: '80px' }} onMouseLeave={() => setActiveDropdown(null)}>
          <div className="menu-dropdown-item" onClick={handleToggleSidebar}>사이드바 토글</div>
          <div className="menu-dropdown-item" onClick={() => setShowDashboard(!showDashboard)}>대시보드 토글</div>
          <div className="dropdown-divider" />
          <div className="menu-dropdown-item" onClick={() => expandAll()}>모두 펼치기</div>
          <div className="menu-dropdown-item" onClick={() => collapseAll()}>모두 접기</div>
        </div>
      )}

      {activeDropdown === 'tools' && (
        <div className="dropdown-menu" style={{ top: '56px', right: '100px' }} onMouseLeave={() => setActiveDropdown(null)}>
          <div className="menu-dropdown-item" onClick={handleSettings}>설정</div>
          <div className="menu-dropdown-item" onClick={() => setShowAddColumnModal(true)}>컬럼 관리</div>
          <div className="dropdown-divider" />
          <div className="menu-dropdown-item" onClick={() => showInfo('BOM 검증 중...')}>BOM 검증</div>
          <div className="menu-dropdown-item" onClick={() => showInfo('비용 계산 중...')}>비용 계산</div>
        </div>
      )}

      {activeDropdown === 'help' && (
        <div className="dropdown-menu" style={{ top: '56px', right: '20px' }} onMouseLeave={() => setActiveDropdown(null)}>
          <div className="menu-dropdown-item" onClick={() => window.open('https://docs.fabsnet.com', '_blank')}>온라인 도움말</div>
          <div className="menu-dropdown-item" onClick={() => showInfo('키보드 단축키 안내')}>키보드 단축키</div>
          <div className="dropdown-divider" />
          <div className="menu-dropdown-item" onClick={handleAbout}>정보</div>
        </div>
      )}


      {/* Changes Dashboard */}
      {showChanges && (
        <div className="changes-dashboard show">
          <div className="dashboard-header">
            <div className="dashboard-title">
              ⚠️ 미저장 변경사항: {changeHistory.length}개 항목
            </div>
            <div className="dashboard-actions">
              <button className="vscode-button" onClick={handleSave}>모두 저장</button>
              <button className="vscode-button" onClick={handleBulkApprove}>일괄 승인</button>
              <button className="vscode-button secondary" onClick={() => setChangeHistory([])}>
                변경 취소
              </button>
            </div>
          </div>
          <div className="changes-list" style={{ marginTop: '10px', maxHeight: '150px', overflow: 'auto' }}>
            {changeHistory.map(change => (
              <div key={change.id} className="change-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" defaultChecked />
                  <span className="change-icon">✏️</span>
                  <span className="change-part" style={{ color: '#9cdcfe' }}>{change.partNumber}</span>
                  <span className="change-details" style={{ color: theme === 'dark' ? '#969696' : '#6b7280' }}>
                    {change.field}: {change.oldValue} → {change.newValue}
                  </span>
                </div>
                <span style={{
                  background: change.status === 'approved' ? '#27ae60' : '#f39c12',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '11px'
                }}>
                  {change.status === 'approved' ? '승인' : '대기'}
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
              <span className="level-indicator">{bomData.length}</span>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="sidebar-search-container" style={{ padding: '10px' }}>
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
              <div style={{ padding: '20px', color: theme === 'dark' ? '#969696' : '#6b7280' }}>로딩중...</div>
            ) : (
              <Sidebar searchTerm={searchTerm} />
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
            <div
              className={`tab-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </div>
            <div
              className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Settings
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'structure' && (
              <div style={{ height: '100%', width: '100%', display: 'flex' }}>
                {/* BOM Table Grid */}
                <div style={{ flex: 1, marginRight: '10px', height: '100%', overflow: 'hidden' }}>
                  {/* 데이터 상태 디버깅 정보 */}
                  <div style={{
                    background: theme === 'dark' ? '#2d2d30' : '#f3f4f6',
                    padding: '10px',
                    marginBottom: '10px',
                    borderRadius: '4px',
                    color: theme === 'dark' ? '#cccccc' : '#111827',
                    fontSize: '12px'
                  }}>
                    <strong>데이터 상태:</strong> 
                    {loading ? ' 로딩 중...' : ` 로드 완료 (${bomData.length}개 항목)`}
                    {bomData.length > 0 && (
                      <div style={{ marginTop: '5px' }}>
                        첫 번째 항목: {bomData[0].partNumber} - {bomData[0].description}
                      </div>
                    )}
                  </div>

                  {/* 메인 BOM 데이터 그리드 - TreeGrid 사용 */}
                  <TreeGrid searchTerm={searchTerm} />
                </div>
              </div>
            )}

            {activeTab === 'changes' && (
              <div style={{ height: '100%', width: '100%', padding: '20px', overflow: 'auto' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ color: theme === 'dark' ? '#cccccc' : '#111827', marginBottom: '10px' }}>📝 변경 이력</h2>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button
                      className="vscode-button"
                      onClick={() => {
                        const confirmed = window.confirm(`${changeHistory.length}개의 변경사항을 저장하시겠습니까?`);
                        if (confirmed) {
                          saveBOMData();
                          setChangeHistory([]);
                          showSuccess('변경사항이 저장되었습니다');
                        }
                      }}
                    >
                      💾 모두 저장
                    </button>
                    <button
                      className="vscode-button secondary"
                      onClick={() => {
                        const confirmed = window.confirm('모든 변경사항을 취소하시겠습니까?');
                        if (confirmed) {
                          setChangeHistory([]);
                          showWarning('변경사항이 취소되었습니다');
                        }
                      }}
                    >
                      ❌ 모두 취소
                    </button>
                    <button className="vscode-button secondary">
                      📥 Export Excel
                    </button>
                  </div>
                </div>

                {/* 변경 이력 테이블 */}
                <div style={{ background: theme === 'dark' ? '#1e1e1e' : '#ffffff', borderRadius: '6px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: theme === 'dark' ? '#2d2d30' : '#f3f4f6' }}>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#cccccc' : '#111827' }}>선택</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#cccccc' : '#111827' }}>시간</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#cccccc' : '#111827' }}>품번</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#cccccc' : '#111827' }}>필드</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#cccccc' : '#111827' }}>이전 값</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#cccccc' : '#111827' }}>새 값</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#cccccc' : '#111827' }}>사용자</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#cccccc' : '#111827' }}>상태</th>
                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#cccccc' : '#111827' }}>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {changeHistory.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: theme === 'dark' ? '#969696' : '#6b7280' }}>
                            변경 이력이 없습니다
                          </td>
                        </tr>
                      ) : (
                        changeHistory.map((change, index) => (
                          <tr key={change.id || index} style={{ borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb' }}>
                            <td style={{ padding: '10px' }}>
                              <input type="checkbox" defaultChecked />
                            </td>
                            <td style={{ padding: '10px', color: theme === 'dark' ? '#cccccc' : '#111827', fontSize: '12px' }}>
                              {new Date(change.timestamp || Date.now()).toLocaleString()}
                            </td>
                            <td style={{ padding: '10px', color: '#9cdcfe' }}>
                              {change.partNumber}
                            </td>
                            <td style={{ padding: '10px', color: theme === 'dark' ? '#cccccc' : '#111827' }}>
                              {change.field}
                            </td>
                            <td style={{ padding: '10px', color: '#f48771' }}>
                              {change.oldValue}
                            </td>
                            <td style={{ padding: '10px', color: '#b5cea8' }}>
                              {change.newValue}
                            </td>
                            <td style={{ padding: '10px', color: theme === 'dark' ? '#cccccc' : '#111827' }}>
                              {change.user || user?.name || 'User'}
                            </td>
                            <td style={{ padding: '10px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                background: change.status === 'approved' ? '#27ae60' :
                                          change.status === 'pending' ? '#f39c12' : '#3498db',
                                color: 'white'
                              }}>
                                {change.status === 'approved' ? '승인' :
                                 change.status === 'pending' ? '대기' : '검토'}
                              </span>
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <button
                                className="vscode-button"
                                style={{ padding: '2px 8px', fontSize: '11px', marginRight: '5px' }}
                                onClick={() => {
                                  // 변경사항 되돌리기
                                  showInfo(`변경사항 되돌리기: ${change.partNumber}`);
                                }}
                              >
                                ↩️
                              </button>
                              <button
                                className="vscode-button secondary"
                                style={{ padding: '2px 8px', fontSize: '11px' }}
                                onClick={() => {
                                  setChangeHistory(prev => prev.filter(c => c.id !== change.id));
                                }}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* EBOM 변경사항 섹션 */}
                {ebomChanges.length > 0 && (
                  <div style={{ marginTop: '30px' }}>
                    <h3 style={{ color: theme === 'dark' ? '#cccccc' : '#111827', marginBottom: '15px' }}>⚠️ EBOM 변경사항</h3>
                    <div style={{ background: theme === 'dark' ? '#1e1e1e' : '#ffffff', borderRadius: '6px', padding: '15px' }}>
                      {ebomChanges.map((change, index) => (
                        <div key={index} style={{
                          padding: '10px',
                          marginBottom: '10px',
                          background: theme === 'dark' ? '#2d2d30' : '#f3f4f6',
                          borderLeft: `3px solid ${
                            change.type === 'added' ? '#27ae60' :
                            change.type === 'deleted' ? '#e74c3c' :
                            change.type === 'modified' ? '#f39c12' : '#3498db'
                          }`,
                          borderRadius: '4px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ color: theme === 'dark' ? '#9cdcfe' : '#2563eb', marginRight: '10px' }}>{change.partNumber}</span>
                              <span style={{ color: theme === 'dark' ? '#969696' : '#6b7280' }}>
                                {change.field}: {change.oldValue} → {change.newValue}
                              </span>
                            </div>
                            <button
                              className="vscode-button"
                              style={{ padding: '2px 10px', fontSize: '11px' }}
                              onClick={() => {
                                // EBOM 변경사항 적용
                                showSuccess('EBOM 변경사항이 적용되었습니다');
                                setEbomChanges(prev => prev.filter((_, i) => i !== index));
                              }}
                            >
                              적용
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analysis' && (
              <div style={{ height: '100%', width: '100%', display: 'flex' }}>
                <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
                  <h2 style={{ color: theme === 'dark' ? '#cccccc' : '#111827', marginBottom: '20px' }}>📈 BOM 분석 대시보드</h2>

                  {/* KPI 카드 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
                    <div style={{ background: theme === 'dark' ? '#2d2d30' : '#f3f4f6', padding: '20px', borderRadius: '6px', borderLeft: '3px solid #007acc' }}>
                      <div style={{ fontSize: '12px', color: theme === 'dark' ? '#969696' : '#6b7280', marginBottom: '5px' }}>총 부품 수</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme === 'dark' ? '#4fc3f7' : '#0ea5e9' }}>{bomData.length}</div>
                    </div>
                    <div style={{ background: theme === 'dark' ? '#2d2d30' : '#f3f4f6', padding: '20px', borderRadius: '6px', borderLeft: '3px solid #27ae60' }}>
                      <div style={{ fontSize: '12px', color: theme === 'dark' ? '#969696' : '#6b7280', marginBottom: '5px' }}>승인 완료</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                        {bomData.filter(item => item.status === 'approved').length}
                      </div>
                    </div>
                    <div style={{ background: theme === 'dark' ? '#2d2d30' : '#f3f4f6', padding: '20px', borderRadius: '6px', borderLeft: '3px solid #f39c12' }}>
                      <div style={{ fontSize: '12px', color: theme === 'dark' ? '#969696' : '#6b7280', marginBottom: '5px' }}>검토 중</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>
                        {bomData.filter(item => item.status === 'review').length}
                      </div>
                    </div>
                    <div style={{ background: theme === 'dark' ? '#2d2d30' : '#f3f4f6', padding: '20px', borderRadius: '6px', borderLeft: '3px solid #e74c3c' }}>
                      <div style={{ fontSize: '12px', color: theme === 'dark' ? '#969696' : '#6b7280', marginBottom: '5px' }}>미완성</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                        {bomData.filter(item => item.status === 'draft').length}
                      </div>
                    </div>
                  </div>

                  {/* 통계 섹션 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* 레벨별 분포 */}
                    <div style={{ background: theme === 'dark' ? '#1e1e1e' : '#ffffff', padding: '20px', borderRadius: '6px' }}>
                      <h3 style={{ color: theme === 'dark' ? '#cccccc' : '#111827', marginBottom: '15px' }}>레벨별 부품 분포</h3>
                      <div style={{ space: '10px' }}>
                        {[0, 1, 2, 3].map(level => {
                          const count = bomData.filter(item => item.level === level).length;
                          const percentage = bomData.length > 0 ? (count / bomData.length * 100).toFixed(1) : 0;
                          return (
                            <div key={level} style={{ marginBottom: '15px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span style={{ color: theme === 'dark' ? '#cccccc' : '#111827' }}>Level {level}</span>
                                <span style={{ color: theme === 'dark' ? '#969696' : '#6b7280' }}>{count}개 ({percentage}%)</span>
                              </div>
                              <div style={{ background: theme === 'dark' ? '#3c3c3c' : '#e5e7eb', height: '20px', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{
                                  background: level === 0 ? '#007acc' : level === 1 ? '#27ae60' : level === 2 ? '#f39c12' : '#e74c3c',
                                  height: '100%',
                                  width: `${percentage}%`,
                                  transition: 'width 0.3s'
                                }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 공급업체별 분포 */}
                    <div style={{ background: theme === 'dark' ? '#1e1e1e' : '#ffffff', padding: '20px', borderRadius: '6px' }}>
                      <h3 style={{ color: theme === 'dark' ? '#cccccc' : '#111827', marginBottom: '15px' }}>주요 공급업체</h3>
                      <table style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#969696' : '#6b7280' }}>공급업체</th>
                            <th style={{ textAlign: 'right', padding: '8px', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#969696' : '#6b7280' }}>부품 수</th>
                            <th style={{ textAlign: 'right', padding: '8px', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#969696' : '#6b7280' }}>비율</th>
                          </tr>
                        </thead>
                        <tbody>
                          {['현대파워텍', '현대위아', '만도', '삼성정밀'].map(supplier => {
                            const count = bomData.filter(item => item.supplier === supplier).length;
                            const percentage = bomData.length > 0 ? (count / bomData.length * 100).toFixed(1) : 0;
                            return (
                              <tr key={supplier}>
                                <td style={{ padding: '8px', color: theme === 'dark' ? '#cccccc' : '#111827' }}>{supplier}</td>
                                <td style={{ padding: '8px', textAlign: 'right', color: theme === 'dark' ? '#4fc3f7' : '#0ea5e9' }}>{count}</td>
                                <td style={{ padding: '8px', textAlign: 'right', color: theme === 'dark' ? '#969696' : '#6b7280' }}>{percentage}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 리드타임 분석 */}
                  <div style={{ background: theme === 'dark' ? '#1e1e1e' : '#ffffff', padding: '20px', borderRadius: '6px', marginTop: '20px' }}>
                    <h3 style={{ color: theme === 'dark' ? '#cccccc' : '#111827', marginBottom: '15px' }}>리드타임 경고 항목</h3>
                    <table style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#969696' : '#6b7280' }}>품번</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#969696' : '#6b7280' }}>품명</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#969696' : '#6b7280' }}>리드타임</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb', color: theme === 'dark' ? '#969696' : '#6b7280' }}>공급업체</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bomData
                          .filter(item => (item.leadtime || item.leadTime) > 30)
                          .sort((a, b) => (b.leadtime || b.leadTime || 0) - (a.leadtime || a.leadTime || 0))
                          .slice(0, 5)
                          .map(item => (
                            <tr key={item.id}>
                              <td style={{ padding: '8px', color: '#9cdcfe' }}>{item.partNumber}</td>
                              <td style={{ padding: '8px', color: theme === 'dark' ? '#cccccc' : '#111827' }}>{item.description}</td>
                              <td style={{ padding: '8px', textAlign: 'right', color: '#e74c3c', fontWeight: 'bold' }}>
                                {item.leadtime || item.leadTime}일
                              </td>
                              <td style={{ padding: '8px', color: theme === 'dark' ? '#cccccc' : '#111827' }}>{item.supplier || '-'}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'comparison' && (
              <div style={{ height: '100%', width: '100%' }}>
                <QuantityDifferenceAnalysis />
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div style={{ height: '100%', width: '100%' }}>
                <MBOMAnalyticsDashboard />
              </div>
            )}

            {activeTab === 'settings' && (
              <div style={{ height: '100%', width: '100%', display: 'flex' }}>
                <div style={{ flex: 1, padding: '20px', overflow: 'auto', color: theme === 'dark' ? '#cccccc' : '#111827' }}>
                  <h2>시스템 설정</h2>

                  <div style={{ marginTop: '20px' }}>
                    <h3>기본 설정</h3>
                    <div style={{ background: theme === 'dark' ? '#252526' : '#f9fafb', padding: '15px', borderRadius: '6px' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <label>사용자 이름</label>
                        <input
                          type="text"
                          className="vscode-input"
                          value={user?.name || ''}
                          style={{ marginLeft: '10px', width: '200px' }}
                          disabled
                        />
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <label>테마</label>
                        <select
                          className="vscode-input"
                          value={theme}
                          onChange={(e) => toggleTheme()}
                          style={{ marginLeft: '10px', width: '200px' }}
                        >
                          <option value="light">라이트 모드</option>
                          <option value="dark">다크 모드</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <label>자동 저장 간격</label>
                        <select className="vscode-input" style={{ marginLeft: '10px', width: '200px' }}>
                          <option>1분</option>
                          <option>5분</option>
                          <option>10분</option>
                          <option>수동</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <h3>알림 설정</h3>
                    <div style={{ background: theme === 'dark' ? '#252526' : '#f9fafb', padding: '15px', borderRadius: '6px' }}>
                      <label style={{ display: 'block', marginBottom: '10px' }}>
                        <input type="checkbox" defaultChecked /> eBOM 변경 알림
                      </label>
                      <label style={{ display: 'block', marginBottom: '10px' }}>
                        <input type="checkbox" defaultChecked /> 리드타임 초과 알림
                      </label>
                      <label style={{ display: 'block', marginBottom: '10px' }}>
                        <input type="checkbox" defaultChecked /> 원가 변동 알림
                      </label>
                      <label style={{ display: 'block' }}>
                        <input type="checkbox" /> 자동 저장 활성화
                      </label>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <h3>동기화 설정</h3>
                    <div style={{ background: theme === 'dark' ? '#252526' : '#f9fafb', padding: '15px', borderRadius: '6px' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <label>동기화 간격</label>
                        <select className="vscode-input" style={{ marginLeft: '10px', width: '200px' }}>
                          <option>실시간</option>
                          <option>5분</option>
                          <option>10분</option>
                          <option>30분</option>
                          <option>수동</option>
                        </select>
                      </div>
                      <button className="vscode-button">지금 동기화</button>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <h3>표시 설정</h3>
                    <div style={{ background: theme === 'dark' ? '#252526' : '#f9fafb', padding: '15px', borderRadius: '6px' }}>
                      <label style={{ display: 'block', marginBottom: '10px' }}>
                        <input type="checkbox" defaultChecked /> 트리 자동 확장
                      </label>
                      <label style={{ display: 'block', marginBottom: '10px' }}>
                        <input type="checkbox" defaultChecked /> 변경 항목 강조
                      </label>
                      <label style={{ display: 'block' }}>
                        <input type="checkbox" defaultChecked /> 툴팁 표시
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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
          <span
            className={notifications && notifications.filter(n => !n.read).length > 0 ? 'animate-strong-blink' : ''}
            style={{
              color: notifications && notifications.filter(n => !n.read).length > 0 ? '#ffcc00' : '#ffffff',
              fontWeight: notifications && notifications.filter(n => !n.read).length > 0 ? 'bold' : 'normal',
              padding: '0 4px',
              borderRadius: '3px',
              backgroundColor: notifications && notifications.filter(n => !n.read).length > 0 ? 'rgba(255, 204, 0, 0.2)' : 'transparent'
            }}
          >
            🔔 {notifications && notifications.filter(n => !n.read).length > 0 ? (
              <strong style={{ color: '#ff6b6b' }}>{notifications.filter(n => !n.read).length}</strong>
            ) : '0'} 알림
          </span>
        </div>
        <div className="status-item">
          <span>⚠️ eBOM: {ebomChanges.length} changes</span>
        </div>
        <div className="status-item">
          <span>🌐 UTF-8</span>
        </div>
        <div className="status-item">
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Modal for Add Column */}
      {showAddColumnModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <div className="modal-header">
              <div className="modal-title">
                새 컬럼 추가
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowAddColumnModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#cccccc' }}>
                  컬럼 이름
                </label>
                <input
                  type="text"
                  className="vscode-input"
                  value={newColumn.headerName}
                  onChange={(e) => setNewColumn({ ...newColumn, headerName: e.target.value })}
                  placeholder="예: 공급업체"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#cccccc' }}>
                  필드 키
                </label>
                <input
                  type="text"
                  className="vscode-input"
                  value={newColumn.field}
                  onChange={(e) => setNewColumn({ ...newColumn, field: e.target.value })}
                  placeholder="예: supplier"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#cccccc' }}>
                  데이터 타입
                </label>
                <select
                  className="vscode-input"
                  value={newColumn.type}
                  onChange={(e) => setNewColumn({ ...newColumn, type: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="text">텍스트</option>
                  <option value="number">숫자</option>
                  <option value="date">날짜</option>
                  <option value="boolean">예/아니오</option>
                </select>
              </div>
            </div>

            <div className="modal-footer" style={{
              padding: '20px',
              borderTop: theme === 'dark' ? '1px solid #3e3e42' : '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button className="vscode-button secondary" onClick={() => setShowAddColumnModal(false)}>
                취소
              </button>
              <button className="vscode-button" onClick={handleAddColumn}>
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for eBOM Changes */}
      {showModal && (
        <div className="modal-overlay show" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal" style={{
            background: theme === 'dark' ? '#2d2d30' : '#ffffff',
            borderRadius: '8px',
            width: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div className="modal-header" style={{
              padding: '20px',
              borderBottom: theme === 'dark' ? '1px solid #3e3e42' : '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <div className="modal-title" style={{ fontSize: '16px', fontWeight: '600', color: theme === 'dark' ? '#e74c3c' : '#dc2626' }}>
                eBOM 변경사항 적용 확인
              </div>
              <div
                className="modal-close"
                onClick={() => setShowModal(false)}
                style={{ cursor: 'pointer', fontSize: '20px', color: theme === 'dark' ? '#cccccc' : '#111827' }}
              >
                ×
              </div>
            </div>

            <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <p style={{ marginBottom: '20px', color: theme === 'dark' ? '#cccccc' : '#111827' }}>
                다음 eBOM 변경사항을 M-BOM에 적용하시겠습니까?
              </p>

              <div style={{ background: theme === 'dark' ? '#1e1e1e' : '#ffffff', padding: '15px', borderRadius: '6px' }}>
                <h4 style={{ marginBottom: '15px', color: theme === 'dark' ? '#f39c12' : '#f59e0b' }}>변경 항목</h4>
                {ebomChanges.map((change, index) => (
                  <label key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <input type="checkbox" defaultChecked style={{ marginRight: '10px' }} />
                    <span style={{ color: theme === 'dark' ? '#9cdcfe' : '#2563eb' }}>{change.partNumber}</span>
                    <span style={{ marginLeft: 'auto', color: theme === 'dark' ? '#969696' : '#6b7280', fontSize: '12px' }}>
                      {change.field}: {change.oldValue} → {change.newValue}
                    </span>
                  </label>
                ))}
              </div>

              <div style={{
                marginTop: '20px',
                padding: '10px',
                background: theme === 'dark' ? '#3c3c3c' : '#e5e7eb',
                borderRadius: '4px',
                fontSize: '12px',
                color: theme === 'dark' ? '#f39c12' : '#f59e0b'
              }}>
                ⚠️ 주의: 이 작업은 되돌릴 수 없습니다. 적용 전 백업을 권장합니다.
              </div>
            </div>

            <div className="modal-footer" style={{
              padding: '20px',
              borderTop: theme === 'dark' ? '1px solid #3e3e42' : '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button className="vscode-button secondary" onClick={() => setShowModal(false)}>
                취소
              </button>
              <button className="vscode-button" onClick={applyEBOMChanges}>
                적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 작성 상태 관리 다이얼로그 */}
      <DraftStatusDialog
        isOpen={showDraftDialog}
        onClose={() => setShowDraftDialog(false)}
      />

      {/* 결재 승인 관리 다이얼로그 */}
      <ApprovalDialog
        isOpen={showApprovalDialog}
        onClose={() => setShowApprovalDialog(false)}
      />

      {/* Replace 다이얼로그 */}
      {showReplaceDialog && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal" style={{
            background: theme === 'dark' ? '#2d2d30' : '#ffffff',
            borderRadius: '8px',
            width: '500px',
            padding: '20px'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: theme === 'dark' ? '#cccccc' : '#111827' }}>찾기 및 바꾸기</h3>
              <button
                onClick={() => setShowReplaceDialog(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: theme === 'dark' ? '#cccccc' : '#111827' }}>
                  찾을 텍스트:
                </label>
                <input
                  type="text"
                  className="vscode-input"
                  value={replaceValues.find}
                  onChange={(e) => setReplaceValues({ ...replaceValues, find: e.target.value })}
                  style={{ width: '100%' }}
                  placeholder="검색할 텍스트를 입력하세요"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: theme === 'dark' ? '#cccccc' : '#111827' }}>
                  바꿀 텍스트:
                </label>
                <input
                  type="text"
                  className="vscode-input"
                  value={replaceValues.replace}
                  onChange={(e) => setReplaceValues({ ...replaceValues, replace: e.target.value })}
                  style={{ width: '100%' }}
                  placeholder="대체할 텍스트를 입력하세요"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  className="vscode-button secondary"
                  onClick={() => setShowReplaceDialog(false)}
                >
                  취소
                </button>
                <button
                  className="vscode-button"
                  onClick={executeReplace}
                >
                  모두 바꾸기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Panels - Development Mode Only */}
      {process.env.NODE_ENV === 'development' && (
        <>
          {showBOMRules && <BOMRulesGuide onClose={() => setShowBOMRules(false)} />}
        </>
      )}

      {/* Test Toggle Buttons - Development Mode Only */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 flex flex-col gap-2">
          <button
            onClick={() => setShowBOMRules(!showBOMRules)}
            className="p-2 bg-orange-500 text-white rounded-lg shadow-lg hover:bg-orange-600 transition-colors text-sm"
            title="BOM 이동 규칙 가이드"
          >
            {showBOMRules ? '✓' : ''} BOM 규칙
          </button>
        </div>
      )}
    </div>
  );
};

export default CompleteMBOMDashboard;