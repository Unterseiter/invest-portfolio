// components/SectorPieChart.jsx
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PortfolioAPI } from '../../../../test/mockData';
import { getSectorAllocation } from '../../../../test/sectorData';
import './SectorPieChart.css'

const SectorPieChart = ({ height = 500, showLegend = true }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const assets = await PortfolioAPI.getAssets();
        const sectorData = getSectorAllocation(assets);
        setData(sectorData);
      } catch (error) {
        console.error('Error fetching sector data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="chart-loading">Loading chart...</div>;
  }

  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent, sector
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
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
          <p className="tooltip-sector">{`${data.sector}`}</p>
          <p className="tooltip-value">{`Value: $${data.value.toLocaleString()}`}</p>
          <p className="tooltip-percentage">{`${data.percentage}% of portfolio`}</p>
          <p className="tooltip-assets">{`Assets: ${data.assets.join(', ')}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="sector-pie-chart">
      <h3>Распределение активов</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="sector"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => (
                <span style={{ color: 'var(--color-primary)', fontSize: '12px' }}>{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SectorPieChart;