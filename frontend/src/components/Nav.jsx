import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { HomeIcon, ChartBarIcon, CogIcon, ArrowRightOnRectangleIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function Nav() {
  const { user, logout } = useContext(AuthContext);

  const links = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon },
    { name: 'Insights', href: '/insights', icon: SparklesIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ];

  // --- START OF THE CHANGE ---
  // The outer div's classes are simplified. We remove `fixed`, `bottom-0`, and `z-10`
  // for the mobile view. The parent in App.jsx now controls its position.
  return (
    <div className="w-full border-t bg-white md:relative md:flex md:h-full md:w-64 md:flex-col md:border-r md:border-t-0">
      <div className="flex grow flex-col justify-between md:p-4">
        {/* Top section with title and links */}
        <div>
          <div className="hidden md:block mb-6 pt-4">
            <h2 className="text-2xl font-bold text-center text-primary">BudgetApp</h2>
          </div>
          <div className="flex justify-around p-1 md:flex-col md:gap-2 md:p-0">
            {links.map((link) => (
              <NavLink 
                to={link.href} 
                key={link.name} 
                className={({ isActive }) =>
                  `flex flex-col items-center p-2 transition-colors w-16 md:w-full md:flex-row md:gap-3 md:rounded-lg md:px-3 md:py-2 ${
                    isActive ? 'text-primary md:bg-gray-200' : 'text-gray-600 hover:text-primary md:hover:bg-gray-100'
                  }`
                }
                end={link.href === '/'}
              >
                <link.icon className="h-6 w-6 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm font-medium">{link.name}</span>
              </NavLink>
            ))}
            
            {/* Mobile Logout Button */}
            <button
              onClick={logout}
              className="flex flex-col items-center p-2 text-gray-600 transition-colors hover:text-primary w-16 md:hidden"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
              <span className="text-xs">Logout</span>
            </button>
          </div>
        </div>
        
        {/* Desktop User Profile and Logout Section */}
        <div className="hidden md:block border-t pt-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm overflow-hidden">
              <p className="font-medium text-gray-800">Signed in as</p>
              <p className="text-gray-600 truncate" title={user?.email}>{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  // --- END OF THE CHANGE ---
}