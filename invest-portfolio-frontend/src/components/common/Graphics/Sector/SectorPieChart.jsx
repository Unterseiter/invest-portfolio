import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import PortfolioAPI from '../../../../test/mockData.js';
import './SectorPieChart.css';
import ChartUp from '../../../../assets/Chart/ChartUp.jsx';

const SectorPieChart = ({ height = 300, showLegend = true }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const sectorData = await PortfolioAPI.getSectorAllocation();
        setData(sectorData);
        setError(null);
      } catch (error) {
        console.error('Error fetching sector data:', error);
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="sector-pie-chart loading">
        <ChartUp width={24} height={24} color="var(--color-tertiary)" />
        <h3 className="chart-title">Секторное распределение</h3>
        <div className="chart-loading-text">Загрузка данных...</div>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="sector-pie-chart error">
        <ChartUp width={24} height={24} color="var(--color-error)" />
        <h3 className="chart-title">Секторное распределение</h3>
        <div className="chart-error-text">{error || 'Нет данных для отображения'}</div>
      </div>
    );
  }

  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="var(--color-primary)" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={11}
        fontWeight="var(--font-weight-semibold)"
        fontFamily="var(--font-family-primary)"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-sector"><strong>{data.sector}</strong></p>
          <p className="tooltip-value">{data.value.toLocaleString('ru-RU')} ₽</p>
          <p className="tooltip-percentage">{data.percentage}% портфеля</p>
        </div>
      );
    }
    return null;
  };

  // Цветовая палитра для секторов
  const COLORS = [
    'var(--color-accent)',
    'var(--color-success)',
    'var(--color-warning)',
    'var(--color-error)',
    'var(--color-info)',
    '#8B5CF6',
    '#06B6D4',
    '#84CC16',
    '#F59E0B',
    '#EF4444'
  ];

  return (
    <div className="sector-pie-chart">
      <div className="chart-header">
        <div className="chart-title-section">
          <ChartUp width={24} height={24} color="var(--color-accent)" />
          <h3 className="chart-title">Секторное распределение</h3>
        </div>
      </div>

      <div className="chart-content">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={height * 0.35}
              innerRadius={height * 0.2}
              fill="#8884d8"
              dataKey="value"
              nameKey="sector"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="var(--bg-surface-primary)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ 
                    color: 'var(--color-secondary)', 
                    fontSize: 'var(--font-size-xs)',
                    fontFamily: 'var(--font-family-primary)'
                  }}>
                    {value}
                  </span>
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer">
        <div className="sectors-count">
          Всего секторов: {data.length}
        </div>
      </div>
    </div>
  );
};

export default SectorPieChart;