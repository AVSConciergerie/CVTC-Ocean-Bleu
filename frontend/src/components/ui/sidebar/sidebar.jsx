
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

// Les styles sont maintenant dans index.css

const cn = (...classes) => classes.filter(Boolean).join(' ');

export const SidebarLink = ({ link, isActive, onClick }) => {
  return (
    <a
      href={link.href}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "sidebar-link",
        isActive && "sidebar-link-active"
      )}
    >
      {link.icon}
      <motion.span
        animate={{ opacity: link.open ? 1 : 0, width: link.open ? 'auto' : 0 }}
        className="sidebar-link-label"
      >
        {link.label}
      </motion.span>
    </a>
  );
};

export const SidebarBody = ({ children, className }) => {
    return (
        <div className={cn("flex flex-col h-full p-4", className)}>
            {children}
        </div>
    );
};

export const Sidebar = ({ links = [], activeLink, setActiveLink, footer, className }) => {
  const [open, setOpen] = useState(true);

  const modifiedLinks = links.map(link => ({ ...link, open }));

  return (
    <motion.div
      animate={{ width: open ? '16rem' : '5rem' }}
      className={cn("sidebar-container relative flex flex-col z-10", className)}
    >
      <button 
        className="absolute -right-3 top-10 bg-gray-800 p-1 rounded-full border border-gray-600 cursor-pointer z-20"
        onClick={() => setOpen(!open)}
      >
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
            <ChevronRight className="w-4 h-4 text-white" />
        </motion.div>
      </button>

      <SidebarBody className="justify-between flex-1">
        <div className="flex flex-col gap-2 mt-8">
          {modifiedLinks.map((link, idx) => (
            <SidebarLink 
                key={idx} 
                link={link} 
                isActive={activeLink === link.label}
                onClick={() => setActiveLink(link.label)}
            />
          ))}
        </div>
        {/* Le footer (bouton de thème) sera rendu ici */}
        <div>{footer}</div>
      </SidebarBody>
    </motion.div>
  );
};
