import React, { useState, useEffect, useMemo } from 'react';
import { useBOMData } from '../../contexts/BOMDataContext';

const AnalysisDashboard = () => {
  const { bomData, changeHistory } = useBOMData();
  const [selectedMetric, setSelectedMetric] = useState('status');
  const [showDetails, setShowDetails] = useState(false);

  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = {
      totalItems: 0,
      totalCost: 0,
      totalWeight: 0,
      byStatus: {},
      byLevel: {},
      bySupplier: {},
      criticalItems: [],
      recentChanges: [],
      leadTimeAnalysis: {
        max: 0,
        min: Infinity,
        avg: 0,
        critical: []
      }
    };

    const processItem = (item) => {
      stats.totalItems++;
      stats.totalCost += item.cost || 0;
      stats.totalWeight += item.weight || 0;

      // By Status
      const status = item.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // By Level
      const level = item.level || 0;
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;

      // By Supplier
      if (item.supplier && item.supplier !== '-') {
        stats.bySupplier[item.supplier] = (stats.bySupplier[item.supplier] || 0) + 1;
      }

      // Lead Time Analysis
      if (item.leadtime) {
        stats.leadTimeAnalysis.max = Math.max(stats.leadTimeAnalysis.max, item.leadtime);
        stats.leadTimeAnalysis.min = Math.min(stats.leadTimeAnalysis.min, item.leadtime);

        if (item.leadtime > 30) {
          stats.leadTimeAnalysis.critical.push({
            partNumber: item.partNumber,
            description: item.description,
            leadtime: item.leadtime,
            supplier: item.supplier
          });
        }
      }

      // Critical Items (changed or review status)
      if (item.changed || item.status === 'review') {
        stats.criticalItems.push({
          partNumber: item.partNumber,
          description: item.description,
          status: item.status,
          changed: item.changed
        });
      }

      // Process children
      if (item.children && item.children.length > 0) {
        item.children.forEach(processItem);
      }
    };

    if (bomData && bomData.length > 0) {
      bomData.forEach(processItem);

      // Calculate average lead time
      const itemsWithLeadTime = stats.totalItems - Object.keys(stats.byLevel)[0];
      if (itemsWithLeadTime > 0) {
        stats.leadTimeAnalysis.avg = Math.round(
          (stats.leadTimeAnalysis.max + stats.leadTimeAnalysis.min) / 2
        );
      }
    }

    // Add recent changes
    if (changeHistory) {
      stats.recentChanges = changeHistory.slice(0, 5);
    }

    return stats;
  }, [bomData, changeHistory]);

  // Chart data preparation
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
      case 'supplier':
        return Object.entries(statistics.bySupplier).map(([supplier, count]) => ({
          label: supplier,
          value: count,
          color: getRandomColor(supplier)
        }));
      default:
        return [];
    }
  };

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

  const getRandomColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div style={{
      background: '#1e1e1e',
      border: '1px solid #3e3e42',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{
          color: '#cccccc',
          fontSize: '18px',
          margin: 0
        }}>
          📊 BOM 분석 대시보드
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
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
          {showDetails ? '간단히' : '자세히'}
        </button>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: '#2d2d30',
          padding: '15px',
          borderRadius: '6px',
          borderLeft: '3px solid #2196f3'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#8b8b8b',
            marginBottom: '5px'
          }}>
            총 부품 수
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#cccccc'
          }}>
            {statistics.totalItems}
          </div>
        </div>

        <div style={{
          background: '#2d2d30',
          padding: '15px',
          borderRadius: '6px',
          borderLeft: '3px solid #4caf50'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#8b8b8b',
            marginBottom: '5px'
          }}>
            총 비용
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#cccccc'
          }}>
            ₩{(statistics.totalCost / 1000000).toFixed(1)}M
          </div>
        </div>

        <div style={{
          background: '#2d2d30',
          padding: '15px',
          borderRadius: '6px',
          borderLeft: '3px solid #ff9800'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#8b8b8b',
            marginBottom: '5px'
          }}>
            총 중량
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#cccccc'
          }}>
            {statistics.totalWeight.toFixed(1)}kg
          </div>
        </div>

        <div style={{
          background: '#2d2d30',
          padding: '15px',
          borderRadius: '6px',
          borderLeft: '3px solid #f44336'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#8b8b8b',
            marginBottom: '5px'
          }}>
            평균 리드타임
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#cccccc'
          }}>
            {statistics.leadTimeAnalysis.avg}일
          </div>
        </div>
      </div>

      {/* Chart Selector */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '10px'
        }}>
          <button
            onClick={() => setSelectedMetric('status')}
            style={{
              padding: '8px 16px',
              background: selectedMetric === 'status' ?
                '#007acc' :
                '#5a5a5a',
              color: selectedMetric === 'status' ?
                '#ffffff' :
                '#cccccc',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            상태별
          </button>
          <button
            onClick={() => setSelectedMetric('level')}
            style={{
              padding: '8px 16px',
              background: selectedMetric === 'level' ?
                '#007acc' :
                '#5a5a5a',
              color: selectedMetric === 'level' ?
                '#ffffff' :
                '#cccccc',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            레벨별
          </button>
          <button
            onClick={() => setSelectedMetric('supplier')}
            style={{
              padding: '8px 16px',
              background: selectedMetric === 'supplier' ?
                '#007acc' :
                '#5a5a5a',
              color: selectedMetric === 'supplier' ?
                '#ffffff' :
                '#cccccc',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            공급업체별
          </button>
        </div>

        {/* Bar Chart */}
        <div style={{
          background: '#252526',
          border: '1px solid #3e3e42',
          borderRadius: '6px',
          padding: '15px',
          minHeight: '200px'
        }}>
          {chartData.map((item, index) => (
            <div key={index} style={{ marginBottom: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontSize: '12px'
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
                borderRadius: '3px',
                height: '20px',
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
      </div>

      {/* Details Section */}
      {showDetails && (
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #3e3e42'
        }}>
          {/* Critical Items */}
          {statistics.criticalItems.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{
                color: '#cccccc',
                fontSize: '14px',
                marginBottom: '10px'
              }}>
                ⚠️ 주의 필요 항목
              </h4>
              <div style={{
                background: '#252526',
                border: '1px solid #3e3e42',
                borderRadius: '6px',
                padding: '10px'
              }}>
                {statistics.criticalItems.slice(0, 5).map((item, index) => (
                  <div key={index} style={{
                    padding: '8px',
                    borderBottom: index < 4 ? '1px solid #3e3e42' : 'none',
                    fontSize: '12px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#ff9800' }}>
                      {item.partNumber}
                    </span>
                    <span style={{ marginLeft: '10px', color: '#8b8b8b' }}>
                      {item.description}
                    </span>
                    {item.changed && (
                      <span style={{
                        marginLeft: '10px',
                        background: '#f44336',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px'
                      }}>
                        변경됨
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lead Time Critical */}
          {statistics.leadTimeAnalysis.critical.length > 0 && (
            <div>
              <h4 style={{
                color: '#cccccc',
                fontSize: '14px',
                marginBottom: '10px'
              }}>
                ⏰ 장기 리드타임 항목
              </h4>
              <div style={{
                background: '#252526',
                border: '1px solid #3e3e42',
                borderRadius: '6px',
                padding: '10px'
              }}>
                {statistics.leadTimeAnalysis.critical.slice(0, 5).map((item, index) => (
                  <div key={index} style={{
                    padding: '8px',
                    borderBottom: index < 4 ? '1px solid #3e3e42' : 'none',
                    fontSize: '12px'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>
                      {item.partNumber}
                    </span>
                    <span style={{
                      marginLeft: '10px',
                      background: '#f44336',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '10px'
                    }}>
                      {item.leadtime}일
                    </span>
                    <span style={{ marginLeft: '10px', color: '#8b8b8b' }}>
                      {item.supplier}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;