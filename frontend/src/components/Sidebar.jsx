import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { 
  ChevronFirst, ChevronLast, MoreVertical, Info, Sun, Moon, LogOut, 
  LayoutGrid, LifeBuoy, Home, Copy, UserCircle2, Settings 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const PROFILE_PIC_STORAGE_KEY = 'userProfilePic';

export default function Sidebar({ expanded, setExpanded }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = usePrivy();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const userMenuRef = useRef(null);

  const walletAddress = user?.wallet?.address;

  // Écouter les changements du localStorage pour mettre à jour la photo en temps réel
  useEffect(() => {
    const handleStorageChange = () => {
      const storedPic = localStorage.getItem(PROFILE_PIC_STORAGE_KEY);
      setProfilePic(storedPic);
    };

    window.addEventListener('storage', handleStorageChange);
    handleStorageChange(); // Appel initial

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
        setIsUserMenuOpen(false);
      }, 1500);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuRef]);

  const mainSidebarItems = [
    { icon: <Home size={20} />, text: 'Home', active: location.pathname === '/dashboard', onClick: () => navigate('/dashboard') },
    { icon: <LayoutGrid size={20} />, text: 'Fonctionnalités', active: location.pathname === '/fonctionnalites', onClick: () => navigate('/fonctionnalites') },
    { icon: <LifeBuoy size={20} />, text: 'Information', active: location.pathname === '/information', onClick: () => navigate('/information') },
  ];

  return (
    <aside className={`h-screen fixed top-0 left-0 z-20 sidebar-container ${expanded ? 'w-64' : 'w-20'}`}>
      <nav className="h-full flex flex-col bg-transparent shadow-sm">
        <div className="p-4 pb-2 flex justify-between items-center">
          <img 
            src="/assets/logo.svg"
            className={`overflow-hidden transition-all ${expanded ? 'w-32' : 'w-0'}`}
            alt="Logo"
          />
          <button onClick={() => setExpanded(curr => !curr)} className="p-1.5 rounded-lg hover:bg-link-hover-bg">
            {expanded ? <ChevronFirst /> : <ChevronLast />}
          </button>
        </div>

        <ul className="flex-1 px-3">
          {mainSidebarItems.map(item => (
            <SidebarItem key={item.text} item={item} expanded={expanded} />
          ))}
        </ul>
        
        <div className="border-t border-card-border p-3 relative" ref={userMenuRef}>
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 p-2 rounded-lg bg-card-bg border border-card-border shadow-lg">
              <div className="px-2 py-1">
                <p className="text-xs text-text-secondary">Connecté en tant que</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-mono font-semibold">{walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : '...'}</span>
                  <button onClick={handleCopy} className="p-1 text-text-secondary hover:text-accent">
                    {isCopied ? <span className="text-xs text-green-400">Copié!</span> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="w-full h-px bg-card-border my-2"></div>

              <SidebarItem expanded={true} item={{ icon: <Settings size={20} />, text: 'Settings', active: location.pathname === '/settings', onClick: () => { navigate('/settings'); setIsUserMenuOpen(false); } }} />
              
              <div
                onClick={toggleTheme}
                className="relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors group sidebar-link"
              >
                <div className="transition-transform group-hover:scale-110 group-hover:drop-shadow-[0_0_3px_var(--color-accent)]">
                  {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                </div>
                <span className="w-52 ml-3">Mode</span>
              </div>

              <div className="w-full h-px bg-card-border my-2"></div>

              <SidebarItem expanded={true} item={{ icon: <LogOut size={20} />, text: 'Déconnexion', onClick: handleLogout }} />
            </div>
          )}

          <button onClick={() => setIsUserMenuOpen(o => !o)} className="w-full flex items-center p-2 rounded-lg hover:bg-link-hover-bg">
            {profilePic ? (
              <img src={profilePic} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <UserCircle2 size={40} className="text-text-secondary" />
            )}
            <div className={`flex justify-between items-center overflow-hidden transition-all ${expanded ? 'w-40 ml-3' : 'w-0'}`}>
              <div className="leading-4 text-left">
                <h4 className="font-semibold">Wallet</h4>
                <span className="text-xs text-text-secondary">Menu</span>
              </div>
              <MoreVertical size={20} />
            </div>
          </button>
        </div>
      </nav>
    </aside>
  );
}

function SidebarItem({ item, expanded }) {
  return (
    <li
      onClick={item.onClick}
      className={`
        relative flex items-center py-2 px-3 my-1
        font-medium rounded-md cursor-pointer
        transition-colors group
        ${item.active ? 'sidebar-link-active' : 'sidebar-link'}
      `}
    >
      <div className="transition-transform group-hover:scale-110 group-hover:drop-shadow-[0_0_3px_var(--color-accent)]">
        {item.icon}
      </div>
      <span className={`overflow-hidden transition-all ${expanded ? 'w-52 ml-3' : 'w-0'}`}>
        {item.text}
      </span>

      {!expanded && (
        <div className={`
          absolute left-full rounded-md px-2 py-1 ml-6
          bg-card-bg text-text-primary border border-card-border text-sm
          invisible opacity-20 -translate-x-3 transition-all
          group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
        `}>
          {item.text}
        </div>
      )}
    </li>
  );
}
