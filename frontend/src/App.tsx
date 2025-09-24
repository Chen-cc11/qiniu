import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import MyWorksPage from './pages/MyWorksPage';
import InspirationPage from './pages/InspirationPage';
import LoginPage from './pages/LoginPage';

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('authToken'));

  // 监听URL hash的变化以实现简单的客户端路由
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // 登录成功后的回调函数
  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('authToken', token);
    setAuthToken(token);
  };

  // 登出处理函数
  // 当此函数被调用时（由Header组件中的登出按钮触发），
  // 它会从localStorage中移除认证令牌，并将组件的authToken状态设置为空。
  // 状态的改变会触发App组件的重新渲染，此时因为authToken为空，
  // 组件将渲染LoginPage，从而实现登出并返回登录界面的效果。
  const handleLogout = useCallback(() => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    // 可选: 登出后重定向到主页
    window.location.hash = '#/';
  }, []);

  // 根据当前路由渲染不同的页面
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

  // 如果没有认证token，则显示登录页面
  if (!authToken) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 如果已认证，则显示主应用界面
  return (
    <div className="bg-[#f3f4f8] h-screen text-gray-900 flex flex-col">
      <Header onLogout={handleLogout} />
      {renderPage()}
    </div>
  );
};

export default App;
