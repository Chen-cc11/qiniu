import React from 'react';
import { LogoIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 lg:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3 text-blue-600">
          <LogoIcon className="h-8 w-8" />
          <span className="text-xl font-bold text-gray-800">ModelCraft Pro</span>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            登录
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            注册
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;