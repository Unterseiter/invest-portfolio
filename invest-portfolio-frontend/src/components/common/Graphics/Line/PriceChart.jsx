// frontend/src/components/PortfolioChart/PortfolioChart.js
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PortfolioAPI } from '../../../../services/portfolioAPI';
import { useCurrency } from '../../../../contexts/CurrencyContext'; // ДОБАВИЛ
import "./PriceChart.css";
import ChartUp from '../../../../assets/Chart/ChartUp';

const PortfolioChart = () => {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState("day");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { formatPrice } = useCurrency(); // ДОБАВИЛ

  useEffect(() => {
    loadPortfolioData(period);
  }, [period]);

  const loadPortfolioData = async (selectedPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PortfolioAPI.getPortfolioHistory(selectedPeriod);
      if (result.success) {
        setData(result.data);
        if (result.message) {
          console.log(result.message);
        }
      } else {
        const errorMsg = result.message || 'Failed to load portfolio data';
        setError(errorMsg);
        console.error("Error loading portfolio data:", errorMsg);
        setData([]);
      }
    } catch (error) {
      const errorMsg = error.message || 'Network error';
      setError(errorMsg);
      console.error("Error loading portfolio data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Функция форматирования оси X в зависимости от периода
  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp);
    try {
      switch (period) {
        // case "hour":
        //   // Для часового периода показываем время с минутами
        //   return date.toLocaleTimeString("ru-RU", {
        //     hour: "2-digit",
        //     minute: "2-digit",
        //   });
        case "day":
          // Для дневного периода показываем время
          return date.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
          });
        case "week":
          // Для недельного периода показываем дату и день недели
          return date.toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
          });
        case "month":
          // Для месячного периода показываем даты
          return date.toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "short",
          });
        case "year":
          // Для годового периода показываем месяцы
          return date.toLocaleDateString("ru-RU", {
            month: "short",
            year: "2-digit",
          });
        default:
          return date.toLocaleDateString("ru-RU");
      }
    } catch (e) {
      return timestamp.toString();
    }
  };

  // Кастомный тултип для графика - ИСПРАВИЛ ИСПОЛЬЗОВАНИЕ formatPrice
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">
            {`${new Date(label).toLocaleString("ru-RU")}`}
          </p>
          <p className="tooltip-value">
            {formatPrice(payload[0].value)} {/* ИСПРАВИЛ: убрал жесткий $ */}
          </p>
        </div>
      );
    }
    return null;
  };

  // Функция для форматирования оси Y - ДОБАВИЛ
  const formatYAxis = (value) => {
    return formatPrice(value); // Используем formatPrice вместо жесткого $
  };

  // Состояние загрузки
  if (loading) {
    return (
      <div className="portfolio-chart loading">
        <div className="chart-header">
          <div className="chart-title-section">
            <ChartUp width={24} height={24} color="var(--color-tertiary)" />
            <h3 className="chart-title">История портфеля</h3>
          </div>
        </div>
        <div className="chart-loading-text">Загрузка реальных данных...</div>
      </div>
    );
  }

  // Состояние ошибки
  if (error) {
    return (
      <div className="portfolio-chart error">
        <div className="chart-header">
          <div className="chart-title-section">
            <ChartUp width={24} height={24} color="var(--color-error)" />
            <h3 className="chart-title">История портфеля</h3>
          </div>
        </div>
        <div className="chart-error-text">
          Ошибка: {error}
          <button 
            onClick={() => loadPortfolioData(period)}
            className="retry-btn"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  // Нет данных
  if (!data || data.length === 0) {
    return (
      <div className="portfolio-chart no-data">
        <div className="chart-header">
          <div className="chart-title-section">
            <ChartUp width={24} height={24} color="var(--color-tertiary)" />
            <h3 className="chart-title">История портфеля</h3>
          </div>
        </div>
        <div className="chart-no-data-text">
          Нет данных для отображения
          <button 
            onClick={() => loadPortfolioData(period)}
            className="retry-btn"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }

  // Основной рендер с данными
  return (
    <div className="portfolio-chart">
      <div className="chart-header">
        <div className="chart-title-section">
          <ChartUp width={24} height={24} color="var(--color-accent)" />
          <h3 className="chart-title">История портфеля (реальные данные)</h3>
        </div>
        <div className="period-selector">
          {["day", "week", "month", "year"].map((p) => (
            <button
              key={p}
              className={`period-btn ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              { p === "day"
                ? "День"
                : p === "week"
                ? "Неделя"
                : p === "month"
                ? "Месяц"
                : "Год"}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-content">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
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
              tickFormatter={formatYAxis} /* ИСПРАВИЛ: убрал жесткий $ */
              domain={['dataMin - 1000', 'dataMax + 1000']}
              scale="linear"
              allowDataOverflow={false}
              tickCount={6}
              width={80}
              stroke="var(--color-tertiary)"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-accent)"
              strokeWidth={3}
              dot={false}
              activeDot={{ 
                r: 6, 
                fill: "var(--color-accent)",
                stroke: "var(--bg-surface-primary)",
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer">
        <div className="chart-period">
          Период: {period === "day" ? "дневной" : 
                  period === "week" ? "недельный" : 
                  period === "month" ? "месячный" : "годовой"}
        </div>
        <div className="chart-info">
          Данные точек: {data.length}
        </div>
      </div>
    </div>
  );
};

export default PortfolioChart;