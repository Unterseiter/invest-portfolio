// import AutoPortfolioUpdater from "../../components/common/buttons/AutoPortfolioUpdater";
import DebugPortfolioCreator from '../../hooks/DebugPortfolioCreator';

const FunctionalPage = () => {
  return (
    <div>
      <h2>Функциональная страница</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Отладочное создание портфеля</h3>
        <p>Этот компонент покажет все этапы создания портфеля с подробными логами.</p>
        <DebugPortfolioCreator />
      </div>
    </div>
  );
};

// function FunctionalPage () {
//     return (
//         <div>
//             FunctionalPage
//             <AutoPortfolioUpdater />
//         </div>
//     )
// }

export default FunctionalPage;