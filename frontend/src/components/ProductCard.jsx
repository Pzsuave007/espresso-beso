import { useNavigate } from 'react-router-dom';
import { Plus, Clock } from 'lucide-react';
import { Button } from './ui/button';

export default function ProductCard({ product, canOrder = true }) {
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
          <span className="price-tag">${product.price.toFixed(2)}</span>
        </div>
        
        <p className="text-sm text-espresso/70 mb-4 line-clamp-2">{product.description}</p>
        
        <Button
          onClick={handleOpenCustomization}
          disabled={!product.is_available || !canOrder}
          className="w-full bg-burgundy hover:bg-burgundy-dark text-white rounded-full disabled:bg-espresso/40"
          data-testid={`add-to-cart-${product.id}`}
        >
          {canOrder ? <Plus className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
          {canOrder ? 'Add to Order' : 'Ordering Offline'}
        </Button>
      </div>
    </div>
  );
}
