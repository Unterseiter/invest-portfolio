import React, { useState, useEffect } from 'react';
import { PortfolioAPI } from '../../../test/mockData';
import './TotalActive.css';

const TotalActive = () => {

  return (
    <div className="portfolio-actives">
      <h2>Количество активов</h2>
      <div className="total-actives">6</div>
      <div className="second-total-actives">
        В шести секторах экономики
      </div>
    </div>
  );
};

export default TotalActive;