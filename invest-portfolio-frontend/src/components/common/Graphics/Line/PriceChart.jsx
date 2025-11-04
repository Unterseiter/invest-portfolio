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
import { PortfolioAPI } from "../../../../test/mockData";
import "./PriceChart.css";
import ChartUp from "../../../../assets/Chart/ChartUp";

const PortfolioChart = () => {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState("day");
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
      console.error("Error loading portfolio data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp);
    switch (period) {
      case "hour":
        return date.toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "day":
        return date.toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "week":
        return date.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
        });
      case "month":
        return date.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "short",
        });
      case "year":
        return date.toLocaleDateString("ru-RU", {
          month: "short",
          year: "2-digit",
        });
      default:
        return date.toLocaleDateString();
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${new Date(label).toLocaleString("ru-RU")}`}</p>
          <p className="tooltip-value">{`$${payload[0].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="portfolio-chart loading">
        <ChartUp width={24} height={24} color="var(--color-tertiary)" />
        <h3 className="chart-title">История портфеля</h3>
        <div className="chart-loading-text">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="portfolio-chart">
      <div className="chart-header">
        <div className="chart-title-section">
          <ChartUp width={24} height={24} color="var(--color-accent)" />
          <h3 className="chart-title">История портфеля</h3>
        </div>
        <div className="period-selector">
          {["hour", "day", "week", "month", "year"].map((p) => (
            <button
              key={p}
              className={`period-btn ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p === "hour"
                ? "Час"
                : p === "day"
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
              tickFormatter={(value) => `$${value.toLocaleString()}`}
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
          Период: {period === "hour" ? "часовой" : 
                  period === "day" ? "дневной" : 
                  period === "week" ? "недельный" : 
                  period === "month" ? "месячный" : "годовой"}
        </div>
      </div>
    </div>
  );
};

export default PortfolioChart;