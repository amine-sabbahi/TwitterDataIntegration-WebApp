// components/Sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChartBar, MessageSquare, PieChart, Activity, Home, Twitter } from 'lucide-react';

interface NavItem {
  name: string;
  icon: React.ReactNode;
  sectionId: string;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    icon: <Home className="w-6 h-6" />,
    sectionId: 'dashboard-top'
  },
  {
    name: 'Sentiment Cards',
    icon: <Activity className="w-6 h-6" />,
    sectionId: 'sentiment-cards'
  },
  {
    name: 'Distribution',
    icon: <ChartBar className="w-6 h-6" />,
    sectionId: 'sentiment-distribution'
  },
  {
    name: 'Recent Tweets',
    icon: <MessageSquare className="w-6 h-6" />,
    sectionId: 'tweets-table'
  }
];

export function Sidebar() {
  const [activeSection, setActiveSection] = useState('dashboard-top');

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map(item => document.getElementById(item.sectionId));
      const scrollPosition = window.scrollY + 100; // Offset for better detection

      sections.forEach((section) => {
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.clientHeight;
          if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            setActiveSection(section.id);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 p-4">
      {/* Twitter Logo at the Top */}
      <div className="flex items-center justify-center mb-6">
        <Twitter className="w-10 h-10 text-blue-500" />
        <span className="ml-2 text-xl font-bold text-gray-800">Twteets Analysis</span>
      </div>
      
      {/* Navigation Items */}
      <div className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <button
            key={item.sectionId}
            onClick={() => scrollToSection(item.sectionId)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeSection === item.sectionId
                ? 'bg-blue-50 text-blue-600'
                : 'hover:bg-gray-50 text-gray-600'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}