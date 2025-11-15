import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PortfolioAPI } from '../../../../services/portfolioAPI';
import './SectorPieChart.css';
import ChartUp from '../../../../assets/Chart/ChartUp.jsx';

// Константы вынесены для оптимизации
const CHART_COLORS = [
  'var(--chart-color-1)', 'var(--chart-color-2)', 'var(--chart-color-3)',
  'var(--chart-color-4)', 'var(--chart-color-5)', 'var(--chart-color-6)',
  'var(--chart-color-7)', 'var(--chart-color-8)', 'var(--chart-color-9)',
  'var(--chart-color-10)'
];

const CHART_CONFIG = {
  mobile: { height: 200, outerRadius: 70, innerRadius: 40 },
  tablet: { height: 250, outerRadius: 85, innerRadius: 50 },
  desktop: { height: 300, outerRadius: 100, innerRadius: 60 }
};

// Вынесенный компонент состояний
const ChartState = React.memo(({ type, title, message }) => (
  <div className={`sector-pie-chart state state--${type}`} data-testid={`chart-${type}`}>
    <div className="state__content">
      <ChartUp 
        width={24} 
        height={24} 
        color={`var(--color-${type === 'error' ? 'error' : 'tertiary'})`} 
      />
      <h3 className="state__title">{title}</h3>
      <div className="state__message">{message}</div>
    </div>
  </div>
));

const SectorPieChart = ({ height = 'auto', showLegend = true }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Оптимизированный запрос данных
  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Получаем портфели
        const portfolios = await PortfolioAPI.getPortfolios();
        if (!portfolios || portfolios.length === 0) {
          throw new Error('Нет данных портфеля');
        }

        // Берем последний портфель
        const latestPortfolio = portfolios[portfolios.length - 1];
        
        // Получаем активы портфеля
        const tableSecurities = await PortfolioAPI.getTableSecurities(latestPortfolio.id || 1);
        if (!tableSecurities || tableSecurities.length === 0) {
          throw new Error('Нет данных об активах');
        }

        // Группируем активы по тикерам (вместо секторов)
        // В реальном API у нас нет секторов, используем тикеры как "сектора"
        const sectorAllocation = {};
        let totalValue = 0;

        tableSecurities.forEach(asset => {
          const sector = asset.ticker || 'Неизвестно';
          const value = asset.sum_price || 0;
          
          if (sectorAllocation[sector]) {
            sectorAllocation[sector] += value;
          } else {
            sectorAllocation[sector] = value;
          }
          totalValue += value;
        });

        // Преобразуем в массив для графика
        const sectorData = Object.entries(sectorAllocation).map(([sector, value]) => ({
          sector: sector,
          value: value,
          percentage: totalValue > 0 ? (value / totalValue * 100) : 0
        }));

        // Сортируем по убыванию стоимости
        sectorData.sort((a, b) => b.value - a.value);

        if (mounted) {
          setData(sectorData);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching sector data:', err);
          setError(err.message || 'Не удалось загрузить данные');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => { mounted = false; };
  }, []);

  // Мемоизированные данные и вычисления
  const chartData = useMemo(() => 
    data.map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
      id: `${item.sector}-${index}`
    })), [data]
  );

  // Оптимизированные колбэки
  const renderCustomizedLabel = useCallback(({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }) => {
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="var(--color-primary)" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="pie-label"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  }, []);

  const CustomTooltip = useCallback(({ active, payload }) => {
    if (!active || !payload?.[0]) return null;
    
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p className="tooltip__sector">{data.sector}</p>
        <p className="tooltip__value">{data.value.toLocaleString('ru-RU')} ₽</p>
        <p className="tooltip__percentage">{data.percentage.toFixed(1)}% портфеля</p>
      </div>
    );
  }, []);

  const renderLegend = useCallback((value) => (
    <span className="legend-item">{value}</span>
  ), []);

  // Определение размеров на основе брейкпоинтов
  const chartDimensions = useMemo(() => {
    if (height === 'auto') {
      return {
        height: '100%',
        outerRadius: '70%',
        innerRadius: '40%'
      };
    }
    
    return {
      height,
      outerRadius: `${height * 0.35}px`,
      innerRadius: `${height * 0.2}px`
    };
  }, [height]);

  // Состояния загрузки и ошибки
  if (loading) {
    return <ChartState 
      type="loading" 
      title="Секторное распределение"
      message="Загрузка данных..."
    />;
  }

  if (error || !chartData.length) {
    return <ChartState 
      type="error" 
      title="Секторное распределение" 
      message={error || 'Нет данных для отображения'}
    />;
  }

  return (
    <div className="sector-pie-chart" data-component="sector-pie-chart">
      <div className="chart-header">
        <div className="chart-title-section">
          <ChartUp width={20} height={20} color="var(--color-accent)" />
          <h3 className="chart-title">Распределение по компаниям</h3>
        </div>
      </div>

      <div className="chart-content">
        <ResponsiveContainer 
          width="100%" 
          height={chartDimensions.height}
          className="chart-container"
        >
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={chartDimensions.outerRadius}
              innerRadius={chartDimensions.innerRadius}
              dataKey="value"
              nameKey="sector"
            >
              {chartData.map((entry) => (
                <Cell 
                  key={entry.id}
                  fill={entry.color}
                  stroke="var(--bg-surface-primary)"
                  strokeWidth={2}
                  className="pie-cell"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={renderLegend}
                className="chart-legend"
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer">
        <div className="sectors-count">
          Всего компаний: {chartData.length}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SectorPieChart);