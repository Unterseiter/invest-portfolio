// sectorData.js
export const sectorAllocationData = [
    {
      sector: 'Technology',
      value: 6210.09, // AAPL + GOOGL + MSFT
      percentage: 40.1,
      color: '#8884d8',
      assets: ['AAPL', 'GOOGL', 'MSFT']
    },
    {
      sector: 'Automotive',
      value: 1242.10, // TSLA
      percentage: 8.0,
      color: '#82ca9d',
      assets: ['TSLA']
    },
    {
      sector: 'Cryptocurrency',
      value: 25640.00, // BTC
      percentage: 51.9,
      color: '#ffc658',
      assets: ['BTC']
    }
  ];
  
  export const getSectorAllocation = (assets) => {
    const sectors = {
      'Technology': { value: 0, assets: [], color: '#8884d8' },
      'Automotive': { value: 0, assets: [], color: '#82ca9d' },
      'Cryptocurrency': { value: 0, assets: [], color: '#ffc658' },
      'Healthcare': { value: 0, assets: [], color: '#ff8042' },
      'Finance': { value: 0, assets: [], color: '#0088fe' }
    };
  
    // Сопоставление активов с секторами
    const assetSectors = {
      'AAPL': 'Technology',
      'GOOGL': 'Technology',
      'MSFT': 'Technology',
      'TSLA': 'Automotive',
      'BTC': 'Cryptocurrency'
    };
  
    assets.forEach(asset => {
      const sector = assetSectors[asset.symbol] || 'Other';
      if (sectors[sector]) {
        sectors[sector].value += asset.value;
        sectors[sector].assets.push(asset.symbol);
      }
    });
  
    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    
    return Object.entries(sectors)
      .filter(([_, data]) => data.value > 0)
      .map(([sector, data]) => ({
        sector,
        value: Number(data.value.toFixed(2)),
        percentage: Number(((data.value / totalValue) * 100).toFixed(1)),
        color: data.color,
        assets: data.assets
      }));
  };