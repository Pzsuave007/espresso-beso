import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useCart } from '../App';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

export default function CustomizePage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API}/menu/${productId}`);
        const item = res.data;
        setProduct(item);
        
        // Initialize with default options
        const defaults = {};
        item.customizations?.forEach(c => {
          if (c.default) {
            defaults[c.name] = c.default;
          } else if (c.options?.length > 0) {
            defaults[c.name] = c.options[0];
          }
        });
        setSelectedOptions(defaults);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const calculatePrice = () => {
    if (!product) return 0;
    let price = product.price;
    product.customizations?.forEach(c => {
      const selected = selectedOptions[c.name];
      if (selected && c.price_modifier && c.price_modifier[selected]) {
        price += c.price_modifier[selected];
      }
    });
    return price;
  };

  const handleAddToCart = () => {
    const unitPrice = calculatePrice();
    const item = {
      menu_item_id: product.id,
      menu_item_name: product.name,
      quantity: quantity,
      unit_price: unitPrice,
      customizations: selectedOptions,
      item_total: unitPrice * quantity,
    };
    addToCart(item);
    navigate('/menu');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full rounded-2xl mb-6" />
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-6 w-full mb-8" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-serif text-espresso mb-4">Product not found</h2>
          <Button onClick={() => navigate('/menu')} className="bg-burgundy text-white rounded-full">
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream" data-testid="customize-page">
      {/* Header */}
      <div className="sticky top-0 bg-cream/95 backdrop-blur-sm z-10 border-b border-cream-dark">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-cream-dark rounded-full transition-colors"
            data-testid="back-button"
          >
            <ArrowLeft className="w-6 h-6 text-espresso" />
          </button>
          <h1 className="font-serif text-xl text-espresso">Customize Order</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Product Image */}
        <div className="rounded-2xl overflow-hidden mb-6 shadow-lg">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800'}
            alt={product.name}
            className="w-full h-64 md:h-80 object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-2">
            <h2 className="font-serif text-3xl text-espresso">{product.name}</h2>
            <span className="text-2xl font-bold text-gold">${product.price.toFixed(2)}</span>
          </div>
          <span className="badge-gold text-sm mb-3 inline-block">{product.category}</span>
          <p className="text-espresso/70">{product.description}</p>
        </div>

        {/* Customizations */}
        <div className="space-y-6 mb-8">
          {product.customizations?.map((customization) => (
            <div key={customization.name} className="bg-white rounded-2xl p-5 shadow-sm">
              <label className="text-sm font-semibold text-espresso uppercase tracking-wide mb-3 block">
                {customization.name}
              </label>
              <div className="flex flex-wrap gap-2">
                {customization.options.map((option) => {
                  const modifier = customization.price_modifier?.[option];
                  const isSelected = selectedOptions[customization.name] === option;
                  return (
                    <button
                      key={option}
                      onClick={() => setSelectedOptions(prev => ({ ...prev, [customization.name]: option }))}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? 'bg-burgundy text-white shadow-md'
                          : 'bg-cream text-espresso hover:bg-cream-dark'
                      }`}
                      data-testid={`option-${customization.name}-${option}`}
                    >
                      {option}
                      {modifier && modifier !== 0 && (
                        <span className={`ml-2 text-xs ${isSelected ? 'text-white/80' : 'text-espresso/60'}`}>
                          {modifier > 0 ? `+$${modifier.toFixed(2)}` : `-$${Math.abs(modifier).toFixed(2)}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="text-sm font-semibold text-espresso uppercase tracking-wide mb-3 block">
              Quantity
            </label>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-full bg-cream hover:bg-cream-dark flex items-center justify-center transition-colors"
                data-testid="qty-decrease"
              >
                <Minus className="w-5 h-5 text-espresso" />
              </button>
              <span className="text-3xl font-bold text-espresso w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-full bg-cream hover:bg-cream-dark flex items-center justify-center transition-colors"
                data-testid="qty-increase"
              >
                <Plus className="w-5 h-5 text-espresso" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-white border-t border-cream-dark shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-espresso/70">Total</span>
            <span className="text-3xl font-bold text-gold">${(calculatePrice() * quantity).toFixed(2)}</span>
          </div>
          <Button
            onClick={handleAddToCart}
            className="w-full bg-burgundy hover:bg-burgundy-dark text-white rounded-full py-6 text-lg font-semibold"
            data-testid="confirm-add-to-cart"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add to Order
          </Button>
        </div>
      </div>
    </div>
  );
}
