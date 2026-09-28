'use client';
import { BellRing, History, Map as MapIcon } from 'lucide-react';

export default function Sidebar({ theme, activeTab, setActiveTab }) {
  // Nav config: [tab id, icon component, display label].
  // Using an array-of-arrays instead of an array-of-objects to keep the map() below terse.
  const items = [
    ['queue', BellRing, 'Live Queue'],
    ['map', MapIcon, 'Tactical Map'],
    ['history', History, 'Incident History']
  ];
  return (
    <aside className="w-[250px] bg-white border-r border-gray-200 flex flex-col z-20 shrink-0">
      {/* Logo header */}
      <div className="h-[82px] flex items-center px-5 border-b border-gray-100">
        <img src="/logo.png" alt="E-Sagip" className="w-[142px] h-auto" />
      </div>

      {/* Shows which department (fire/medical/rescue) this dispatcher console is themed for */}
      <div className="px-5 py-3 border-b border-gray-100">
        <div className={`text-[10px] uppercase tracking-wider font-bold ${theme.text}`}>{theme.label}</div>
      </div>

      {/* Nav buttons — highlights whichever tab is currently active using the theme colors */}
      <nav className="p-3 space-y-1 flex-1">
        {items.map(([id, Icon, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)} // switches the dashboard's activeTab state (lives in parent)
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === id ? `${theme.bgLight} ${theme.text}` : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-5 h-5" />{label}
          </button>
        ))}
      </nav>
    </aside>
  );
}