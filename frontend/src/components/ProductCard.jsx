import { useNavigate } from 'react-router-dom';
import { Plus, Clock } from 'lucide-react';
import { Button } from './ui/button';

export const getSizePrices = (product) => {
  const size = product.customizations?.find((c) => c.name.toLowerCase() === 'size');
  if (!size?.options?.length) return [];
  return size.options.map((opt) => ({ label: opt, price: product.price + (size.price_modifier?.[opt] || 0) }));
};

export default function ProductCard({ product, canOrder = true }) {
  const sizePrices = getSizePrices(product);
  const navigate = useNavigate();

  const handleOpenCustomization = () => {
    navigate(`/customize/${product.id}`);
  };

  return (
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
          {sizePrices.length === 0 && <span className="price-tag">${product.price.toFixed(2)}</span>}
        </div>
        {sizePrices.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3" data-testid={`size-prices-${product.id}`}>
            {sizePrices.map((s) => (
              <span key={s.label} className="inline-flex items-baseline gap-1.5 bg-cream rounded-full px-3 py-1 text-sm">
                <span className="text-espresso/70 font-medium">{s.label}</span>
                <span className="text-gold font-bold">${s.price.toFixed(2)}</span>
              </span>
            ))}
          </div>
        )}
        
        <p className="text-sm text-espresso/70 mb-4 line-clamp-2">{product.description}</p>
        
        <Button
          onClick={handleOpenCustomization}
          disabled={!product.is_available || !canOrder}
          className="w-full bg-burgundy hover:bg-burgundy-dark text-white rounded-full disabled:bg-[#8C8275] disabled:text-white disabled:opacity-100"
          data-testid={`add-to-cart-${product.id}`}
        >
          {canOrder ? <Plus className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
          {canOrder ? 'Add to Order' : 'Ordering Offline'}
        </Button>
      </div>
    </div>
  );
}
