import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PortfolioAPI } from '../../../test/mockData';
import './PriceChart.css';

const PortfolioChart = () => {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState('day');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPortfolioData(period);
  }, [period]);

  const loadPortfolioData = async (selectedPeriod) => {
    setLoading(true);
    try {
      const chartData = await PortfolioAPI.getPortfolioHistory(selectedPeriod);
      setData(chartData.data);
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp);
    switch (period) {
      case 'hour': return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      case 'day': return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      case 'week': return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      case 'month': return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
      case 'year': return date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
      default: return date.toLocaleDateString();
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${new Date(label).toLocaleString('ru-RU')}`}</p>
          <p className="intro">{`Цена: $${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  if (loading) return <div>Загрузка графика портфеля...</div>;

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>История портфеля</h3>
        <div className="period-selector">
          {['hour', 'day', 'week', 'month', 'year'].map((p) => (
            <button
              key={p}
              className={`period-btn ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'hour' ? 'Час' : p === 'day' ? 'День' : p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Год'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tickFormatter={formatXAxis} />
          <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#8884d8" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PortfolioChart;