import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ReferenceLine
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
    const isForecast = data.isForecast;
    
    return (
      <div className={`chart-tooltip ${isForecast ? 'candle-tooltip forecast-tooltip' : 'candle-tooltip'}`}>
        <p className="tooltip-date">
          {new Date(data.timestamp).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
          {isForecast && <span className="forecast-badge">ПРОГНОЗ</span>}
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
          {isForecast && (
            <div className="price-row forecast-info">
              <span style={{ fontStyle: 'italic', color: 'var(--color-accent)' }}>
                Прогнозная свеча - данные могут отличаться
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Компонент для отрисовки свечей
const CandleStick = (props) => {
  const { x, y, width, height, data } = props;
  
  if (!data) return null;
  
  const isGrowing = data.close >= data.open;
  const isForecast = data.isForecast;
  const color = isGrowing ? '#00a86b' : '#ff4444';
  
  // Стили для прогнозных свечей
  const forecastStyle = isForecast ? {
    strokeDasharray: '4,2',
    strokeOpacity: 0.7,
    fillOpacity: 0.3
  } : {};
  
  // Вычисляем координаты для свечи
  const candleHeight = Math.max(Math.abs(data.close - data.open), 1);
  const candleY = y + (height - candleHeight) / 2;
  
  // Для рендеринга линии high-low и тела свечи
  const highLowLine = (
    <line
      x1={x + width / 2}
      y1={y}
      x2={x + width / 2}
      y2={y + height}
      stroke={color}
      strokeWidth={1}
      {...forecastStyle}
    />
  );
  
  const candleBody = (
    <rect
      x={x + width * 0.25}
      y={candleY}
      width={width * 0.5}
      height={candleHeight}
      fill={color}
      stroke={color}
      {...forecastStyle}
    />
  );
  
  return (
    <g>
      {highLowLine}
      {candleBody}
    </g>
  );
};

const AssetChart = ({ asset, forecastData }) => {
    const [chartData, setChartData] = useState([]);
    const [period, setPeriod] = useState('1W');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadChartData = async () => {
            if (!asset || !asset.id) {
                console.log('No asset selected or asset has no id');
                setChartData([]);
                return;
            }

            try {
                console.log('Loading chart data for asset:', asset);
                setLoading(true);
                setError(null);

                const stockData = await PortfolioAPI.getStockNameById(asset.id);
                console.log('Received stockData:', stockData);
                
                if (stockData && stockData.table && stockData.table.length > 0) {
                    console.log('Processing table data:', stockData.table);
                    const priceTable = stockData.table;
                    
                    // Сортируем по дате (от старых к новым)
                    const sortedTable = [...priceTable].sort((a, b) => {
                        const dateA = new Date(a.date || a.timestamp || a.time);
                        const dateB = new Date(b.date || b.timestamp || b.time);
                        return dateA - dateB;
                    });

                    console.log('Sorted table:', sortedTable);

                    // Преобразуем данные для графика
                    const formattedData = sortedTable.map((item, index) => {
                        // Пробуем разные возможные поля с датой
                        const dateStr = item.date || item.timestamp || item.time;
                        if (!dateStr) {
                            console.warn('Item has no date field:', item);
                            return null;
                        }
                        
                        const date = new Date(dateStr);
                        if (isNaN(date.getTime())) {
                            console.warn('Invalid date format:', dateStr);
                            return null;
                        }

                        const open = parseFloat(item.open);
                        const high = parseFloat(item.high);
                        const low = parseFloat(item.low);
                        const close = parseFloat(item.close);
                        
                        // Проверяем валидность данных
                        if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
                            console.warn('Invalid price data:', item);
                            return null;
                        }

                        const candleData = {
                            timestamp: date.getTime(),
                            date: date.toISOString(),
                            open: open,
                            high: high,
                            low: low,
                            close: close,
                            volume: parseFloat(item.volume) || 0,
                            isForecast: false,
                            // Для отрисовки через Bar нам нужны эти поля
                            range: [low, high],
                            body: [Math.min(open, close), Math.max(open, close)]
                        };

                        return candleData;
                    }).filter(item => item !== null);

                    console.log('Formatted data:', formattedData);

                    if (formattedData.length === 0) {
                        throw new Error('Нет валидных данных для отображения');
                    }

                    const filteredData = filterDataByPeriod(formattedData, period);
                    console.log('Filtered data:', filteredData);
                    setChartData(filteredData);
                } else {
                    console.warn('No table data found in stockData');
                    setError('Нет данных о ценах для выбранного актива');
                    setChartData([]);
                }

            } catch (err) {
                console.error('Ошибка загрузки данных графика:', err);
                setError(err.message || 'Не удалось загрузить данные графика');
                setChartData([]);
            } finally {
                setLoading(false);
            }
        };

        loadChartData();
    }, [asset, period]);

    // Объединяем исторические данные с прогнозными
    const combinedData = useMemo(() => {
        if (!chartData.length) return [];
        
        const historical = [...chartData];
        const forecast = forecastData?.forecastCandles || [];
        
        // Добавляем прогнозные свечи после исторических
        const combined = [...historical, ...forecast.map(candle => ({
            ...candle,
            // Добавляем необходимые поля для отрисовки
            range: [candle.low, candle.high],
            body: [Math.min(candle.open, candle.close), Math.max(candle.open, candle.close)]
        }))];
        
        console.log('Combined data:', combined);
        return combined;
    }, [chartData, forecastData]);

    // Находим последнюю историческую свечу для разделительной линии
    const lastHistoricalIndex = chartData.length - 1;
    const lastHistoricalTimestamp = chartData.length > 0 ? chartData[lastHistoricalIndex].timestamp : null;

    const filterDataByPeriod = (data, periodType) => {
        if (!data || data.length === 0) return [];
        
        let dataPoints = 0;

        // Определяем количество точек для каждого периода
        switch (periodType) {
            case '1D':
                dataPoints = 2; // 24 часа
                break;
            case '1W':
                dataPoints = 7 * 24; // 7 дней по 24 часа
                break;
            case '1M':
                dataPoints = 30 * 24; // 30 дней по 24 часа
                break;
            case '3M':
                dataPoints = 90 * 24; // 90 дней по 24 часа
                break;
            case '1Y':
                dataPoints = 365 * 24; // 365 дней по 24 часа
                break;
            default:
                return data;
        }

        // Ограничиваем количеством доступных данных
        dataPoints = Math.min(dataPoints, data.length);
        
        // Берем последние N записей
        const startIndex = Math.max(0, data.length - dataPoints);
        const result = data.slice(startIndex);
        
        console.log(`Filtered ${result.length} points for period ${periodType}`);
        return result;
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
        const dataToUse = combinedData.length > 0 ? combinedData : chartData;
        
        if (dataToUse.length === 0) return [0, 100];
        
        const lows = dataToUse.map(item => item.low);
        const highs = dataToUse.map(item => item.high);
        const min = Math.min(...lows);
        const max = Math.max(...highs);
        const padding = (max - min) * 0.05;
        
        return [Math.max(0, min - padding), max + padding];
    };

    const getPeriodText = () => {
        const periodTexts = {
            '1D': 'дневной',
            '1W': 'недельный',
            '1M': 'месячный',
            '3M': '3 месяца',
            '1Y': 'годовой'
        };
        return periodTexts[period] || 'недельный';
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

    console.log('Rendering chart with combined data:', combinedData);

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
                        data={combinedData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="var(--border-tertiary)" 
                            vertical={false}
                        />
                        
                        {/* Разделительная линия между историческими и прогнозными данными */}
                        {lastHistoricalTimestamp && forecastData && (
                            <ReferenceLine 
                                x={lastHistoricalTimestamp} 
                                stroke="var(--color-accent)"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                label={{
                                    value: 'Прогноз',
                                    position: 'insideTopRight',
                                    fill: 'var(--color-accent)',
                                    fontSize: 12,
                                    fontWeight: 'bold'
                                }}
                            />
                        )}
                        
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
                        
                        {/* Свечной график через Bar с кастомной формой */}
                        <Bar
                            dataKey="range"
                            shape={(props) => {
                                const { x, y, width, height, index } = props;
                                const data = combinedData[index];
                                
                                if (!data) return null;
                                
                                const isGrowing = data.close >= data.open;
                                const isForecast = data.isForecast;
                                const color = isGrowing ? '#00a86b' : '#ff4444';
                                
                                // Стили для прогнозных свечей
                                const forecastStyle = isForecast ? {
                                    strokeDasharray: '4,2',
                                    strokeOpacity: 0.7,
                                    fillOpacity: 0.3
                                } : {};
                                
                                // Вычисляем координаты для тела свечи
                                const candleHeight = Math.max(Math.abs(data.close - data.open), 1);
                                const candleY = y + (height - candleHeight) / 2;
                                
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
                                            {...forecastStyle}
                                        />
                                        {/* Тело свечи */}
                                        <rect
                                            x={x + width * 0.25}
                                            y={candleY}
                                            width={width * 0.5}
                                            height={candleHeight}
                                            fill={color}
                                            stroke={color}
                                            {...forecastStyle}
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
                    Период: {getPeriodText()} • 
                    Исторических свечей: {chartData.length} • 
                    {forecastData ? ` Прогнозных: ${forecastData.forecastCandles?.length || 0}` : ''}
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
                    {forecastData && (
                        <div className="legend-item">
                            <div className="legend-color forecast" style={{ 
                                background: 'repeating-linear-gradient(45deg, var(--color-accent), var(--color-accent) 2px, transparent 2px, transparent 4px)',
                                borderColor: 'var(--color-accent)'
                            }}></div>
                            <span>Прогноз</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssetChart;