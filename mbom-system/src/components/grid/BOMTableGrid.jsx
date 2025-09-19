import React, { useState, useMemo, useCallback } from 'react';
import { useBOMData } from '../../contexts/BOMDataContext';
import { useNotification } from '../../contexts/NotificationContext';

const BOMTableGrid = ({ data }) => {
  const { updateBOMItem, addBOMItem, deleteBOMItem, moveItem } = useBOMData();
  const { showSuccess, showWarning, showError, showInfo } = useNotification();
  const [draggedItem, setDraggedItem] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Convert nested data to flat structure
  const rowData = useMemo(() => {
    const result = [];
    const processItem = (item, parentPath = []) => {
      const path = [...parentPath, item.partNumber];
      result.push({
        ...item,
        path,
        // Use the level from the data if it exists, otherwise use 0
        level: item.level !== undefined ? item.level : 0,
        uniqueId: `${item.id}_${result.length}`
      });

      if (item.children && Array.isArray(item.children)) {
        item.children.forEach(child => processItem(child, path));
      }
    };

    if (data && Array.isArray(data)) {
      data.forEach(item => processItem(item, []));
    }

    console.log('BOMTableGrid - Row data:', result.length);
    return result;
  }, [data]);

  // Handle drag start
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
    showInfo(`선택: ${item.partNumber}`);
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedItem(null);
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e, targetItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    console.log(`Moving ${draggedItem.partNumber} to ${targetItem.partNumber}`);
    moveItem(draggedItem.id, targetItem.id);
    showSuccess(`${draggedItem.partNumber}을(를) ${targetItem.partNumber}(으)로 이동했습니다`);
    setDraggedItem(null);
  };

  // Handle cell edit
  const handleCellDoubleClick = (item, field) => {
    setEditingCell(`${item.uniqueId}_${field}`);
    setEditValue(item[field] || '');
  };

  const handleCellBlur = (item, field) => {
    if (editValue !== item[field]) {
      updateBOMItem(item.id, { [field]: editValue });
      showSuccess(`${field} 업데이트됨`);
    }
    setEditingCell(null);
  };

  const handleKeyPress = (e, item, field) => {
    if (e.key === 'Enter') {
      handleCellBlur(item, field);
    }
  };

  // Get level color - matching original M-BOM system
  const getLevelColor = (level) => {
    switch(level) {
      case 0: return '#4a90e2'; // Blue for top level
      case 1: return '#7cb342'; // Green for level 1
      case 2: return '#ffa726'; // Orange for level 2
      case 3: return '#ab47bc'; // Purple for level 3
      case 4: return '#ef5350'; // Red for level 4
      case 5: return '#26c6da'; // Cyan for level 5
      case 6: return '#ffee58'; // Yellow for level 6
      case 7: return '#8d6e63'; // Brown for level 7
      case 8: return '#78909c'; // Blue-gray for level 8
      case 9: return '#ec407a'; // Pink for level 9
      default: return '#bdbdbd'; // Gray for any other level
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      approved: { label: '승인', color: '#27AE60', bg: '#d5f4e6' },
      review: { label: '검토중', color: '#F39C12', bg: '#fef9e7' },
      draft: { label: '작성중', color: '#95A5A6', bg: '#ecf0f1' },
      rejected: { label: '반려', color: '#E74C3C', bg: '#fadbd8' }
    };
    const st = statusMap[status] || { label: status, color: '#666', bg: '#f5f5f5' };
    return (
      <span style={{
        background: st.bg,
        color: st.color,
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        display: 'inline-block'
      }}>
        {st.label}
      </span>
    );
  };

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '10px', padding: '10px', background: '#2d2d30', borderRadius: '4px', color: '#cccccc' }}>
        <strong>BOM 데이터 테이블</strong> - {rowData.length} 행 | 드래그로 이동 가능
      </div>

      {/* Table Container */}
      <div style={{ flex: 1, overflow: 'auto', background: '#1e1e1e', border: '1px solid #3e3e42' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cccccc', fontSize: '13px' }}>
          <thead style={{ background: '#252526', position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ padding: '8px', border: '1px solid #3e3e42', width: '40px' }}>🔄</th>
              <th style={{ padding: '8px', border: '1px solid #3e3e42', width: '60px' }}>Level</th>
              <th style={{ padding: '8px', border: '1px solid #3e3e42', width: '180px' }}>품번</th>
              <th style={{ padding: '8px', border: '1px solid #3e3e42', width: '250px' }}>품명</th>
              <th style={{ padding: '8px', border: '1px solid #3e3e42', width: '80px' }}>수량</th>
              <th style={{ padding: '8px', border: '1px solid #3e3e42', width: '60px' }}>단위</th>
              <th style={{ padding: '8px', border: '1px solid #3e3e42', width: '120px' }}>작업장</th>
              <th style={{ padding: '8px', border: '1px solid #3e3e42', width: '120px' }}>공급업체</th>
              <th style={{ padding: '8px', border: '1px solid #3e3e42', width: '60px' }}>L/T</th>
              <th style={{ padding: '8px', border: '1px solid #3e3e42', width: '90px' }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {rowData.map((item) => (
              <tr
                key={item.uniqueId}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, item)}
                style={{
                  cursor: 'move',
                  background: draggedItem?.id === item.id ? '#2196f3' : 'transparent',
                  opacity: draggedItem?.id === item.id ? 0.5 : 1
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2d2d30'}
                onMouseLeave={(e) => e.currentTarget.style.background = draggedItem?.id === item.id ? '#2196f3' : 'transparent'}
              >
                <td style={{ padding: '6px', border: '1px solid #3e3e42', textAlign: 'center' }}>
                  <span style={{ cursor: 'grab' }}>⋮⋮</span>
                </td>
                <td style={{
                  padding: '6px',
                  border: '1px solid #3e3e42',
                  textAlign: 'center',
                  background: getLevelColor(item.level),
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}>
                  {item.level}
                </td>
                <td style={{
                  padding: '6px',
                  border: '1px solid #3e3e42',
                  paddingLeft: `${15 + item.level * 20}px`
                }}>
                  {item.icon} {item.partNumber} {item.changed && '🔴'}
                </td>
                <td
                  style={{ padding: '6px', border: '1px solid #3e3e42' }}
                  onDoubleClick={() => handleCellDoubleClick(item, 'description')}
                >
                  {editingCell === `${item.uniqueId}_description` ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleCellBlur(item, 'description')}
                      onKeyPress={(e) => handleKeyPress(e, item, 'description')}
                      style={{
                        background: '#3e3e42',
                        color: '#cccccc',
                        border: '1px solid #007acc',
                        padding: '2px',
                        width: '100%'
                      }}
                      autoFocus
                    />
                  ) : (
                    item.description
                  )}
                </td>
                <td
                  style={{ padding: '6px', border: '1px solid #3e3e42', textAlign: 'right' }}
                  onDoubleClick={() => handleCellDoubleClick(item, 'quantity')}
                >
                  {editingCell === `${item.uniqueId}_quantity` ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleCellBlur(item, 'quantity')}
                      onKeyPress={(e) => handleKeyPress(e, item, 'quantity')}
                      style={{
                        background: '#3e3e42',
                        color: '#cccccc',
                        border: '1px solid #007acc',
                        padding: '2px',
                        width: '100%'
                      }}
                      autoFocus
                    />
                  ) : (
                    item.quantity
                  )}
                </td>
                <td style={{ padding: '6px', border: '1px solid #3e3e42', textAlign: 'center' }}>
                  {item.unit}
                </td>
                <td style={{ padding: '6px', border: '1px solid #3e3e42' }}>
                  {item.workcenter || '-'}
                </td>
                <td style={{ padding: '6px', border: '1px solid #3e3e42' }}>
                  {item.supplier || '-'}
                </td>
                <td style={{
                  padding: '6px',
                  border: '1px solid #3e3e42',
                  textAlign: 'center',
                  background: item.leadtime > 30 ? '#ffebee' :
                           item.leadtime > 14 ? '#fff8e1' :
                           item.leadtime > 7 ? '#e8f5e9' : 'transparent',
                  fontWeight: item.leadtime > 30 ? 'bold' : 'normal'
                }}>
                  {item.leadtime || 0}
                </td>
                <td style={{ padding: '6px', border: '1px solid #3e3e42', textAlign: 'center' }}>
                  {getStatusBadge(item.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BOMTableGrid;