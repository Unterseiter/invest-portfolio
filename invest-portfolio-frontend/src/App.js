import Header from './components/Align/Header/Header';
import Footer from './components/Align/Footer/Footer';
import Sidebar from './components/Align/Sidebar/Sidebar';
import './App.css';

function App() {
  return (
    <div className="App">
      
      <Header />
      
        <main className='App-body'>
          <Sidebar />
          <div className='main-content'>
            <h1>CONTENT content</h1>
            
          </div>
        </main>

      <Footer />

    </div>
  );
}

export default App;