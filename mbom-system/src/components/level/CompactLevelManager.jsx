import React, { useState, useEffect } from 'react';
import { useBOMData } from '../../contexts/BOMDataContext';

const CompactLevelManager = () => {
  const { bomData, filters, setFilters } = useBOMData();
  const [levelStats, setLevelStats] = useState({});
  const [expandedView, setExpandedView] = useState(false);

  useEffect(() => {
    const stats = {};
    const calculateStats = (items) => {
      items.forEach(item => {
        const level = item.level || 0;
        if (!stats[level]) {
          stats[level] = { count: 0, items: [] };
        }
        stats[level].count++;
        stats[level].items.push(item.partNumber);

        if (item.children && item.children.length > 0) {
          calculateStats(item.children);
        }
      });
    };

    if (bomData && bomData.length > 0) {
      calculateStats(bomData);
      setLevelStats(stats);
    }
  }, [bomData]);

  const getLevelColor = (level) => {
    const colors = [
      '#4a90e2', '#7cb342', '#ffa726', '#ab47bc', '#ef5350',
      '#26c6da', '#ffee58', '#8d6e63', '#78909c', '#ec407a'
    ];
    return colors[level] || '#bdbdbd';
  };

  const filterByLevel = (level) => {
    setFilters(prev => ({
      ...prev,
      level: prev.level === level ? null : level
    }));
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid #3e3e42'
      }}>
        <h4 style={{
          color: '#cccccc',
          fontSize: '13px',
          margin: 0,
          fontWeight: 'normal'
        }}>
          레벨 관리
        </h4>
        <button
          onClick={() => setExpandedView(!expandedView)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#8b8b8b',
            cursor: 'pointer',
            fontSize: '11px',
            padding: '2px 6px'
          }}
        >
          {expandedView ? '간단히' : '자세히'}
        </button>
      </div>

      {/* Level Stats - Compact Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px',
        marginBottom: '12px'
      }}>
        {Object.keys(levelStats).sort((a, b) => Number(a) - Number(b)).map(level => {
          const levelNum = Number(level);
          const isFiltered = filters.level === levelNum;

          return (
            <div
              key={level}
              onClick={() => filterByLevel(levelNum)}
              style={{
                background: isFiltered ? getLevelColor(levelNum) : '#2d2d30',
                color: isFiltered ? '#ffffff' : '#cccccc',
                border: `1px solid ${getLevelColor(levelNum)}`,
                borderRadius: '4px',
                padding: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center',
                fontSize: '11px'
              }}
              title={`Level ${level}: ${levelStats[level].count} items\nClick to filter`}
            >
              <div style={{ fontWeight: 'bold', fontSize: '12px' }}>L{level}</div>
              <div style={{ fontSize: '10px', opacity: 0.9 }}>{levelStats[level].count}</div>
            </div>
          );
        })}
      </div>

      {/* Hierarchy Preview */}
      {expandedView && (
        <div style={{
          background: '#1e1e1e',
          border: '1px solid #3e3e42',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '11px',
          color: '#8b8b8b',
          marginBottom: '12px'
        }}>
          <div style={{ marginBottom: '6px', fontWeight: 'bold', color: '#cccccc', fontSize: '11px' }}>
            계층 구조
          </div>
          {Object.keys(levelStats).sort((a, b) => Number(a) - Number(b)).map(level => {
            const levelNum = Number(level);
            const indent = '  '.repeat(levelNum);

            return (
              <div key={level} style={{
                marginBottom: '3px',
                fontSize: '10px'
              }}>
                <span style={{ color: getLevelColor(levelNum), fontWeight: 'bold' }}>
                  {indent}├─ L{level}
                </span>
                <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                  ({levelStats[level].count})
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #3e3e42'
      }}>
        <div style={{
          background: '#2d2d30',
          padding: '6px',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '10px', color: '#8b8b8b', marginBottom: '2px' }}>
            총 레벨
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#cccccc' }}>
            {Object.keys(levelStats).length}
          </div>
        </div>
        <div style={{
          background: '#2d2d30',
          padding: '6px',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '10px', color: '#8b8b8b', marginBottom: '2px' }}>
            총 항목
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#cccccc' }}>
            {Object.values(levelStats).reduce((sum, stat) => sum + stat.count, 0)}
          </div>
        </div>
      </div>

      {/* Filter Clear Button */}
      {filters.level !== null && filters.level !== undefined && (
        <button
          onClick={() => setFilters(prev => ({ ...prev, level: null }))}
          style={{
            width: '100%',
            marginTop: '8px',
            padding: '6px',
            background: '#f44336',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          레벨 필터 해제
        </button>
      )}
    </div>
  );
};

export default CompactLevelManager;