import { Link } from 'react-router-dom';
import { ShoppingBag, Menu } from 'lucide-react';
import { useCart } from '../App';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_8eb9ed2b-80c2-447f-a8a6-53bb1c68d925/artifacts/82psuie2_Espresso-Vesso-Logo%20ready1.png";

export default function Header() {
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="header" data-testid="header">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
          <img 
            src={LOGO_URL} 
            alt="Espresso Beso" 
            className="h-16 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            to="/" 
            className="text-espresso/80 hover:text-gold transition-colors font-medium"
            data-testid="nav-home"
          >
            Home
          </Link>
          <Link 
            to="/menu" 
            className="text-espresso/80 hover:text-gold transition-colors font-medium"
            data-testid="nav-menu"
          >
            Menu
          </Link>
          <Link 
            to="/events" 
            className="text-espresso/80 hover:text-gold transition-colors font-medium"
            data-testid="nav-events"
          >
            Events
          </Link>
          <Link 
            to="/book-event" 
            className="text-espresso/80 hover:text-gold transition-colors font-medium"
            data-testid="nav-book-event"
          >
            Book Event
          </Link>
        </nav>

        {/* Cart Button */}
        <div className="flex items-center gap-4">
          <Link 
            to="/cart" 
            className="relative p-2 rounded-full hover:bg-cream-dark transition-colors"
            data-testid="cart-button"
          >
            <ShoppingBag className="w-6 h-6 text-espresso" />
            {cartCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 w-5 h-5 bg-burgundy text-white text-xs rounded-full flex items-center justify-center font-medium"
                data-testid="cart-count"
              >
                {cartCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button 
                className="p-2 rounded-full hover:bg-cream-dark transition-colors"
                data-testid="mobile-menu-button"
              >
                <Menu className="w-6 h-6 text-espresso" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-cream w-72">
              <nav className="flex flex-col gap-4 mt-8">
                <Link 
                  to="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-espresso hover:text-gold transition-colors py-2"
                  data-testid="mobile-nav-home"
                >
                  Home
                </Link>
                <Link 
                  to="/menu" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-espresso hover:text-gold transition-colors py-2"
                  data-testid="mobile-nav-menu"
                >
                  Menu
                </Link>
                <Link 
                  to="/events" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-espresso hover:text-gold transition-colors py-2"
                  data-testid="mobile-nav-events"
                >
                  Events & Catering
                </Link>
                <Link 
                  to="/book-event" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-burgundy hover:text-gold transition-colors py-2 font-semibold"
                  data-testid="mobile-nav-book-event"
                >
                  Book an Event
                </Link>
                <Link 
                  to="/cart" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-espresso hover:text-gold transition-colors py-2"
                  data-testid="mobile-nav-cart"
                >
                  Cart ({cartCount})
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
