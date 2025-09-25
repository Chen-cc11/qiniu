import React, { useState, useRef, useEffect } from 'react';
import { LogoIcon, LogoutIcon, UserIcon, ChevronDownIcon } from './icons';

interface HeaderProps {
    onLogout: () => void;
    userEmail: string | null;
}

const Header: React.FC<HeaderProps> = ({ onLogout, userEmail }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userName = userEmail ? userEmail.split('@')[0] : '用户';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 lg:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3 text-blue-600">
          <LogoIcon className="h-8 w-8" />
          <span className="text-xl font-bold text-gray-800">ModelCraft Pro</span>
        </div>
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
            >
                <UserIcon className="w-5 h-5 text-gray-500" />
                <span className="hidden sm:inline">欢迎, {userName}</span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 animate-fade-in-fast py-1 border border-gray-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">{userName}</p>
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                    </div>
                    <button
                        onClick={() => {
                            onLogout();
                            setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors flex items-center space-x-2"
                        aria-label="Logout"
                    >
                        <LogoutIcon className="w-4 h-4" />
                        <span>登出</span>
                    </button>
                </div>
            )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
