import { useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { useCart } from '../App';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

export default function ProductCard({ product }) {
  const [showCustomization, setShowCustomization] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const { addToCart } = useCart();

  const handleOpenCustomization = () => {
    // Initialize with default options
    const defaults = {};
    product.customizations?.forEach(c => {
      if (c.default) {
        defaults[c.name] = c.default;
      } else if (c.options.length > 0) {
        defaults[c.name] = c.options[0];
      }
    });
    setSelectedOptions(defaults);
    setQuantity(1);
    setShowCustomization(true);
  };

  const calculatePrice = () => {
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
    setShowCustomization(false);
  };

  return (
    <>
      <div className="product-card" data-testid={`product-${product.id}`}>
        {/* Image */}
        <div className="relative overflow-hidden">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'}
            alt={product.name}
            className="product-card-image"
          />
          {!product.is_available && (
            <div className="absolute inset-0 bg-espresso/50 flex items-center justify-center">
              <span className="text-white font-medium">Sold Out</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-serif text-lg font-semibold text-espresso">{product.name}</h3>
              <span className="badge-gold text-xs">{product.category}</span>
            </div>
            <span className="price-tag">${product.price.toFixed(2)}</span>
          </div>
          
          <p className="text-sm text-espresso/70 mb-4 line-clamp-2">{product.description}</p>
          
          <Button
            onClick={handleOpenCustomization}
            disabled={!product.is_available}
            className="w-full bg-burgundy hover:bg-burgundy-dark text-white rounded-full"
            data-testid={`add-to-cart-${product.id}`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add to Order
          </Button>
        </div>
      </div>

      {/* Customization Dialog - Full Screen on Mobile */}
      <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
        <DialogContent className="bg-cream max-w-md mx-auto max-h-[90vh] overflow-y-auto p-0 sm:rounded-2xl">
          {/* Sticky Header */}
          <div className="sticky top-0 bg-cream z-10 px-6 pt-6 pb-4 border-b border-cream-dark">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-espresso">{product.name}</DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6 space-y-6">
            {/* Product Image */}
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'}
              alt={product.name}
              className="w-full h-48 object-cover rounded-xl"
            />

            {/* Customizations */}
            {product.customizations?.map((customization) => (
              <div key={customization.name} className="space-y-2">
                <label className="text-sm font-medium text-espresso">
                  {customization.name}
                </label>
                <div className="flex flex-wrap gap-2">
                  {customization.options.map((option) => {
                    const modifier = customization.price_modifier?.[option];
                    return (
                      <button
                        key={option}
                        onClick={() => setSelectedOptions(prev => ({ ...prev, [customization.name]: option }))}
                        className={`customization-option ${selectedOptions[customization.name] === option ? 'selected' : ''}`}
                        data-testid={`option-${customization.name}-${option}`}
                      >
                        {option}
                        {modifier && modifier !== 0 && (
                          <span className="ml-1 text-xs opacity-70">
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-espresso">Quantity</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="qty-btn"
                  data-testid="qty-decrease"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl font-semibold text-espresso w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="qty-btn"
                  data-testid="qty-increase"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Footer with Total & Add Button */}
          <div className="sticky bottom-0 bg-cream px-6 py-4 border-t border-cream-dark">
            <div className="flex justify-between items-center mb-3">
              <span className="text-espresso/70">Total</span>
              <span className="price-tag text-2xl">${(calculatePrice() * quantity).toFixed(2)}</span>
            </div>
            <Button
              onClick={handleAddToCart}
              className="w-full bg-burgundy hover:bg-burgundy-dark text-white rounded-full py-6 text-lg"
              data-testid="confirm-add-to-cart"
            >
              Add to Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
