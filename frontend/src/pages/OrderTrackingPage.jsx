import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import axios from 'axios';
import { Coffee, MapPin, Clock, CheckCircle, XCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Status step component
const StatusStep = ({ status, currentStatus, label, icon: Icon }) => {
  const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
  const currentIdx = statusOrder.indexOf(currentStatus);
  const stepIdx = statusOrder.indexOf(status);
  
  const isActive = currentStatus === status;
  const isCompleted = stepIdx < currentIdx;
  const isCancelled = currentStatus === 'cancelled';
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
      isActive ? 'bg-gold/20 border-2 border-gold' :
      isCompleted ? 'bg-green-50 border border-green-200' :
      isCancelled ? 'bg-red-50 border border-red-200 opacity-50' :
      'bg-gray-50 border border-gray-200 opacity-50'
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        isActive ? 'bg-gold text-white' :
        isCompleted ? 'bg-green-500 text-white' :
        'bg-gray-300 text-gray-500'
      }`}>
        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
      </div>
      <div>
        <p className={`font-medium ${isActive ? 'text-gold' : isCompleted ? 'text-green-700' : 'text-gray-500'}`}>
          {label}
        </p>
        {isActive && (
          <p className="text-xs text-gold/70 animate-pulse">Current status</p>
        )}
      </div>
    </div>
  );
};

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const [inputOrderId, setInputOrderId] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(10);

  // Fetch order status
  const fetchOrderStatus = async (id, silent = false) => {
    if (!id) return;
    
    if (!silent) setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API}/orders/track/${id}`);
      setTrackingData(response.data);
      setLastUpdated(new Date());
      setAutoRefreshCountdown(10);
    } catch (err) {
      console.error('Error fetching order:', err);
      if (!silent) {
        setError(err.response?.data?.detail || 'Order not found. Please check your order number.');
        setTrackingData(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Auto-fetch if orderId is in URL
  useEffect(() => {
    if (orderId) {
      fetchOrderStatus(orderId);
    }
  }, [orderId]);

  // Auto-refresh every 10 seconds for active orders
  useEffect(() => {
    if (trackingData && !['completed', 'cancelled'].includes(trackingData.status)) {
      const interval = setInterval(() => {
        fetchOrderStatus(orderId || inputOrderId, true);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [trackingData, orderId, inputOrderId]);

  // Countdown timer for visual feedback
  useEffect(() => {
    if (trackingData && !['completed', 'cancelled'].includes(trackingData.status)) {
      const countdownInterval = setInterval(() => {
        setAutoRefreshCountdown(prev => prev > 0 ? prev - 1 : 10);
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    }
  }, [trackingData]);

  // Handle manual search
  const handleSearch = (e) => {
    e.preventDefault();
    if (inputOrderId.trim()) {
      fetchOrderStatus(inputOrderId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white">
      {/* Header */}
      <header className="bg-espresso text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-xl font-bold">Track Your Order</h1>
            <p className="text-cream/70 text-sm">Real-time order status</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Search Box (if no orderId in URL) */}
        {!orderId && (
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="font-semibold text-espresso mb-4">Enter Your Order Number</h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                placeholder="e.g., ABC12345"
                value={inputOrderId}
                onChange={(e) => setInputOrderId(e.target.value.toUpperCase())}
                className="flex-1 uppercase"
                data-testid="order-id-input"
              />
              <Button type="submit" className="bg-gold hover:bg-gold-dark text-white" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Track'}
              </Button>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && !trackingData && (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
            <p className="text-espresso/70">Finding your order...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-700 font-medium">{error}</p>
            <p className="text-red-500 text-sm mt-2">Please check your order number and try again.</p>
          </div>
        )}

        {/* Tracking Data */}
        {trackingData && (
          <>
            {/* Van Coming To Me - Special Alert */}
            {trackingData.van_coming_to_me && (
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white text-center animate-pulse">
                <div className="text-4xl mb-2">🚐</div>
                <h2 className="font-serif text-2xl font-bold">On the way to YOU!</h2>
                <p className="text-blue-100 mt-2">The van is heading to your location right now!</p>
              </div>
            )}

            {/* Order Header */}
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className={`p-6 ${
                trackingData.van_coming_to_me ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                trackingData.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                trackingData.status === 'cancelled' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                trackingData.status === 'ready' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                'bg-gradient-to-r from-gold to-gold-dark'
              } text-white`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 text-sm">Order #{trackingData.order_id?.slice(0, 8).toUpperCase()}</p>
                    <h2 className="font-serif text-2xl font-bold mt-1">
                      {trackingData.van_coming_to_me ? '🚐 Almost There!' :
                       trackingData.status === 'completed' ? '✅ Order Complete!' :
                       trackingData.status === 'cancelled' ? '❌ Order Cancelled' :
                       trackingData.status === 'ready' ? '🎉 Ready for Pickup!' :
                       `Hi, ${trackingData.customer_name}!`}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">${trackingData.total?.toFixed(2)}</p>
                    <p className="text-white/80 text-sm">{trackingData.items_count} drinks</p>
                  </div>
                </div>
              </div>

              {/* Queue Position & ETA */}
              {!['completed', 'cancelled'].includes(trackingData.status) && (
                <div className="p-6 bg-cream/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white rounded-xl">
                      <p className="text-espresso/60 text-xs mb-1">Queue Position</p>
                      <p className="text-4xl font-bold text-gold">#{trackingData.queue_position}</p>
                      <p className="text-xs text-espresso/50">of {trackingData.total_in_queue} orders</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl">
                      <p className="text-espresso/60 text-xs mb-1">Estimated Wait</p>
                      <p className="text-4xl font-bold text-burgundy">{trackingData.estimated_wait || '...'}</p>
                      <p className="text-xs text-espresso/50">
                        {trackingData.order_type === 'delivery' ? 'until arrival' : 'until ready'}
                      </p>
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className="mt-4 p-4 bg-gold/10 rounded-xl border border-gold/30">
                    <p className="text-espresso font-medium text-center">
                      {trackingData.message}
                    </p>
                  </div>

                  {/* Delivery Info */}
                  {trackingData.order_type === 'delivery' && trackingData.distance_miles && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-espresso/70">
                      <MapPin className="w-4 h-4" />
                      <span>Van is approximately {trackingData.distance_miles} miles away</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Steps */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="font-semibold text-espresso mb-4">Order Progress</h3>
              <div className="space-y-3">
                <StatusStep 
                  status="pending" 
                  currentStatus={trackingData.status} 
                  label="Order Received" 
                  icon={Clock}
                />
                <StatusStep 
                  status="confirmed" 
                  currentStatus={trackingData.status} 
                  label="Order Confirmed" 
                  icon={CheckCircle}
                />
                <StatusStep 
                  status="preparing" 
                  currentStatus={trackingData.status} 
                  label="Making Your Drinks" 
                  icon={Coffee}
                />
                <StatusStep 
                  status="ready" 
                  currentStatus={trackingData.status} 
                  label={trackingData.order_type === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup'}
                  icon={MapPin}
                />
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="font-semibold text-espresso mb-4">Your Order</h3>
              <div className="space-y-4">
                {trackingData.items?.map((item, idx) => (
                  <div key={idx} className="py-3 border-b border-cream last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center text-gold font-bold text-sm flex-shrink-0 mt-1">
                          {item.qty}
                        </span>
                        <div>
                          <span className="text-espresso font-medium">{item.name}</span>
                          {/* Show customizations */}
                          {item.customizations && Object.keys(item.customizations).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {Object.entries(item.customizations).map(([key, value]) => (
                                <span 
                                  key={key} 
                                  className="text-xs bg-cream px-2 py-1 rounded-full text-espresso/70"
                                >
                                  {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {item.unit_price && (
                        <span className="text-espresso/70 text-sm">
                          ${(item.unit_price * item.qty).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Order Total */}
              <div className="mt-4 pt-4 border-t border-cream flex justify-between items-center">
                <span className="font-medium text-espresso">Total</span>
                <span className="font-bold text-gold text-lg">${trackingData.total?.toFixed(2)}</span>
              </div>
            </div>

            {/* Auto-Refresh Indicator */}
            {!['completed', 'cancelled'].includes(trackingData.status) && (
              <div className="bg-white rounded-2xl shadow-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full border-4 border-cream flex items-center justify-center">
                        <span className="text-sm font-bold text-gold">{autoRefreshCountdown}</span>
                      </div>
                      <div 
                        className="absolute inset-0 rounded-full border-4 border-gold border-t-transparent animate-spin"
                        style={{ animationDuration: '10s', animationTimingFunction: 'linear' }}
                      ></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-espresso">Auto-updating</p>
                      <p className="text-xs text-espresso/50">
                        {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Watching for changes...'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchOrderStatus(orderId || inputOrderId)}
                    disabled={loading}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            )}

            {/* Completed Order Actions */}
            {trackingData.status === 'completed' && (
              <div className="text-center space-y-3">
                <p className="text-espresso/70">Thank you for your order! ☕</p>
                <Link to="/menu">
                  <Button className="bg-gold hover:bg-gold-dark text-white gap-2">
                    <Coffee className="w-4 h-4" />
                    Order Again
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}

        {/* Help Text */}
        <div className="text-center text-sm text-espresso/50">
          <p>Questions? Call us or check back here for updates!</p>
        </div>
      </main>
    </div>
  );
}
