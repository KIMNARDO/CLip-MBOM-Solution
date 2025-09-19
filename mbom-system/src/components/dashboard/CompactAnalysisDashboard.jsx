import React, { useState, useMemo } from 'react';
import { useBOMData } from '../../contexts/BOMDataContext';

const CompactAnalysisDashboard = () => {
  const { bomData } = useBOMData();
  const [selectedMetric, setSelectedMetric] = useState('status');

  const statistics = useMemo(() => {
    const stats = {
      totalItems: 0,
      totalCost: 0,
      byStatus: {},
      byLevel: {},
      criticalItems: []
    };

    const processItem = (item) => {
      stats.totalItems++;
      stats.totalCost += item.cost || 0;

      const status = item.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      const level = item.level || 0;
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;

      if (item.changed || item.status === 'review') {
        stats.criticalItems.push({
          partNumber: item.partNumber,
          status: item.status
        });
      }

      if (item.children && item.children.length > 0) {
        item.children.forEach(processItem);
      }
    };

    if (bomData && bomData.length > 0) {
      bomData.forEach(processItem);
    }

    return stats;
  }, [bomData]);

  const getStatusColor = (status) => {
    const colors = {
      approved: '#4caf50',
      review: '#ff9800',
      draft: '#9e9e9e',
      rejected: '#f44336',
      pending: '#2196f3'
    };
    return colors[status] || '#757575';
  };

  const getLevelColor = (level) => {
    const colors = [
      '#4a90e2', '#7cb342', '#ffa726', '#ab47bc', '#ef5350',
      '#26c6da', '#ffee58', '#8d6e63', '#78909c', '#ec407a'
    ];
    return colors[level] || '#bdbdbd';
  };

  const getChartData = () => {
    switch (selectedMetric) {
      case 'status':
        return Object.entries(statistics.byStatus).map(([status, count]) => ({
          label: status,
          value: count,
          color: getStatusColor(status)
        }));
      case 'level':
        return Object.entries(statistics.byLevel).map(([level, count]) => ({
          label: `Level ${level}`,
          value: count,
          color: getLevelColor(Number(level))
        }));
      default:
        return [];
    }
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData.map(d => d.value), 1);

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
          BOM 분석
        </h4>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '6px',
        marginBottom: '12px'
      }}>
        <div style={{
          background: '#2d2d30',
          padding: '8px',
          borderRadius: '4px',
          borderLeft: '2px solid #2196f3',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '10px',
            color: '#8b8b8b',
            marginBottom: '2px'
          }}>
            총 부품
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#cccccc'
          }}>
            {statistics.totalItems}
          </div>
        </div>

        <div style={{
          background: '#2d2d30',
          padding: '8px',
          borderRadius: '4px',
          borderLeft: '2px solid #4caf50',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '10px',
            color: '#8b8b8b',
            marginBottom: '2px'
          }}>
            총 비용
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#cccccc'
          }}>
            {(statistics.totalCost / 1000000).toFixed(1)}M
          </div>
        </div>
      </div>

      {/* Chart Selector */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '8px'
      }}>
        <button
          onClick={() => setSelectedMetric('status')}
          style={{
            flex: 1,
            padding: '4px',
            background: selectedMetric === 'status' ? '#007acc' : '#5a5a5a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          상태별
        </button>
        <button
          onClick={() => setSelectedMetric('level')}
          style={{
            flex: 1,
            padding: '4px',
            background: selectedMetric === 'level' ? '#007acc' : '#5a5a5a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          레벨별
        </button>
      </div>

      {/* Compact Bar Chart */}
      <div style={{
        background: '#1e1e1e',
        border: '1px solid #3e3e42',
        borderRadius: '4px',
        padding: '8px',
        marginBottom: '12px'
      }}>
        {chartData.slice(0, 5).map((item, index) => (
          <div key={index} style={{ marginBottom: '6px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '2px',
              fontSize: '10px'
            }}>
              <span style={{ color: '#cccccc' }}>
                {item.label}
              </span>
              <span style={{ color: '#8b8b8b' }}>
                {item.value}
              </span>
            </div>
            <div style={{
              background: '#2d2d30',
              borderRadius: '2px',
              height: '12px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                background: item.color,
                height: '100%',
                width: `${(item.value / maxValue) * 100}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Critical Items */}
      {statistics.criticalItems.length > 0 && (
        <div style={{
          background: '#1e1e1e',
          border: '1px solid #ff9800',
          borderRadius: '4px',
          padding: '8px'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#ff9800',
            marginBottom: '6px',
            fontWeight: 'bold'
          }}>
            ⚠️ 주의 필요 ({statistics.criticalItems.length})
          </div>
          {statistics.criticalItems.slice(0, 3).map((item, index) => (
            <div key={index} style={{
              fontSize: '10px',
              color: '#cccccc',
              padding: '3px 0',
              borderBottom: index < 2 ? '1px solid #3e3e42' : 'none'
            }}>
              {item.partNumber}
            </div>
          ))}
          {statistics.criticalItems.length > 3 && (
            <div style={{
              fontSize: '10px',
              color: '#8b8b8b',
              padding: '3px 0',
              textAlign: 'center'
            }}>
              +{statistics.criticalItems.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompactAnalysisDashboard;