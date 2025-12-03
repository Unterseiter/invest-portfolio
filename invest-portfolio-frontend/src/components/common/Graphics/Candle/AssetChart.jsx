import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar
} from 'recharts';
import { PortfolioAPI } from '../../../../services/portfolioAPI';
import './AssetChart.css';

// Компонент для кастомного тултипа
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isGrowing = data.close >= data.open;
    const change = data.close - data.open;
    const changePercent = ((change / data.open) * 100).toFixed(2);
    
    return (
      <div className="chart-tooltip">
        <p className="tooltip-date">
          {new Date(data.timestamp).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}
        </p>
        <div className="price-details">
          <div className="price-row">
            <span>Открытие:</span>
            <span>${data.open?.toFixed(2)}</span>
          </div>
          <div className="price-row">
            <span>Закрытие:</span>
            <span style={{ color: isGrowing ? '#00a86b' : '#ff4444' }}>
              ${data.close?.toFixed(2)}
            </span>
          </div>
          <div className="price-row">
            <span>Максимум:</span>
            <span className="price-up">${data.high?.toFixed(2)}</span>
          </div>
          <div className="price-row">
            <span>Минимум:</span>
            <span className="price-down">${data.low?.toFixed(2)}</span>
          </div>
          <div className="price-row">
            <span>Изменение:</span>
            <span style={{ color: isGrowing ? '#00a86b' : '#ff4444' }}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent}%)
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Компонент для отрисовки свечей
const renderCandle = (props) => {
  const { x, y, width, height, low, high, open, close } = props;
  
  const isGrowing = close >= open;
  const color = isGrowing ? '#00a86b' : '#ff4444';
  
  // Координаты для тени (high-low линия)
  const shadowY1 = y + high;
  const shadowY2 = y + low;
  
  // Координаты для тела свечи
  const bodyY = y + Math.max(open, close);
  const bodyHeight = Math.abs(close - open);
  
  return (
    <g>
      {/* Тень (линия от high до low) */}
      <line
        x1={x + width / 2}
        y1={shadowY1}
        x2={x + width / 2}
        y2={shadowY2}
        stroke={color}
        strokeWidth={1}
      />
      {/* Тело свечи */}
      <rect
        x={x + width * 0.3}
        y={bodyY}
        width={width * 0.4}
        height={Math.max(bodyHeight, 1)}
        fill={color}
        stroke={color}
      />
    </g>
  );
};

const AssetChart = ({ asset }) => {
    const [chartData, setChartData] = useState([]);
    const [period, setPeriod] = useState('1M');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadChartData = async () => {
            if (!asset) {
                setChartData([]);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const stockData = await PortfolioAPI.getStockNameById(asset.id);
                
                if (stockData && stockData.table && stockData.table.length > 0) {
                    const priceTable = stockData.table;
                    
                    // Сортируем по дате (от старых к новым)
                    const sortedTable = [...priceTable].sort((a, b) => 
                        new Date(a.date) - new Date(b.date)
                    );

                    // Преобразуем данные для графика
                    const formattedData = sortedTable.map(item => {
                        const date = new Date(item.date);
                        const open = parseFloat(item.open);
                        const high = parseFloat(item.high);
                        const low = parseFloat(item.low);
                        const close = parseFloat(item.close);
                        
                        return {
                            timestamp: date.getTime(),
                            date: date.toISOString().split('T')[0],
                            open: open,
                            high: high,
                            low: low,
                            close: close,
                            // Для отрисовки свечей - нормализованные значения
                            ohlc: [open, high, low, close],
                            // Для Bar компонента
                            range: [low, high],
                            body: [Math.min(open, close), Math.max(open, close)]
                        };
                    });

                    const filteredData = filterDataByPeriod(formattedData, period);
                    setChartData(filteredData);
                } else {
                    setError('Нет данных о ценах для выбранного актива');
                }

            } catch (err) {
                console.error('Ошибка загрузки данных графика:', err);
                setError('Не удалось загрузить данные графика');
            } finally {
                setLoading(false);
            }
        };

        loadChartData();
    }, [asset, period]);

    const filterDataByPeriod = (data, periodType) => {
        if (!data || data.length === 0) return [];
        
        const now = new Date();
        let startTime;

        switch (periodType) {
            case '1D':
                startTime = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
                break;
            case '1W':
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '1M':
                startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '3M':
                startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1Y':
                startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                return data;
        }

        return data.filter(item => new Date(item.timestamp) >= startTime);
    };

    const formatXAxis = (timestamp) => {
        const date = new Date(timestamp);
        
        switch (period) {
            case '1D':
                return date.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            case '1W':
                return date.toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit'
                });
            case '1M':
            case '3M':
                return date.toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: 'short'
                });
            case '1Y':
                return date.toLocaleDateString('ru-RU', {
                    month: 'short',
                    year: '2-digit'
                });
            default:
                return date.toLocaleDateString('ru-RU');
        }
    };

    const getYAxisDomain = () => {
        if (chartData.length === 0) return [0, 100];
        
        const lows = chartData.map(item => item.low);
        const highs = chartData.map(item => item.high);
        const min = Math.min(...lows);
        const max = Math.max(...highs);
        const padding = (max - min) * 0.05;
        
        return [min - padding, max + padding];
    };

    // Функция для получения цвета свечи
    const getCandleColor = (data) => {
        return data.close >= data.open ? '#00a86b' : '#ff4444';
    };

    const getPeriodText = () => {
        const periodTexts = {
            '1D': 'дневной',
            '1W': 'недельный',
            '1M': 'месячный',
            '3M': '3 месяца',
            '1Y': 'годовой'
        };
        return periodTexts[period] || 'дневной';
    };

    // Временный компонент иконки
    const ChartIcon = ({ width = 24, height = 24, color = 'currentColor' }) => (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 17L9 11L13 15L21 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 7H21V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );

    if (!asset) {
        return (
            <div className="asset-chart">
                <div className="chart-header">
                    <div className="chart-title-section">
                        <ChartIcon width={24} height={24} color="var(--color-tertiary)" />
                        <h3 className="chart-title">График актива</h3>
                    </div>
                </div>
                <div className="chart-content">
                    <div className="chart-placeholder">
                        <div className="placeholder-content">
                            <ChartIcon width={48} height={48} color="var(--color-tertiary)" />
                            <h4>Выберите актив</h4>
                            <p>Для отображения графика выберите актив из списка</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="asset-chart loading">
                <div className="chart-header">
                    <div className="chart-title-section">
                        <ChartIcon width={24} height={24} color="var(--color-tertiary)" />
                        <h3 className="chart-title">График {asset?.symbol}</h3>
                    </div>
                </div>
                <div className="chart-content">
                    <div className="chart-placeholder">
                        <div className="placeholder-content">
                            <div className="loading-text">Загрузка данных...</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !chartData.length) {
        return (
            <div className="asset-chart error">
                <div className="chart-header">
                    <div className="chart-title-section">
                        <ChartIcon width={24} height={24} color="var(--color-error)" />
                        <h3 className="chart-title">График {asset?.symbol}</h3>
                    </div>
                </div>
                <div className="chart-content">
                    <div className="chart-placeholder">
                        <div className="placeholder-content">
                            <h4>Ошибка загрузки</h4>
                            <p>{error || 'Нет данных для отображения графика'}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="asset-chart">
            <div className="chart-header">
                <div className="chart-title-section">
                    <ChartIcon width={24} height={24} color="var(--color-accent)" />
                    <h3 className="chart-title">Свечевой график {asset?.symbol}</h3>
                </div>
                <div className="chart-periods">
                    {['1D', '1W', '1M', '3M', '1Y'].map((p) => (
                        <button
                            key={p}
                            className={`period-btn ${period === p ? 'active' : ''}`}
                            onClick={() => setPeriod(p)}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="chart-content">
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="var(--border-tertiary)" 
                            vertical={false}
                        />
                        <XAxis 
                            dataKey="timestamp" 
                            tickFormatter={formatXAxis}
                            stroke="var(--color-tertiary)"
                            fontSize={12}
                        />
                        <YAxis
                            domain={getYAxisDomain()}
                            tickFormatter={(value) => `$${value.toFixed(2)}`}
                            stroke="var(--color-tertiary)"
                            fontSize={12}
                            width={80}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        
                        {/* Свечной график используя Bar для диапазона high-low */}
                        <Bar
                            dataKey="range"
                            fill="#8884d8"
                            shape={(props) => {
                                const { x, y, width, height, low, high, index } = props;
                                const data = chartData[index];
                                if (!data) return null;
                                
                                const isGrowing = data.close >= data.open;
                                const color = isGrowing ? '#00a86b' : '#ff4444';
                                
                                return (
                                    <g>
                                        {/* Тень (high-low линия) */}
                                        <line
                                            x1={x + width / 2}
                                            y1={y}
                                            x2={x + width / 2}
                                            y2={y + height}
                                            stroke={color}
                                            strokeWidth={1}
                                        />
                                        {/* Тело свечи */}
                                        <rect
                                            x={x + width * 0.25}
                                            y={y + (height - Math.abs(data.close - data.open)) / 2}
                                            width={width * 0.5}
                                            height={Math.abs(data.close - data.open)}
                                            fill={color}
                                            stroke={color}
                                        />
                                    </g>
                                );
                            }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-footer">
                <div className="chart-info">
                    Период: {getPeriodText()} • Свечей: {chartData.length}
                </div>
                <div className="chart-legend">
                    <div className="legend-item">
                        <div className="legend-color growing"></div>
                        <span>Рост</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color falling"></div>
                        <span>Падение</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetChart;