import { Link, useLocation } from 'react-router-dom';
import { Home, Coffee, ShoppingBag, Users, MapPin } from 'lucide-react';
import { useCart } from '../App';

export default function BottomNav() {
  const location = useLocation();
  const { cartCount } = useCart();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/live', icon: MapPin, label: 'Live' },
    { path: '/menu', icon: Coffee, label: 'Menu' },
    { path: '/cart', icon: ShoppingBag, label: 'Cart', badge: cartCount },
    { path: '/group-request', icon: Users, label: 'Groups' },
  ];

  return (
    <nav className="bottom-nav md:hidden" data-testid="bottom-nav">
      <div className="flex justify-around items-center">
        {navItems.map(({ path, icon: Icon, label, badge }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              data-testid={`bottom-nav-${label.toLowerCase()}`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badge > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-burgundy text-white text-[10px] rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
