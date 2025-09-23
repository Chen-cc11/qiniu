import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import MyWorksPage from './pages/MyWorksPage';
import InspirationPage from './pages/InspirationPage';

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const renderPage = () => {
    switch (route) {
      case '#/my-works':
        return <MyWorksPage />;
      case '#/inspiration':
        return <InspirationPage />;
      case '#/':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="bg-[#f3f4f8] h-screen text-gray-900 flex flex-col">
      <Header />
      {renderPage()}
    </div>
  );
};

export default App;
