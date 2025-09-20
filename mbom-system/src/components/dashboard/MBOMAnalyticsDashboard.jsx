import React, { useState, useEffect, useMemo } from 'react';
import { useBOMData } from '../../contexts/BOMDataContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, ComposedChart
} from 'recharts';

const MBOMAnalyticsDashboard = () => {
  const { bomData, changeHistory } = useBOMData();
  const { showInfo } = useNotification();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeMetric, setActiveMetric] = useState('overview');
  const [dateRange, setDateRange] = useState('month'); // day, week, month, quarter, year
  const [refreshInterval, setRefreshInterval] = useState(60000); // 1분

  // 색상 팔레트 - 테마별로 다르게 적용
  const COLORS = isDark ? {
    primary: '#007acc',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',
    info: '#3498db',
    purple: '#9b59b6',
    dark: '#2c3e50',
    light: '#ecf0f1',
    text: '#cccccc',
    grid: '#3e3e42'
  } : {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    purple: '#8b5cf6',
    dark: '#1f2937',
    light: '#f3f4f6',
    text: '#374151',
    grid: '#e5e7eb'
  };

  const CHART_COLORS = [
    COLORS.primary, COLORS.success, COLORS.warning,
    COLORS.danger, COLORS.info, COLORS.purple
  ];

  // 자동 새로고침
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        showInfo('대시보드 데이터를 새로고침했습니다');
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // 주요 메트릭 계산
  const metrics = useMemo(() => {
    if (!bomData || bomData.length === 0) {
      return {
        totalParts: 0,
        totalAssemblies: 0,
        averageLeadTime: 0,
        totalCost: 0,
        criticalParts: 0,
        supplierCount: 0,
        changeRate: 0,
        completionRate: 0
      };
    }

    const flattenBOM = (items) => {
      let flat = [];
      items.forEach(item => {
        flat.push(item);
        if (item.children) {
          flat = flat.concat(flattenBOM(item.children));
        }
      });
      return flat;
    };

    const allParts = flattenBOM(bomData);
    const suppliers = new Set(allParts.map(p => p.supplier).filter(s => s));

    return {
      totalParts: allParts.length,
      totalAssemblies: allParts.filter(p => p.level === 0).length,
      averageLeadTime: Math.round(
        allParts.reduce((sum, p) => sum + (p.leadtime || 0), 0) / allParts.length
      ),
      totalCost: allParts.reduce((sum, p) => sum + ((p.cost || 0) * (p.quantity || 0)), 0),
      criticalParts: allParts.filter(p => (p.leadtime || 0) > 30).length,
      supplierCount: suppliers.size,
      changeRate: ((changeHistory?.length || 0) / allParts.length * 100).toFixed(1),
      completionRate: (
        allParts.filter(p => p.status === 'approved').length / allParts.length * 100
      ).toFixed(1)
    };
  }, [bomData, changeHistory]);

  // 레벨별 분포 데이터
  const levelDistribution = useMemo(() => {
    if (!bomData || bomData.length === 0) return [];

    const distribution = {};
    const flattenBOM = (items) => {
      items.forEach(item => {
        const level = `Level ${item.level}`;
        distribution[level] = (distribution[level] || 0) + 1;
        if (item.children) {
          flattenBOM(item.children);
        }
      });
    };

    flattenBOM(bomData);
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [bomData]);

  // 상태별 분포 데이터
  const statusDistribution = useMemo(() => {
    if (!bomData || bomData.length === 0) return [];

    const distribution = {
      approved: 0,
      review: 0,
      draft: 0,
      rejected: 0
    };

    const countStatus = (items) => {
      items.forEach(item => {
        distribution[item.status] = (distribution[item.status] || 0) + 1;
        if (item.children) {
          countStatus(item.children);
        }
      });
    };

    countStatus(bomData);

    return [
      { name: '승인됨', value: distribution.approved, fill: COLORS.success },
      { name: '검토중', value: distribution.review, fill: COLORS.warning },
      { name: '작성중', value: distribution.draft, fill: COLORS.info },
      { name: '반려됨', value: distribution.rejected, fill: COLORS.danger }
    ];
  }, [bomData]);

  // 리드타임 분석 데이터
  const leadTimeAnalysis = useMemo(() => {
    if (!bomData || bomData.length === 0) return [];

    const ranges = {
      '0-7일': 0,
      '8-14일': 0,
      '15-30일': 0,
      '31-60일': 0,
      '60일 이상': 0
    };

    const analyzeLeadTime = (items) => {
      items.forEach(item => {
        const leadtime = item.leadtime || 0;
        if (leadtime <= 7) ranges['0-7일']++;
        else if (leadtime <= 14) ranges['8-14일']++;
        else if (leadtime <= 30) ranges['15-30일']++;
        else if (leadtime <= 60) ranges['31-60일']++;
        else ranges['60일 이상']++;

        if (item.children) {
          analyzeLeadTime(item.children);
        }
      });
    };

    analyzeLeadTime(bomData);

    return Object.entries(ranges).map(([range, count]) => ({
      range,
      count,
      percentage: ((count / metrics.totalParts) * 100).toFixed(1)
    }));
  }, [bomData, metrics.totalParts]);

  // 비용 분석 데이터
  const costAnalysis = useMemo(() => {
    if (!bomData || bomData.length === 0) return [];

    const topCostItems = [];
    const analyzeCost = (items) => {
      items.forEach(item => {
        if (item.cost) {
          topCostItems.push({
            partNumber: item.partNumber,
            description: item.description,
            cost: item.cost * (item.quantity || 1),
            quantity: item.quantity || 1
          });
        }
        if (item.children) {
          analyzeCost(item.children);
        }
      });
    };

    analyzeCost(bomData);

    return topCostItems
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
      .map(item => ({
        ...item,
        costFormatted: new Intl.NumberFormat('ko-KR', {
          style: 'currency',
          currency: 'KRW'
        }).format(item.cost)
      }));
  }, [bomData]);

  // 변경 이력 트렌드
  const changeTrend = useMemo(() => {
    if (!changeHistory || changeHistory.length === 0) return [];

    const trend = {};
    changeHistory.forEach(change => {
      const date = new Date(change.date || Date.now()).toLocaleDateString();
      trend[date] = (trend[date] || 0) + 1;
    });

    return Object.entries(trend)
      .slice(-30) // 최근 30일
      .map(([date, count]) => ({ date, count }));
  }, [changeHistory]);

  // 공급업체별 부품 수
  const supplierAnalysis = useMemo(() => {
    if (!bomData || bomData.length === 0) return [];

    const suppliers = {};
    const analyzeSuppliers = (items) => {
      items.forEach(item => {
        if (item.supplier) {
          suppliers[item.supplier] = (suppliers[item.supplier] || 0) + 1;
        }
        if (item.children) {
          analyzeSuppliers(item.children);
        }
      });
    };

    analyzeSuppliers(bomData);

    return Object.entries(suppliers)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [bomData]);

  // KPI 카드 컴포넌트
  const KPICard = ({ title, value, unit, change, icon, color }) => (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span className="stat-label">{title}</span>
        <span style={{ fontSize: '20px' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color: color || (isDark ? '#ffffff' : '#1f2937') }}>
        {value}
        {unit && <span className="stat-label" style={{ fontSize: '14px', marginLeft: '5px' }}>{unit}</span>}
      </div>
      {change !== undefined && (
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: change >= 0 ? COLORS.success : COLORS.danger
        }}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change)}% vs 지난달
        </div>
      )}
    </div>
  );

  return (
    <div className="analytics-dashboard" style={{
      height: '100%',
      overflow: 'auto',
      padding: '20px',
      background: isDark ? '#1e1e1e' : '#ffffff'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, color: isDark ? '#cccccc' : '#1f2937' }}>📊 MBOM Analytics Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="vscode-input"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="day">일간</option>
            <option value="week">주간</option>
            <option value="month">월간</option>
            <option value="quarter">분기</option>
            <option value="year">연간</option>
          </select>
          <select
            className="vscode-input"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
          >
            <option value="0">수동 새로고침</option>
            <option value="30000">30초마다</option>
            <option value="60000">1분마다</option>
            <option value="300000">5분마다</option>
          </select>
          <button className="vscode-button" onClick={() => showInfo('대시보드 새로고침')}>
            🔄 새로고침
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <KPICard
          title="총 부품 수"
          value={metrics.totalParts}
          unit="개"
          icon="📦"
          change={5.2}
          color={COLORS.primary}
        />
        <KPICard
          title="총 어셈블리"
          value={metrics.totalAssemblies}
          unit="개"
          icon="🏭"
          change={2.1}
          color={COLORS.success}
        />
        <KPICard
          title="평균 리드타임"
          value={metrics.averageLeadTime}
          unit="일"
          icon="⏱️"
          change={-3.5}
          color={metrics.averageLeadTime > 30 ? COLORS.warning : COLORS.info}
        />
        <KPICard
          title="총 비용"
          value={new Intl.NumberFormat('ko-KR', {
            notation: 'compact',
            maximumFractionDigits: 1
          }).format(metrics.totalCost)}
          unit="원"
          icon="💰"
          change={8.7}
          color={COLORS.purple}
        />
        <KPICard
          title="위험 부품"
          value={metrics.criticalParts}
          unit="개"
          icon="⚠️"
          change={-12.3}
          color={metrics.criticalParts > 0 ? COLORS.danger : COLORS.success}
        />
        <KPICard
          title="완료율"
          value={metrics.completionRate}
          unit="%"
          icon="✅"
          change={15.2}
          color={Number(metrics.completionRate) > 80 ? COLORS.success : COLORS.warning}
        />
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '20px'
      }}>
        {/* 레벨별 분포 */}
        <div style={{
          background: isDark ? '#2d2d30' : '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          border: `1px solid ${COLORS.grid}`
        }}>
          <h3 style={{ margin: '0 0 15px', color: COLORS.text }}>레벨별 부품 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={levelDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
              <XAxis dataKey="name" stroke={COLORS.text} />
              <YAxis stroke={COLORS.text} />
              <Tooltip
                contentStyle={{ background: isDark ? '#2d2d30' : '#ffffff', border: `1px solid ${COLORS.grid}` }}
                labelStyle={{ color: COLORS.text }}
              />
              <Bar dataKey="value" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 상태별 분포 */}
        <div style={{
          background: isDark ? '#2d2d30' : '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          border: `1px solid ${COLORS.grid}`
        }}>
          <h3 style={{ margin: '0 0 15px', color: COLORS.text }}>BOM 상태 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: isDark ? '#2d2d30' : '#ffffff', border: `1px solid ${COLORS.grid}` }}
                labelStyle={{ color: COLORS.text }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 리드타임 분석 */}
        <div style={{
          background: isDark ? '#2d2d30' : '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          border: `1px solid ${COLORS.grid}`
        }}>
          <h3 style={{ margin: '0 0 15px', color: COLORS.text }}>리드타임 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={leadTimeAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
              <XAxis dataKey="range" stroke={COLORS.text} />
              <YAxis yAxisId="left" stroke={COLORS.text} />
              <YAxis yAxisId="right" orientation="right" stroke={COLORS.text} />
              <Tooltip
                contentStyle={{ background: isDark ? '#2d2d30' : '#ffffff', border: `1px solid ${COLORS.grid}` }}
                labelStyle={{ color: COLORS.text }}
              />
              <Bar yAxisId="left" dataKey="count" fill={COLORS.info} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="percentage"
                stroke={COLORS.warning}
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 변경 이력 트렌드 */}
        <div style={{
          background: isDark ? '#2d2d30' : '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          border: `1px solid ${COLORS.grid}`
        }}>
          <h3 style={{ margin: '0 0 15px', color: COLORS.text }}>변경 이력 트렌드</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={changeTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
              <XAxis dataKey="date" stroke={COLORS.text} />
              <YAxis stroke={COLORS.text} />
              <Tooltip
                contentStyle={{ background: isDark ? '#2d2d30' : '#ffffff', border: `1px solid ${COLORS.grid}` }}
                labelStyle={{ color: COLORS.text }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={COLORS.purple}
                fill={COLORS.purple}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 공급업체 분석 */}
        <div style={{
          background: isDark ? '#2d2d30' : '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          border: `1px solid ${COLORS.grid}`
        }}>
          <h3 style={{ margin: '0 0 15px', color: COLORS.text }}>주요 공급업체</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={supplierAnalysis} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
              <XAxis type="number" stroke={COLORS.text} />
              <YAxis type="category" dataKey="name" stroke={COLORS.text} width={100} />
              <Tooltip
                contentStyle={{ background: isDark ? '#2d2d30' : '#ffffff', border: `1px solid ${COLORS.grid}` }}
                labelStyle={{ color: COLORS.text }}
              />
              <Bar dataKey="count" fill={COLORS.success} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 고비용 부품 */}
        <div style={{
          background: isDark ? '#2d2d30' : '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          border: `1px solid ${COLORS.grid}`
        }}>
          <h3 style={{ margin: '0 0 15px', color: COLORS.text }}>Top 10 고비용 부품</h3>
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #3e3e42' }}>
                  <th style={{ padding: '8px', textAlign: 'left', color: COLORS.text }}>품번</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: COLORS.text }}>품명</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: COLORS.text }}>수량</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: COLORS.text }}>총 비용</th>
                </tr>
              </thead>
              <tbody>
                {costAnalysis.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #252526' }}>
                    <td style={{ padding: '8px', color: '#9cdcfe' }}>{item.partNumber}</td>
                    <td style={{ padding: '8px', color: COLORS.text }}>{item.description}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: COLORS.text }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#f39c12', fontWeight: 'bold' }}>
                      {item.costFormatted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 실시간 알림 영역 */}
      <div style={{
        marginTop: '20px',
        background: isDark ? '#2d2d30' : '#ffffff',
        borderRadius: '8px',
        padding: '20px',
        border: `1px solid ${COLORS.grid}`
      }}>
        <h3 style={{ margin: '0 0 15px', color: COLORS.text }}>📢 실시간 알림</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {metrics.criticalParts > 0 && (
            <div style={{
              background: 'rgba(231, 76, 60, 0.2)',
              border: '1px solid #e74c3c',
              borderRadius: '4px',
              padding: '10px',
              flex: '1',
              minWidth: '200px'
            }}>
              <strong style={{ color: '#e74c3c' }}>⚠️ 위험</strong>
              <p style={{ margin: '5px 0 0', color: COLORS.text, fontSize: '13px' }}>
                {metrics.criticalParts}개 부품의 리드타임이 30일을 초과했습니다
              </p>
            </div>
          )}
          {Number(metrics.completionRate) < 70 && (
            <div style={{
              background: 'rgba(243, 156, 18, 0.2)',
              border: '1px solid #f39c12',
              borderRadius: '4px',
              padding: '10px',
              flex: '1',
              minWidth: '200px'
            }}>
              <strong style={{ color: '#f39c12' }}>📝 주의</strong>
              <p style={{ margin: '5px 0 0', color: COLORS.text, fontSize: '13px' }}>
                BOM 완료율이 {metrics.completionRate}%로 목표치를 하회합니다
              </p>
            </div>
          )}
          {metrics.supplierCount < 3 && (
            <div style={{
              background: 'rgba(52, 152, 219, 0.2)',
              border: '1px solid #3498db',
              borderRadius: '4px',
              padding: '10px',
              flex: '1',
              minWidth: '200px'
            }}>
              <strong style={{ color: '#3498db' }}>ℹ️ 정보</strong>
              <p style={{ margin: '5px 0 0', color: COLORS.text, fontSize: '13px' }}>
                공급업체 다변화 필요: 현재 {metrics.supplierCount}개 업체만 등록됨
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MBOMAnalyticsDashboard;