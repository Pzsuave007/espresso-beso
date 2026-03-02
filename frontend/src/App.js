import { useEffect, useState, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";

// Pages
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import CustomizePage from "./pages/CustomizePage";
import CartPage from "./pages/CartPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import GroupRequestPage from "./pages/GroupRequestPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import TrackerPage from "./pages/TrackerPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";

// Components
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Cart Context
export const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Auth Context
export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Zone Context
export const ZoneContext = createContext();

export const useZone = () => {
  const context = useContext(ZoneContext);
  if (!context) {
    throw new Error('useZone must be used within a ZoneProvider');
  }
  return context;
};

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isTrackerRoute = location.pathname === '/tracker';
  const showNavigation = !isAdminRoute && !isTrackerRoute;

  return (
    <div className="min-h-screen bg-cream">
      {showNavigation && <Header />}
      <main className={showNavigation ? "pb-24 md:pb-8" : ""}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/track" element={<OrderTrackingPage />} />
          <Route path="/track/:orderId" element={<OrderTrackingPage />} />
          <Route path="/order/:orderId" element={<OrderTrackingPage />} />
          <Route path="/group-request" element={<GroupRequestPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/tracker" element={<TrackerPage />} />
        </Routes>
      </main>
      {showNavigation && <BottomNav />}
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#F5F0E1',
            border: '1px solid #E6DCC3',
            color: '#1A1A1A',
          },
        }}
      />
    </div>
  );
}

function App() {
  // Cart state with localStorage persistence
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('espresso_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedZone, setSelectedZone] = useState(() => {
    const saved = localStorage.getItem('espresso_zone');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedTimeWindow, setSelectedTimeWindow] = useState(() => {
    const saved = localStorage.getItem('espresso_time_window');
    return saved ? JSON.parse(saved) : null;
  });

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('espresso_cart', JSON.stringify(cart));
  }, [cart]);

  // Persist zone selection to localStorage
  useEffect(() => {
    if (selectedZone) {
      localStorage.setItem('espresso_zone', JSON.stringify(selectedZone));
    }
  }, [selectedZone]);

  // Persist time window to localStorage
  useEffect(() => {
    if (selectedTimeWindow) {
      localStorage.setItem('espresso_time_window', JSON.stringify(selectedTimeWindow));
    }
  }, [selectedTimeWindow]);
  
  // Auth state
  const [token, setToken] = useState(() => localStorage.getItem('espresso_token'));
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('espresso_admin');
    return stored ? JSON.parse(stored) : null;
  });

  // Zone state
  const [zones, setZones] = useState([]);
  const [vanLocation, setVanLocation] = useState(null);

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Seed data if needed
        await axios.post(`${API}/seed`);
        
        // Load zones
        const zonesRes = await axios.get(`${API}/zones/active`);
        setZones(zonesRes.data);
        
        // Load van location
        const locationRes = await axios.get(`${API}/van-location`);
        setVanLocation(locationRes.data);
      } catch (e) {
        console.error('Error initializing data:', e);
      }
    };
    
    initializeData();
  }, []);

  // Cart functions
  const addToCart = (item) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        i => i.menu_item_id === item.menu_item_id && 
        JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        updated[existingIndex].item_total = updated[existingIndex].quantity * updated[existingIndex].unit_price;
        return updated;
      }
      
      return [...prev, item];
    });
    toast.success('Added to cart');
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartQuantity = (index, quantity) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    setCart(prev => {
      const updated = [...prev];
      updated[index].quantity = quantity;
      updated[index].item_total = quantity * updated[index].unit_price;
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('espresso_cart');
    localStorage.removeItem('espresso_zone');
    localStorage.removeItem('espresso_time_window');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.item_total, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Auth functions
  const login = (newToken, adminData) => {
    setToken(newToken);
    setAdmin(adminData);
    localStorage.setItem('espresso_token', newToken);
    localStorage.setItem('espresso_admin', JSON.stringify(adminData));
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('espresso_token');
    localStorage.removeItem('espresso_admin');
  };

  return (
    <AuthContext.Provider value={{ token, admin, login, logout, isAuthenticated: !!token }}>
      <ZoneContext.Provider value={{ zones, setZones, vanLocation, setVanLocation, selectedZone, setSelectedZone, selectedTimeWindow, setSelectedTimeWindow }}>
        <CartContext.Provider value={{ 
          cart, 
          addToCart, 
          removeFromCart, 
          updateCartQuantity, 
          clearCart, 
          cartTotal, 
          cartCount 
        }}>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </CartContext.Provider>
      </ZoneContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
