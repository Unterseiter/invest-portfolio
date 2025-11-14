// frontend/src/components/TestAPI.js
import React, { useEffect, useState } from 'react';
import { PortfolioAPI } from '../../services/portfolioAPI';

const TestAPI = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('Testing API connection...');
        const result = await PortfolioAPI.getPortfolios();
        setData(result);
        console.log('API response:', result);
      } catch (err) {
        setError(err.message);
        console.error('API error:', err);
      }
    };

    testAPI();
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Тест API подключения</h3>
      {data && <pre>Данные: {JSON.stringify(data, null, 2)}</pre>}
      {error && <p style={{ color: 'red' }}>Ошибка: {error}</p>}
      {!data && !error && <p>Загрузка...</p>}
    </div>
  );
};

export default TestAPI;