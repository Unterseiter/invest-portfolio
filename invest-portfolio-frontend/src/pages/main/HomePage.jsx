import PriceChart from "../../components/common/Graphics/PriceChart";
import TotalPrice from "../../components/common/TotalPrice/TotalPrice";
import TotalActive from "../../components/common/TotalActive/TotalActive";
import './HomePage.css';

function MainPage() {
  return (
    <div className="home">
      <div>
        <h1>Обзор портфеля</h1>
        <p>Общая информация о ваших инвестициях и текущем состоянии портфеля</p>
      </div>

    <div className="total">
    <TotalPrice />
    <TotalActive /> 
    </div>

      <div>
        <PriceChart />
      </div>
    </div>
  );
}

export default MainPage;
