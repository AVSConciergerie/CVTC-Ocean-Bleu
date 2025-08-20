import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { ChevronFirst, ChevronLast, MoreVertical, Info, Sun, Moon, LogOut, LayoutGrid, LifeBuoy, Home, Copy } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ expanded, setExpanded }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = usePrivy();

  const walletAddress = user?.wallet?.address;

  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      // Optionnel: afficher une notification "Copié !"
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

  const mainSidebarItems = [
    { 
      icon: <Home size={20} />, 
      text: 'Home', 
      active: location.pathname === '/dashboard', 
      onClick: () => navigate('/dashboard') 
    },
    { 
      icon: <LayoutGrid size={20} />, 
      text: 'Fonctionnalités', 
      active: location.pathname === '/fonctionnalites', 
      onClick: () => navigate('/fonctionnalites') 
    },
    { 
      icon: <LifeBuoy size={20} />, 
      text: 'Information', 
      active: location.pathname === '/information', 
      onClick: () => navigate('/information') 
    },
  ];

  return (
    <aside className={`h-screen fixed top-0 left-0 z-10 sidebar-container ${expanded ? 'w-64' : 'w-20'}`}>
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

        <div className="border-t border-card-border flex p-3 items-center">
          <img src={`https://i.pravatar.cc/40?u=${walletAddress}`} alt="" className="w-10 h-10 rounded-md" />
          <div className={`flex justify-between items-center overflow-hidden transition-all ${expanded ? 'w-40 ml-3' : 'w-0'}`}>
            <div className="leading-4">
              <h4 className="font-mono text-sm font-semibold">{truncateAddress(walletAddress)}</h4>
            </div>
            <button onClick={copyToClipboard} className="text-text-secondary hover:text-text-primary p-1">
              <Copy size={18} />
            </button>
          </div>
        </div>

        <ul className="px-3 pb-3">
          <li className={`
              relative flex items-center py-2 px-3 my-1
              font-medium rounded-md cursor-pointer
              transition-colors group sidebar-link
            `}
            onClick={toggleTheme}
          >
            <div className="transition-transform group-hover:scale-110 group-hover:drop-shadow-[0_0_3px_var(--color-accent)]">
              {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <span className={`overflow-hidden transition-all ${expanded ? 'w-52 ml-3' : 'w-0'}`}>
              Mode
            </span>
            {!expanded && (
                <div className={`
                  absolute left-full rounded-md px-2 py-1 ml-6
                  bg-card-bg text-text-primary border border-card-border text-sm
                  invisible opacity-20 -translate-x-3 transition-all
                  group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                `}>
                  Mode
                </div>
              )}
          </li>
          <SidebarItem item={{ icon: <LogOut size={20} />, text: 'Déconnexion', onClick: handleLogout }} expanded={expanded} />
        </ul>

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
