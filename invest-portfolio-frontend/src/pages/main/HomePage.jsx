import './Main-page.css'

function MainPage () {
    return (
        <div className='portfolio-review-box'>
            
            <div className="portfolio-review">
                <h1>
                    Обзор портфеля
                </h1>
                <p>
                    Общая информация о ваших инвестициях и текущем состоянии портфеля
                </p>
            </div>

            <div className="portfolio-info">
                {/* ячейка общей стоимости */} <div className="total-cost">$</div>
                {/* кол-во активов */} <div className="number-actives">**</div>
                {/* Лучший актив */} <div className="best-active">active</div>
            </div>
        </div>

    )
}

export default MainPage;