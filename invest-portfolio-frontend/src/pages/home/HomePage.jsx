import PortfolioValue from "../../components/common/actives/TotalPrice/TotalPrice"
import TotalActive from "../../components/common/actives/TotalActive/TotalActive";
import BestPerformer from "../../components/common/actives/BestPerformer/BestPerformer";
import WorstPerformer from "../../components/common/actives/WorstPerformer/WorstPerformer";
import PortfolioChart from "../../components/common/Graphics/Line/PriceChart"
import SectorPieChart from "../../components/common/Graphics/Sector/SectorPieChart"
import AllActives from "../../components/common/tables/AllActives/AllActives"

import "./HomePage.css";

function HomePage() {
return(
    <div className="home">
        
        <div className="home-header">
            <h2>Обзор портфеля</h2>
            <p>Общая информация о ваших инвестициях и текущем состоянии портфеля</p>
        </div>

        <div className="active-info">
            <PortfolioValue />
            <TotalActive />
            <BestPerformer />
            <WorstPerformer />
        </div>

        <div className="portfolio-graphics">
            <PortfolioChart />
            <SectorPieChart />
        </div>

        <div>
            <AllActives />
        </div>

    </div>
)
}
export default HomePage;