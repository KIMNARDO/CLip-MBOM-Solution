import React, { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Enhanced Level Indicator Component
 * 직관적이고 다이나믹한 레벨 표시 시스템
 */
const EnhancedLevelIndicator = ({
  level,
  hasChildren,
  isExpanded,
  onToggle,
  partType,
  itemCount,
  criticalPath = false,
  changeStatus = null,
  showIcon = false
}) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  // 레벨별 색상 테마 (심플하고 깔끔한 디자인)
  const levelColors = useMemo(() => {
    const colors = {
      dark: {
        0: {
          bg: 'rgba(102, 126, 234, 0.15)',
          border: '#667eea',
          text: '#667eea',
          iconBg: '#667eea',
          iconText: '#ffffff'
        },
        1: {
          bg: 'rgba(245, 87, 108, 0.15)',
          border: '#f5576c',
          text: '#f5576c',
          iconBg: '#f5576c',
          iconText: '#ffffff'
        },
        2: {
          bg: 'rgba(0, 242, 254, 0.15)',
          border: '#00f2fe',
          text: '#00f2fe',
          iconBg: '#00f2fe',
          iconText: '#1e1e1e'
        },
        3: {
          bg: 'rgba(56, 249, 215, 0.15)',
          border: '#38f9d7',
          text: '#38f9d7',
          iconBg: '#38f9d7',
          iconText: '#1e1e1e'
        },
        4: {
          bg: 'rgba(254, 225, 64, 0.15)',
          border: '#fee140',
          text: '#fee140',
          iconBg: '#fee140',
          iconText: '#1e1e1e'
        },
        default: {
          bg: 'rgba(168, 237, 234, 0.15)',
          border: '#a8edea',
          text: '#a8edea',
          iconBg: '#a8edea',
          iconText: '#1e1e1e'
        }
      },
      light: {
        0: {
          bg: 'rgba(102, 126, 234, 0.08)',
          border: '#667eea',
          text: '#667eea',
          iconBg: '#667eea',
          iconText: '#ffffff'
        },
        1: {
          bg: 'rgba(245, 87, 108, 0.08)',
          border: '#f5576c',
          text: '#f5576c',
          iconBg: '#f5576c',
          iconText: '#ffffff'
        },
        2: {
          bg: 'rgba(79, 172, 254, 0.08)',
          border: '#4facfe',
          text: '#4facfe',
          iconBg: '#4facfe',
          iconText: '#ffffff'
        },
        3: {
          bg: 'rgba(67, 233, 123, 0.08)',
          border: '#43e97b',
          text: '#43e97b',
          iconBg: '#43e97b',
          iconText: '#ffffff'
        },
        4: {
          bg: 'rgba(250, 112, 154, 0.08)',
          border: '#fa709a',
          text: '#fa709a',
          iconBg: '#fa709a',
          iconText: '#ffffff'
        },
        default: {
          bg: 'rgba(224, 224, 224, 0.3)',
          border: '#d0d0d0',
          text: '#666666',
          iconBg: '#d0d0d0',
          iconText: '#ffffff'
        }
      }
    };

    const themeColors = theme === 'dark' ? colors.dark : colors.light;
    return themeColors[level] || themeColors.default;
  }, [level, theme]);

  // 레벨 타입 아이콘
  const getLevelIcon = () => {
    switch(level) {
      case 0:
        return '🏭'; // Assembly
      case 1:
        return '🔧'; // Sub-assembly
      case 2:
        return '⚙️'; // Component
      case 3:
        return '🔩'; // Part
      default:
        return '📦'; // Material
    }
  };

  // 레벨 이름
  const getLevelName = () => {
    const names = {
      0: 'ASSY',
      1: 'SUB',
      2: 'COMP',
      3: 'PART',
      4: 'MAT'
    };
    return names[level] || `L${level}`;
  };

  // 들여쓰기 계산
  const indentWidth = level * 16;

  // 상태 인디케이터
  const getStatusIndicator = () => {
    if (criticalPath) {
      return (
        <span
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
          style={{
            background: '#ff4757',
            animation: 'pulse 2s infinite'
          }}
          title="Critical Path"
        />
      );
    }

    if (changeStatus) {
      const statusColors = {
        added: '#00d2d3',
        modified: '#feca57',
        deleted: '#ee5a6f'
      };
      return (
        <span
          className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full"
          style={{ background: statusColors[changeStatus] || '#48dbfb' }}
          title={`Status: ${changeStatus}`}
        />
      );
    }

    return null;
  };

  return (
    <div
      className="level-indicator-container flex items-center"
      style={{ paddingLeft: `${indentWidth}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 계층 연결선 */}
      {level > 0 && (
        <div
          className="hierarchy-line"
          style={{
            position: 'absolute',
            left: `${indentWidth - 16}px`,
            width: '12px',
            height: '1px',
            background: theme === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
            top: '50%',
            opacity: 0.5
          }}
        />
      )}

      {/* 펼침/접힘 버튼 */}
      {hasChildren && (
        <button
          onClick={onToggle}
          className="expand-toggle mr-1 transition-all duration-150"
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '2px',
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            cursor: 'pointer',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            color: theme === 'dark' ? '#888' : '#666'
          }}
        >
          ▶
        </button>
      )}

      {/* 메인 레벨 인디케이터 */}
      <div
        className="level-badge relative"
        style={{
          background: levelColors.bg,
          border: `1px solid ${levelColors.border}`,
          borderRadius: '6px',
          padding: '2px 8px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: isHovered ? `0 0 0 2px ${levelColors.border}33` : 'none',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          transition: 'all 0.15s ease',
          cursor: 'pointer',
          minWidth: '65px',
          position: 'relative'
        }}
      >
        {/* 레벨 번호 배지 */}
        <span
          style={{
            background: levelColors.iconBg,
            color: levelColors.iconText,
            borderRadius: '4px',
            padding: '1px 4px',
            fontSize: '11px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            minWidth: '18px',
            textAlign: 'center',
            display: 'inline-block'
          }}
        >
          {level}
        </span>

        {/* 레벨 이름 */}
        <span
          style={{
            color: levelColors.text,
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.3px'
          }}
        >
          {getLevelName()}
        </span>

        {/* 하위 아이템 개수 (호버 시 표시) */}
        {hasChildren && isHovered && itemCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: theme === 'dark' ? '#ff6b6b' : '#ff4757',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {itemCount}
          </span>
        )}

        {/* 상태 인디케이터 */}
        {getStatusIndicator()}
      </div>

      {/* 호버 시 툴팁 */}
      {isHovered && (
        <div
          className="level-tooltip"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: `${indentWidth + 40}px`,
            marginBottom: '8px',
            background: theme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
            color: theme === 'dark' ? '#fff' : '#333',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            Level {level} - {getLevelName()}
          </div>
          {hasChildren && (
            <div style={{ opacity: 0.8 }}>
              {itemCount} 하위 항목 {isExpanded ? '(펼침)' : '(접힘)'}
            </div>
          )}
          {criticalPath && (
            <div style={{ color: '#ff4757', marginTop: '4px' }}>
              ⚠ Critical Path
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(255, 71, 87, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 71, 87, 0);
          }
        }

        .level-indicator-container {
          position: relative;
        }

        .expand-toggle:hover {
          background: ${theme === 'dark' ? '#3d3d40' : '#e0e0e0'} !important;
        }

        .level-badge {
          user-select: none;
        }

        .level-badge:active {
          transform: scale(0.95) !important;
        }
      `}} />
    </div>
  );
};

export default EnhancedLevelIndicator;