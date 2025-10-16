import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';

import Header from './components/Align/Header/Header';
import Footer from './components/Align/Footer/Footer';
import Sidebar from './components/Align/Sidebar/Sidebar';
import './App.css';

import HomePage from './pages/main/HomePage';
import SettingsPage from './pages/settings/SettingsPage'

function App() {
  return (
    <Router>

    <div className="App">
      
      <Header />
      
        <main className='App-body'>
          <Sidebar />
          <div className='main-content'>
            <Routes>
              <Route path='/' element={<HomePage />} />
              <Route path='/settings' element={<SettingsPage />} />
            </Routes>
            
          </div>
        </main>

      <Footer />

    </div>
    </Router>
  );
}

export default App;