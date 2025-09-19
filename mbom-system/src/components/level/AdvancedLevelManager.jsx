import React, { useState, useEffect, useCallback } from 'react';
import { useBOMData } from '../../contexts/BOMDataContext';

const AdvancedLevelManager = () => {
  const { bomData, updateBOMItem, filters, setFilters } = useBOMData();
  const [maxLevel, setMaxLevel] = useState(5);
  const [levelStats, setLevelStats] = useState({});
  const [expandedLevels, setExpandedLevels] = useState(new Set([0, 1]));

  // Calculate level statistics
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

  // Handle level expand/collapse
  const toggleLevel = useCallback((level) => {
    setExpandedLevels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(level)) {
        newSet.delete(level);
      } else {
        newSet.add(level);
      }
      return newSet;
    });
  }, []);

  // Handle level filter
  const filterByLevel = useCallback((level) => {
    setFilters(prev => ({
      ...prev,
      level: prev.level === level ? null : level
    }));
  }, [setFilters]);

  // Get level color
  const getLevelColor = (level) => {
    const colors = [
      '#4a90e2', // Level 0 - Blue
      '#7cb342', // Level 1 - Green
      '#ffa726', // Level 2 - Orange
      '#ab47bc', // Level 3 - Purple
      '#ef5350', // Level 4 - Red
      '#26c6da', // Level 5 - Cyan
      '#ffee58', // Level 6 - Yellow
      '#8d6e63', // Level 7 - Brown
      '#78909c', // Level 8 - Blue-gray
      '#ec407a'  // Level 9 - Pink
    ];
    return colors[level] || '#bdbdbd';
  };

  return (
    <div style={{
      background: '#1e1e1e',
      border: '1px solid #3e3e42',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '20px'
    }}>
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{
          color: '#cccccc',
          fontSize: '16px',
          marginBottom: '10px'
        }}>
          레벨 관리 시스템
        </h3>

        {/* Max Level Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
          <label style={{ fontSize: '13px', color: '#8b8b8b' }}>
            최대 레벨:
          </label>
          <select
            value={maxLevel}
            onChange={(e) => setMaxLevel(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              background: '#3c3c3c',
              color: '#cccccc',
              border: '1px solid #5a5a5a',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          >
            {[3,4,5,6,7,8,9].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <span style={{
            fontSize: '12px',
            color: '#8b8b8b',
            marginLeft: '10px'
          }}>
            현재 사용중: {Object.keys(levelStats).length} 레벨
          </span>
        </div>

        {/* Level Statistics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '8px',
          marginBottom: '15px'
        }}>
          {Object.keys(levelStats).sort((a, b) => Number(a) - Number(b)).map(level => {
            const levelNum = Number(level);
            const isExpanded = expandedLevels.has(levelNum);
            const isFiltered = filters.level === levelNum;

            return (
              <div
                key={level}
                style={{
                  background: isFiltered ? getLevelColor(levelNum) : '#2d2d30',
                  color: isFiltered ? '#ffffff' : '#cccccc',
                  border: `2px solid ${getLevelColor(levelNum)}`,
                  borderRadius: '6px',
                  padding: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  position: 'relative'
                }}
                onClick={() => filterByLevel(levelNum)}
                title={`Level ${level}: ${levelStats[level].count} items\nClick to filter`}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  Level {level}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>
                  {levelStats[level].count} items
                </div>

                {/* Expand/Collapse indicator */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLevel(levelNum);
                  }}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    background: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontSize: '10px',
                    padding: '2px'
                  }}
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? '−' : '+'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Level Hierarchy Visualization */}
        <div style={{
          background: '#252526',
          border: '1px solid #3e3e42',
          borderRadius: '4px',
          padding: '10px',
          fontSize: '12px',
          color: '#8b8b8b'
        }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
            계층 구조 미리보기:
          </div>
          {Object.keys(levelStats).sort((a, b) => Number(a) - Number(b)).map(level => {
            const levelNum = Number(level);
            const indent = '  '.repeat(levelNum);

            return (
              <div key={level} style={{
                marginBottom: '4px',
                display: expandedLevels.has(levelNum) ? 'block' :
                        (levelNum === 0 || expandedLevels.has(levelNum - 1)) ? 'block' : 'none'
              }}>
                <span style={{ color: getLevelColor(levelNum), fontWeight: 'bold' }}>
                  {indent}├─ Level {level}
                </span>
                <span style={{ marginLeft: '10px', opacity: 0.7 }}>
                  ({levelStats[level].count} items)
                </span>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '15px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => {
              setExpandedLevels(new Set(Object.keys(levelStats).map(Number)));
            }}
            style={{
              padding: '6px 12px',
              background: '#007acc',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            모든 레벨 확장
          </button>

          <button
            onClick={() => {
              setExpandedLevels(new Set());
            }}
            style={{
              padding: '6px 12px',
              background: '#5a5a5a',
              color: '#cccccc',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            모든 레벨 축소
          </button>

          <button
            onClick={() => {
              setFilters(prev => ({ ...prev, level: null }));
            }}
            style={{
              padding: '6px 12px',
              background: filters.level !== null ? '#f44336' : '#5a5a5a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              display: filters.level !== null ? 'block' : 'none'
            }}
          >
            필터 해제
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedLevelManager;