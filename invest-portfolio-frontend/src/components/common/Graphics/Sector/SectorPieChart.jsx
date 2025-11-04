// components/SectorPieChart.jsx
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import PortfolioAPI from '../../../../test/mockData.js';
import './SectorPieChart.css';

const SectorPieChart = ({ height = 400, showLegend = true }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Используем встроенный метод API для получения секторного распределения
        const sectorData = await PortfolioAPI.getSectorAllocation();
        setData(sectorData);
      } catch (error) {
        console.error('Error fetching sector data:', error);
        // Fallback: пробуем получить через активы
        try {
          const assets = await PortfolioAPI.getAssets();
          const sectorAllocation = await PortfolioAPI.getSectorAllocation();
          setData(sectorAllocation);
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="chart-loading">Загрузка данных...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="chart-error">Нет данных для отображения</div>;
  }

  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Не показываем подписи для маленьких сегментов

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
        stroke="black"
        strokeWidth={0.5}
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
          <p className="tooltip-value">Стоимость: {data.value.toLocaleString('ru-RU')} ₽</p>
          <p className="tooltip-percentage">{data.percentage}% портфеля</p>
          <p className="tooltip-assets">Активы: {data.assets.join(', ')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="sector-pie-chart">
      <h3>Секторное распределение активов</h3>
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
                fill={entry.color} 
                stroke="#fff"
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
              <span style={{ color: 'var(--color-secondary)', fontSize: '12px' }}>
                  {value} ({entry.payload.percentage}%)
                </span>
            )}
          />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SectorPieChart;