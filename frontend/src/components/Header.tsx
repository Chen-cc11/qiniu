import React from 'react';

const LogoIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M2 7L12 12M22 7L12 12M12 22V12" stroke="currentColor" strokeWidth="2"/>
    <path d="M17 4.5L7 9.5" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const NavItem: React.FC<{ icon: React.ReactNode; label: string, href: string }> = ({ icon, label, href }) => (
  <a href={href} className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </a>
);

const Header: React.FC = () => {
  return (
    <header className="bg-[#1a2133] text-white shadow-md">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <a href="#/" className="flex items-center space-x-3">
          <LogoIcon />
          <h1 className="text-xl font-bold">ModelForge</h1>
        </a>
        <nav className="flex items-center space-x-8">
          <NavItem href="#/" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>} label="首页" />
          <NavItem href="#/my-works" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z" /></svg>} label="我的作品" />
          <NavItem href="#/inspiration" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.337l.872.436a1 1 0 01.528 1.298l-.612 1.223a1 1 0 01-1.298.528L10 7.388l-.51.255a1 1 0 01-1.298-.528l-.612-1.223a1 1 0 01.528-1.298L9 4.337V3a1 1 0 011-1zm0 14a1 1 0 01-1-1v-1.337l-.872-.436a1 1 0 01-.528-1.298l.612-1.223a1 1 0 011.298-.528L10 12.612l.51-.255a1 1 0 011.298.528l.612 1.223a1 1 0 01-.528 1.298L11 15.663V17a1 1 0 01-1 1z" clipRule="evenodd" /></svg>} label="灵感库" />
        </nav>
        <div className="flex items-center space-x-6">
          <button className="relative text-gray-400 hover:text-white" aria-label="通知">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-sm" role="img" aria-label="用户头像">
            U
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
