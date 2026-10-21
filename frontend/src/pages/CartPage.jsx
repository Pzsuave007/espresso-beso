import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API, useCart, useShopStatus } from '../App';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, CreditCard, Copy, Check, ExternalLink, MapPin, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

// Manual Payment options (when card checkout not used)
const MANUAL_PAYMENT_OPTIONS = {
  venmo: {
    name: 'Venmo',
    username: '@Paul-Zacapantzi',
    color: '#008CFF',
    bgColor: '#E8F4FD',
    getLink: (amount) => `https://venmo.com/u/Paul-Zacapantzi`,
    icon: '💙'
  },
  cashapp: {
    name: 'Cash App',
    username: '$PZsuave',
    color: '#00D632',
    bgColor: '#E8F9ED',
    getLink: (amount) => `https://cash.app/$PZsuave/${amount}`,
    icon: '💚'
  },
  zelle: {
    name: 'Zelle',
    username: '971-227-0595',
    displayName: 'Paul Zacapantzi',
    color: '#6D1ED4',
    bgColor: '#F3EAFD',
    getLink: null,
    icon: '💜'
  },
  cash: {
    name: 'Cash',
    username: 'Pay at pickup',
    color: '#059669',
    bgColor: '#D1FAE5',
    getLink: null,
    icon: '💵'
  }
};

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateCartQuantity, clearCart, cartTotal } = useCart();
  const { shopStatus } = useShopStatus();
  const [step, setStep] = useState(1); // 1: Cart, 2: Customer Info, 3: Payment
  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    pickup_instructions: ''
  });
  const [orderType, setOrderType] = useState('at_location'); // 'at_location' or 'delivery'
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [vanLocation, setVanLocation] = useState(null);
  const [vanMode, setVanMode] = useState('mobile'); // mobile or stationary
  const [stationaryLocationName, setStationaryLocationName] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [distanceFromVan, setDistanceFromVan] = useState(null);
  const [checkingLocation, setCheckingLocation] = useState(false);

  const tax = cartTotal * 0.09;
  const total = cartTotal + tax;
  const totalDrinks = cart.reduce((sum, item) => sum + item.quantity, 0);
  const MINIMUM_DRINKS_FOR_DELIVERY = 5;
  const MAX_DISTANCE_NO_MINIMUM = 3; // miles

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Check customer's distance from van
  const checkLocationRequirements = async () => {
    setCheckingLocation(true);
    try {
      // Get van's current location
      const vanRes = await axios.get(`${API}/van-location`);
      const van = vanRes.data;
      setVanLocation(van);
      setVanMode(van.mode || 'mobile');
      setStationaryLocationName(van.stationary_location_name || null);

      // Try to get customer's location via browser
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const custLoc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCustomerLocation(custLoc);
            
            if (van && van.lat && van.lng) {
              const dist = calculateDistance(custLoc.lat, custLoc.lng, van.lat, van.lng);
              setDistanceFromVan(dist);
            }
            setCheckingLocation(false);
          },
          (error) => {
            console.log('Geolocation error:', error);
            // If geolocation fails, assume they're far away (require minimum)
            setDistanceFromVan(999);
            setCheckingLocation(false);
          },
          { timeout: 10000 }
        );
      } else {
        setDistanceFromVan(999);
        setCheckingLocation(false);
      }
    } catch (error) {
      console.error('Error checking location:', error);
      setDistanceFromVan(999);
      setCheckingLocation(false);
    }
  };

  // Fetch van mode on step 2 load
  useEffect(() => {
    if (step === 2) {
      const fetchVanMode = async () => {
        try {
          const vanRes = await axios.get(`${API}/van-location`);
          const van = vanRes.data;
          setVanMode(van.mode || 'mobile');
          setStationaryLocationName(van.stationary_location_name || null);
        } catch (error) {
          console.error('Error fetching van mode:', error);
        }
      };
      fetchVanMode();
    }
  }, [step]);

  // Check if delivery order meets requirements
  const meetsDeliveryRequirements = () => {
    if (orderType !== 'delivery') return true;
    if (distanceFromVan === null) return true; // Haven't checked yet
    if (distanceFromVan <= MAX_DISTANCE_NO_MINIMUM) return true; // Within 3 miles
    return totalDrinks >= MINIMUM_DRINKS_FOR_DELIVERY; // Need 5+ drinks
  };

  const formatCustomizations = (customizations) => {
    return Object.entries(customizations)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleProceedToPayment = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error('Please fill in your name and phone number');
      return;
    }

    if (orderType === 'delivery' && !customerInfo.address) {
      toast.error('Please enter your address so we can come to you');
      return;
    }

    // Check delivery minimum requirements
    if (orderType === 'delivery' && !meetsDeliveryRequirements()) {
      toast.error(`You need at least ${MINIMUM_DRINKS_FOR_DELIVERY} drinks for delivery when you're more than ${MAX_DISTANCE_NO_MINIMUM} miles away`);
      return;
    }

    // Don't create order yet - just move to payment step
    // Order will be created based on payment method chosen
    setStep(3);
  };

  // Create order for manual payments (Cash, Venmo, Zelle)
  const createManualPaymentOrder = async (paymentMethod) => {
    setLoading(true);
    try {
      const customerData = {
        ...customerInfo,
        email: customerInfo.email && customerInfo.email.includes('@') ? customerInfo.email : null
      };
      
      const orderData = {
        customer_info: customerData,
        items: cart,
        order_type: orderType,
        delivery_address: orderType === 'delivery' ? customerInfo.address : null,
        payment_status: 'pending',
        payment_method: paymentMethod
      };

      const orderRes = await axios.post(`${API}/orders`, orderData);
      setOrderId(orderRes.data.id);
      return orderRes.data.id;
    } catch (error) {
      console.error('Order error:', error);
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' 
        ? detail 
        : Array.isArray(detail) 
          ? detail.map(e => e.msg).join(', ')
          : 'Failed to create order';
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentClick = (paymentKey) => {
    const payment = MANUAL_PAYMENT_OPTIONS[paymentKey];
    setSelectedPayment(paymentKey);
    
    if (payment && payment.getLink) {
      // Open payment app/link
      window.open(payment.getLink(total.toFixed(2)), '_blank');
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) {
      toast.error('Please select a payment method');
      return;
    }

    setLoading(true);
    try {
      // Create order with the selected payment method
      const newOrderId = await createManualPaymentOrder(selectedPayment);
      if (!newOrderId) {
        return; // Error already shown by createManualPaymentOrder
      }

      clearCart();
      navigate(`/order-success?order_id=${newOrderId}&payment_method=${selectedPayment}`);
    } catch (error) {
      console.error('Payment confirmation error:', error);
      toast.error('Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    handleProceedToPayment();
  };

  if (!shopStatus.is_online && cart.length > 0) {
    return (
      <div className="page-container" data-testid="cart-page-offline">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Clock className="w-20 h-20 text-espresso/30 mx-auto mb-6" />
          <h1 className="font-serif text-3xl text-espresso mb-4">We're Currently Offline</h1>
          <p className="text-espresso/70 mb-8">
            Your cart is saved. Ordering opens as soon as we're back online.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/menu" data-testid="cart-offline-menu-link">
              <Button variant="outline" className="rounded-full px-8 py-6 text-lg w-full sm:w-auto">Browse Menu</Button>
            </Link>
            <Link to="/book-event" data-testid="cart-offline-book-event-link">
              <Button className="bg-burgundy hover:bg-burgundy-dark text-white rounded-full px-8 py-6 text-lg w-full sm:w-auto">Book an Event</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="page-container" data-testid="cart-page-empty">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-20 h-20 text-espresso/30 mx-auto mb-6" />
          <h1 className="font-serif text-3xl text-espresso mb-4">Your Cart is Empty</h1>
          <p className="text-espresso/70 mb-8">
            Looks like you haven't added any drinks yet. Browse our menu to find your perfect coffee.
          </p>
          <Link to="/menu">
            <Button className="bg-burgundy hover:bg-burgundy-dark text-white rounded-full px-8 py-6 text-lg">
              Browse Menu
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" data-testid="cart-page">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto">
          {['Cart', 'Details', 'Pay'].map((label, index) => (
            <div key={label} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step > index + 1 
                    ? 'bg-gold text-white' 
                    : step === index + 1 
                      ? 'bg-burgundy text-white' 
                      : 'bg-cream-dark text-espresso/50'
                }`}
              >
                {index + 1}
              </div>
              <span className={`ml-2 text-sm font-medium hidden sm:block ${step === index + 1 ? 'text-espresso' : 'text-espresso/50'}`}>
                {label}
              </span>
              {index < 2 && <div className="w-6 md:w-12 h-px bg-cream-dark mx-2 md:mx-4" />}
            </div>
          ))}
        </div>

        {/* Step 1: Cart Items */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="section-title">Your Order</h1>
            
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              {cart.map((item, index) => (
                <div key={index} className="cart-item" data-testid={`cart-item-${index}`}>
                  <div className="flex-1">
                    <h3 className="font-serif font-semibold text-espresso">{item.menu_item_name}</h3>
                    {Object.keys(item.customizations).length > 0 && (
                      <p className="text-sm text-espresso/60 mt-1">
                        {formatCustomizations(item.customizations)}
                      </p>
                    )}
                    <p className="text-gold font-semibold mt-2">${item.unit_price.toFixed(2)} each</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateCartQuantity(index, item.quantity - 1)}
                      className="qty-btn"
                      data-testid={`cart-qty-decrease-${index}`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(index, item.quantity + 1)}
                      className="qty-btn"
                      data-testid={`cart-qty-increase-${index}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-serif text-lg font-semibold text-espresso">
                      ${item.item_total.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="p-2 text-espresso/50 hover:text-burgundy transition-colors"
                      data-testid={`cart-remove-${index}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="font-serif text-lg font-semibold text-espresso mb-4">Order Summary</h3>
              <div className="space-y-2 text-espresso/70">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (9%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-cream-dark text-espresso font-semibold text-lg">
                  <span>Total</span>
                  <span className="price-tag">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={clearCart}
                className="flex-1 border-espresso/20 text-espresso hover:bg-cream-dark rounded-full py-6"
                data-testid="clear-cart-btn"
              >
                Clear Cart
              </Button>
              <Button
                onClick={() => setStep(2)}
                className="flex-1 bg-burgundy hover:bg-burgundy-dark text-white rounded-full py-6"
                data-testid="continue-to-details-btn"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Customer Details */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="section-title">Your Details</h1>
            
            {/* Order Type Selection */}
            <div className="bg-white rounded-2xl shadow-card p-4">
              <p className="text-sm font-medium text-espresso mb-3">How are you ordering?</p>
              
              {/* Stationary Mode Notice */}
              {vanMode === 'stationary' && (
                <div className="mb-4 p-3 bg-burgundy/10 border border-burgundy/30 rounded-xl">
                  <div className="flex items-center gap-2 text-burgundy font-medium text-sm">
                    <span className="text-lg">📍</span>
                    We're at a fixed location today!
                  </div>
                  {stationaryLocationName && (
                    <p className="text-espresso/70 text-sm mt-1">
                      Find us at: <strong>{stationaryLocationName}</strong>
                    </p>
                  )}
                  <p className="text-espresso/60 text-xs mt-2">
                    Please come to us to pick up your order.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOrderType('at_location');
                    setDistanceFromVan(null);
                  }}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    orderType === 'at_location'
                      ? 'border-gold bg-gold/10'
                      : 'border-cream-dark hover:border-gold/50'
                  }`}
                  data-testid="order-type-at-location"
                >
                  <div className="text-2xl mb-1">📍</div>
                  <p className="font-medium text-espresso text-sm">I'm at your location</p>
                  <p className="text-xs text-espresso/60 mt-1">Event, office, etc.</p>
                </button>
                
                {/* Come to me - Disabled in Stationary mode */}
                {vanMode === 'stationary' ? (
                  <div
                    className="p-4 rounded-xl border-2 text-center border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                    data-testid="order-type-delivery-disabled"
                  >
                    <div className="text-2xl mb-1 grayscale">🚐</div>
                    <p className="font-medium text-gray-400 text-sm">Come to me</p>
                    <p className="text-xs text-gray-400 mt-1">Not available today</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('delivery');
                      checkLocationRequirements();
                    }}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      orderType === 'delivery'
                        ? 'border-gold bg-gold/10'
                        : 'border-cream-dark hover:border-gold/50'
                    }`}
                    data-testid="order-type-delivery"
                  >
                    <div className="text-2xl mb-1">🚐</div>
                    <p className="font-medium text-espresso text-sm">Come to me</p>
                    <p className="text-xs text-espresso/60 mt-1">You're nearby</p>
                  </button>
                )}
              </div>

              {/* Distance/Minimum Warning for Delivery */}
              {orderType === 'delivery' && (
                <div className="mt-4">
                  {checkingLocation ? (
                    <div className="flex items-center gap-2 text-espresso/70 text-sm">
                      <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                      Checking your location...
                    </div>
                  ) : distanceFromVan !== null && distanceFromVan > MAX_DISTANCE_NO_MINIMUM ? (
                    <div className={`p-3 rounded-xl text-sm ${
                      totalDrinks >= MINIMUM_DRINKS_FOR_DELIVERY 
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-amber-50 border border-amber-200 text-amber-800'
                    }`}>
                      {totalDrinks >= MINIMUM_DRINKS_FOR_DELIVERY ? (
                        <p>✅ You've met the {MINIMUM_DRINKS_FOR_DELIVERY}-drink minimum for delivery!</p>
                      ) : (
                        <div>
                          <p className="font-medium">⚠️ {MINIMUM_DRINKS_FOR_DELIVERY}-drink minimum required</p>
                          <p className="mt-1">You're more than 3 miles away. Add {MINIMUM_DRINKS_FOR_DELIVERY - totalDrinks} more drink{MINIMUM_DRINKS_FOR_DELIVERY - totalDrinks > 1 ? 's' : ''} to continue.</p>
                          <Link to="/menu" className="text-amber-900 underline font-medium mt-2 inline-block">
                            Add more drinks →
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : distanceFromVan !== null && distanceFromVan <= MAX_DISTANCE_NO_MINIMUM ? (
                    <div className="p-3 rounded-xl text-sm bg-green-50 border border-green-200 text-green-800">
                      ✅ You're within {MAX_DISTANCE_NO_MINIMUM} miles - no minimum order required!
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="form-label">Name *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your name"
                    className="form-input"
                    data-testid="customer-name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="form-label">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(509) 555-1234"
                    className="form-input"
                    data-testid="customer-phone"
                    required
                  />
                </div>
              </div>

              {/* Address field - only show for delivery */}
              {orderType === 'delivery' && (
                <div>
                  <Label htmlFor="address" className="form-label">
                    <MapPin className="w-4 h-4 inline mr-1 text-gold" />
                    Your Address *
                  </Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, Spokane, WA"
                    className="form-input"
                    data-testid="customer-address"
                  />
                  <p className="text-xs text-espresso/50 mt-1">We'll come to you!</p>
                </div>
              )}
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="form-label">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="form-input"
                    data-testid="customer-email"
                  />
                </div>
                <div>
                  <Label htmlFor="company" className="form-label">Company/Location (Optional)</Label>
                  <Input
                    id="company"
                    value={customerInfo.company}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Company name"
                    className="form-input"
                    data-testid="customer-company"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pickup_instructions" className="form-label">Pickup Instructions (Optional)</Label>
                <Input
                  id="pickup_instructions"
                  value={customerInfo.pickup_instructions}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, pickup_instructions: e.target.value }))}
                  placeholder="e.g., I'll be wearing a blue jacket"
                  className="form-input"
                  data-testid="customer-instructions"
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-cream-dark/50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-lg font-semibold text-espresso">
                <span>Total</span>
                <span className="price-tag">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 border-espresso/20 text-espresso hover:bg-cream-dark rounded-full py-6"
                data-testid="back-to-cart-btn"
              >
                Back
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={loading || !customerInfo.name || !customerInfo.phone}
                className="flex-1 bg-burgundy hover:bg-burgundy-dark text-white rounded-full py-6 disabled:opacity-50"
                data-testid="checkout-btn"
              >
                {loading ? 'Processing...' : 'Continue to Payment'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment Selection */}
        {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="section-title text-center">Choose Payment Method</h1>
              <p className="text-center text-espresso/70">Select how you'd like to pay</p>
              
              {/* Order Total */}
              <div className="bg-gold/10 border-2 border-gold rounded-xl p-4 text-center">
                <p className="text-espresso/70 text-sm">Order Total</p>
                <p className="text-3xl font-bold text-gold">${total.toFixed(2)}</p>
              </div>

              {/* Stripe Checkout - Credit/Debit Cards */}
              <div className="bg-white rounded-2xl shadow-card p-4">
                <p className="text-sm font-medium text-espresso mb-3 text-center">
                  💳 Pay with Credit or Debit Card
                </p>
                <p className="text-xs text-espresso/60 mb-4 text-center">
                  Secure payment via Stripe - Your order will be confirmed after payment
                </p>
                <Button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      // Create order first
                      const customerData = {
                        ...customerInfo,
                        email: customerInfo.email && customerInfo.email.includes('@') ? customerInfo.email : null
                      };
                      
                      const orderData = {
                        customer_info: customerData,
                        items: cart,
                        order_type: orderType,
                        delivery_address: orderType === 'delivery' ? customerInfo.address : null,
                        payment_status: 'awaiting_payment',
                        payment_method: 'stripe'
                      };

                      const orderRes = await axios.post(`${API}/orders`, orderData);
                      const newOrderId = orderRes.data.id;
                      
                      // Create Stripe checkout session
                      const stripeRes = await axios.post(`${API}/stripe/create-checkout`, {
                        order_id: newOrderId,
                        success_url: `${window.location.origin}/order-success?order_id=${newOrderId}&payment_method=stripe`,
                        cancel_url: `${window.location.origin}/cart`
                      });
                      
                      // Redirect to Stripe checkout
                      if (stripeRes.data.checkout_url) {
                        window.location.href = stripeRes.data.checkout_url;
                      }
                    } catch (error) {
                      console.error('Stripe checkout error:', error);
                      toast.error('Failed to start payment. Please try again.');
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-[#635BFF] hover:bg-[#5851DB] text-white rounded-full py-6 text-lg font-medium"
                >
                  {loading ? 'Processing...' : '💳 Pay with Card'}
                </Button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-cream-dark"></div>
                <span className="text-sm text-espresso/50">or pay another way</span>
                <div className="flex-1 h-px bg-cream-dark"></div>
              </div>

              {/* Other Payment Options */}
              <div className="grid gap-3">
                {Object.entries(MANUAL_PAYMENT_OPTIONS).map(([key, payment]) => (
                  <button
                    key={key}
                    onClick={() => handlePaymentClick(key)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPayment === key 
                        ? 'border-gold bg-gold/10 shadow-lg' 
                        : 'border-cream-dark bg-white hover:border-gold/50'
                    }`}
                    data-testid={`payment-${key}`}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: payment.bgColor }}
                      >
                        {payment.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-espresso text-sm">{payment.name}</span>
                          {selectedPayment === key && (
                            <Check className="w-4 h-4 text-gold" />
                          )}
                        </div>
                        <div className="text-xs text-espresso/70">
                          <span>{payment.username}</span>
                          {payment.displayName && (
                            <span className="text-espresso/50"> ({payment.displayName})</span>
                          )}
                        </div>
                      </div>
                      {payment.getLink ? (
                        <ExternalLink className="w-4 h-4 text-espresso/40" />
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(payment.username, key);
                          }}
                          className="p-2 hover:bg-cream rounded-lg"
                          title="Copy"
                        >
                          {copiedField === key ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-espresso/40" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Zelle instructions */}
                    {key === 'zelle' && selectedPayment === 'zelle' && (
                      <div className="mt-3 p-3 bg-purple-50 rounded-lg text-sm">
                        <p className="font-medium text-purple-800 mb-1">To pay with Zelle:</p>
                        <ol className="text-purple-700 space-y-1 list-decimal list-inside">
                          <li>Open your banking app</li>
                          <li>Go to "Send Money with Zelle"</li>
                          <li>Enter: <strong>971-227-0595</strong></li>
                          <li>Send <strong>${total.toFixed(2)}</strong> to Paul Zacapantzi</li>
                        </ol>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Confirm Manual Payment Button */}
              {selectedPayment && (
                <div className="space-y-3">
                  <p className="text-xs text-center text-espresso/60">
                    {selectedPayment === 'cash' 
                      ? 'Your order will be confirmed. Pay when you pick up.'
                      : 'Your order will be confirmed. We\'ll verify your payment.'}
                  </p>
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPayment(null)}
                      className="flex-1 border-espresso/20 text-espresso hover:bg-cream-dark rounded-full py-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmPayment}
                      disabled={loading}
                      className="flex-1 bg-gold hover:bg-gold-dark text-white rounded-full py-6 disabled:opacity-50"
                      data-testid="confirm-payment-btn"
                    >
                      {loading ? 'Placing Order...' : selectedPayment === 'cash' ? 'Place Order' : 'Confirm & Place Order'}
                      <Check className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Back Button */}
              {!selectedPayment && (
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="w-full border-espresso/20 text-espresso hover:bg-cream-dark rounded-full py-6"
                >
                  Back to Details
                </Button>
              )}
            </div>
        )}
      </div>
    </div>
  );
}
