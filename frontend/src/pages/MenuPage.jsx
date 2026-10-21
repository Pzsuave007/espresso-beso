import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API, useShopStatus } from '../App';
import ProductCard from '../components/ProductCard';
import { Skeleton } from '../components/ui/skeleton';
import { Coffee, Search, Clock, CalendarPlus } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { shopStatus } = useShopStatus();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const menuRes = await axios.get(`${API}/menu/available`);
        const items = menuRes.data;
        setMenuItems(items);
        
        // Only show categories that have available items
        const availableCategories = [...new Set(items.map(item => item.category))];
        setCategories(['All', ...availableCategories]);
      } catch (error) {
        console.error('Error fetching menu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="page-container" data-testid="menu-page">
      {shopStatus.is_online ? (
        <div className="bg-green-500 text-white py-2 px-4 text-center text-sm" data-testid="menu-online-banner">
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            We're Online - Order Now!
          </span>
        </div>
      ) : (
        <div className="bg-espresso text-cream px-4 py-4" data-testid="menu-offline-banner">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gold flex-shrink-0" />
              <p className="text-sm md:text-base">
                <span className="font-semibold">We're Offline:</span> browse our menu — ordering opens when we're online.
              </p>
            </div>
            <Link to="/book-event" data-testid="menu-offline-book-event-link">
              <Button className="bg-gold hover:bg-gold-light text-espresso rounded-full px-6 gap-2 font-semibold">
                <CalendarPlus className="w-4 h-4" />
                Book an Event
              </Button>
            </Link>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white border-b border-cream-dark">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="section-title flex items-center gap-3">
                <Coffee className="w-8 h-8 text-gold" />
                Our Menu
              </h1>
              <p className="text-espresso/70 mt-2">Handcrafted with love, delivered with speed</p>
            </div>
            
            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-espresso/40" />
              <Input
                type="text"
                placeholder="Search drinks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-cream border-none rounded-full"
                data-testid="menu-search"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-gold text-white'
                    : 'bg-cream text-espresso hover:bg-cream-dark'
                }`}
                data-testid={`category-${category}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Coffee className="w-16 h-16 text-espresso/30 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-espresso mb-2">No drinks found</h3>
            <p className="text-espresso/60">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <div 
                key={item.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ProductCard product={item} canOrder={shopStatus.is_online} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
