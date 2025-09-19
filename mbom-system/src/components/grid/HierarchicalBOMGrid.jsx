import React, { useState, useMemo, useCallback } from 'react';
import { useBOMData } from '../../contexts/BOMDataContext';
import { useNotification } from '../../contexts/NotificationContext';

const HierarchicalBOMGrid = ({ data }) => {
  const { updateBOMItem, addBOMItem, deleteBOMItem, moveItem } = useBOMData();
  const { showSuccess, showWarning, showError, showInfo } = useNotification();

  const [expandedItems, setExpandedItems] = useState(new Set([1, 2, 7, 10, 13])); // Default expanded
  const [draggedItem, setDraggedItem] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Toggle item expansion
  const toggleExpand = useCallback((itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Expand all items
  const expandAll = useCallback(() => {
    const allIds = new Set();
    const collectIds = (items) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          allIds.add(item.id);
          collectIds(item.children);
        }
      });
    };
    if (data) collectIds(data);
    setExpandedItems(allIds);
  }, [data]);

  // Collapse all items
  const collapseAll = useCallback(() => {
    setExpandedItems(new Set());
  }, []);

  // Process data for display
  const rowData = useMemo(() => {
    const result = [];

    const processItem = (item, parentExpanded = true) => {
      // Add the item itself
      result.push({
        ...item,
        visible: parentExpanded,
        hasChildren: item.children && item.children.length > 0,
        isExpanded: expandedItems.has(item.id),
        isLastChild: false // Will be updated later
      });

      // Process children if expanded
      if (item.children && item.children.length > 0) {
        const isExpanded = expandedItems.has(item.id);
        item.children.forEach((child, index) => {
          child.isLastChild = index === item.children.length - 1;
          processItem(child, parentExpanded && isExpanded);
        });
      }
    };

    if (data && Array.isArray(data)) {
      data.forEach(item => processItem(item, true));
    }

    return result.filter(item => item.visible);
  }, [data, expandedItems]);

  // Handle drag operations
  const handleDragStart = (e, item) => {
    if (item.children && item.children.length > 0) {
      e.preventDefault();
      showWarning('부모 항목은 이동할 수 없습니다');
      return;
    }
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    moveItem(draggedItem.id, targetItem.id);
    showSuccess(`${draggedItem.partNumber}을(를) 이동했습니다`);
    setDraggedItem(null);
  };

  // Handle cell editing
  const handleCellDoubleClick = (item, field) => {
    setEditingCell(`${item.id}_${field}`);
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

  // Get level color
  const getLevelColor = (level) => {
    const colors = [
      '#007ACC', // Level 0 - Blue
      '#16825D', // Level 1 - Green
      '#DB8615', // Level 2 - Orange
      '#A333C8', // Level 3 - Purple
      '#DB2828', // Level 4 - Red
      '#00B5AD', // Level 5 - Teal
      '#FBBD08', // Level 6 - Yellow
      '#A5673F', // Level 7 - Brown
      '#767676', // Level 8 - Gray
      '#E03997'  // Level 9 - Pink
    ];
    return colors[level] || '#767676';
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
        fontWeight: '600'
      }}>
        {st.label}
      </span>
    );
  };

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with controls */}
      <div style={{
        marginBottom: '10px',
        padding: '10px',
        background: '#2d2d30',
        borderRadius: '4px',
        color: '#cccccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>BOM 계층 구조 테이블</strong> - {rowData.length} 행 표시 중
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={expandAll}
            style={{
              padding: '4px 12px',
              background: '#007acc',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="모두 펼치기"
          >
            <span>⊞ 모두 펼치기</span>
          </button>
          <button
            onClick={collapseAll}
            style={{
              padding: '4px 12px',
              background: '#5a5a5a',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="모두 접기"
          >
            <span>⊟ 모두 접기</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ flex: 1, overflow: 'auto', background: '#1e1e1e', border: '1px solid #3e3e42' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cccccc', fontSize: '13px' }}>
          <thead style={{ background: '#2d2d30', position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ padding: '6px 4px', border: '1px solid #3e3e42', width: '30px', background: '#252526' }}></th>
              <th style={{ padding: '6px', border: '1px solid #3e3e42', width: '50px', textAlign: 'center', background: '#252526', color: '#cccccc', fontSize: '12px' }}>Level</th>
              <th style={{ padding: '6px', border: '1px solid #3e3e42', width: '250px', background: '#252526', color: '#cccccc', fontSize: '12px' }}>Part Number</th>
              <th style={{ padding: '6px', border: '1px solid #3e3e42', width: '300px', background: '#252526', color: '#cccccc', fontSize: '12px' }}>Part Name</th>
              <th style={{ padding: '6px', border: '1px solid #3e3e42', width: '80px', textAlign: 'right', background: '#252526', color: '#cccccc', fontSize: '12px' }}>Quantity</th>
              <th style={{ padding: '6px', border: '1px solid #3e3e42', width: '60px', textAlign: 'center', background: '#252526', color: '#cccccc', fontSize: '12px' }}>Unit</th>
              <th style={{ padding: '6px', border: '1px solid #3e3e42', width: '120px', background: '#252526', color: '#cccccc', fontSize: '12px' }}>Material</th>
              <th style={{ padding: '6px', border: '1px solid #3e3e42', width: '80px', textAlign: 'right', background: '#252526', color: '#cccccc', fontSize: '12px' }}>Weight</th>
              <th style={{ padding: '6px', border: '1px solid #3e3e42', width: '120px', background: '#252526', color: '#cccccc', fontSize: '12px' }}>Supplier</th>
              <th style={{ padding: '6px', border: '1px solid #3e3e42', width: '100px', textAlign: 'right', background: '#252526', color: '#cccccc', fontSize: '12px' }}>Cost</th>
              <th style={{ padding: '6px', border: '1px solid #3e3e42', width: '60px', textAlign: 'center', background: '#252526', color: '#cccccc', fontSize: '12px' }}>Lead Time</th>
              <th style={{ padding: '6px', border: '1px solid #3e3e42', width: '80px', textAlign: 'center', background: '#252526', color: '#cccccc', fontSize: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rowData.map((item) => {
              const indentLevel = item.level || 0;
              const isLastChild = item.isLastChild || false;
              const hasChildren = item.hasChildren;
              const isExpanded = item.isExpanded;

              return (
                <tr
                  key={item.id}
                  draggable={!hasChildren}
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, item)}
                  style={{
                    cursor: hasChildren ? 'pointer' : 'move',
                    background: draggedItem?.id === item.id ? '#2196f3' :
                               item.level === 0 ? '#252526' : 'transparent',
                    opacity: draggedItem?.id === item.id ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (draggedItem?.id !== item.id) {
                      e.currentTarget.style.background = '#2d2d30';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (draggedItem?.id !== item.id) {
                      e.currentTarget.style.background = item.level === 0 ? '#252526' : 'transparent';
                    }
                  }}
                >
                  <td style={{ padding: '4px', border: '1px solid #3e3e42', textAlign: 'center', color: '#5a5a5a', fontSize: '10px', verticalAlign: 'middle' }}>
                    {!hasChildren && <span style={{ cursor: 'grab' }}>⋮</span>}
                  </td>
                  <td style={{
                    padding: '4px',
                    border: '1px solid #3e3e42',
                    textAlign: 'center',
                    verticalAlign: 'middle'
                  }}>
                    <div style={{
                      display: 'inline-block',
                      background: getLevelColor(item.level),
                      color: '#ffffff',
                      borderRadius: '3px',
                      padding: '2px 8px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      minWidth: '20px'
                    }}>
                      {item.level}
                    </div>
                  </td>
                  <td style={{
                    padding: '6px 8px',
                    border: '1px solid #3e3e42',
                    position: 'relative'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: `${indentLevel * 20}px`
                    }}>
                      {/* Hierarchy lines for each level */}
                      {indentLevel > 0 && (
                        <>
                          {/* Vertical lines for parent levels */}
                          {[...Array(indentLevel - 1)].map((_, i) => (
                            <span
                              key={i}
                              style={{
                                position: 'absolute',
                                left: `${8 + (i * 20)}px`,
                                top: 0,
                                bottom: 0,
                                borderLeft: '1px solid #3e3e42',
                                width: '1px'
                              }}
                            />
                          ))}
                          {/* Horizontal line for current item */}
                          <span style={{
                            position: 'absolute',
                            left: `${8 + ((indentLevel - 1) * 20)}px`,
                            top: '50%',
                            width: '12px',
                            borderTop: '1px solid #3e3e42',
                            borderLeft: '1px solid #3e3e42',
                            height: '50%',
                            marginTop: '-1px'
                          }} />
                        </>
                      )}

                      {/* Expand/Collapse button */}
                      {hasChildren ? (
                        <button
                          onClick={() => toggleExpand(item.id)}
                          style={{
                            background: '#2d2d30',
                            border: '1px solid #5a5a5a',
                            borderRadius: '2px',
                            color: '#cccccc',
                            cursor: 'pointer',
                            padding: '0',
                            fontSize: '9px',
                            width: '14px',
                            height: '14px',
                            marginRight: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: '1'
                          }}
                        >
                          {isExpanded ? '−' : '+'}
                        </button>
                      ) : (
                        <span style={{ width: '18px', display: 'inline-block' }} />
                      )}

                      {/* Icon */}
                      <span style={{
                        marginRight: '4px',
                        fontSize: '14px',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}>
                        {hasChildren ? (isExpanded ? '📂' : '📁') : '📄'}
                      </span>

                      {/* Part number */}
                      <span style={{ color: '#cccccc', fontSize: '12px' }}>
                        {item.partNumber}
                      </span>

                      {/* Change indicator */}
                      {item.changed && (
                        <span style={{
                          color: '#f44336',
                          marginLeft: '8px',
                          fontSize: '10px'
                        }}>●</span>
                      )}
                    </div>
                  </td>
                  <td
                    style={{ padding: '6px', border: '1px solid #3e3e42' }}
                    onDoubleClick={() => handleCellDoubleClick(item, 'description')}
                  >
                    {editingCell === `${item.id}_description` ? (
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
                    {editingCell === `${item.id}_quantity` ? (
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
                    {item.material || 'Aluminum'}
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #3e3e42', textAlign: 'right' }}>
                    {item.weight || '0'}
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #3e3e42' }}>
                    {item.supplier || '-'}
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #3e3e42', textAlign: 'right' }}>
                    {item.cost ? item.cost.toLocaleString() : '0'}
                  </td>
                  <td style={{
                    padding: '6px',
                    border: '1px solid #3e3e42',
                    textAlign: 'center',
                    background: item.leadtime > 30 ? '#ffebee' :
                             item.leadtime > 14 ? '#fff8e1' :
                             item.leadtime > 7 ? '#e8f5e9' : 'transparent',
                    color: item.leadtime > 30 ? '#c62828' : '#cccccc',
                    fontWeight: item.leadtime > 30 ? 'bold' : 'normal'
                  }}>
                    {item.leadtime || 0}
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #3e3e42', textAlign: 'center' }}>
                    {getStatusBadge(item.status)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HierarchicalBOMGrid;