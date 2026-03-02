import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API, useCart } from '../App';
import { CheckCircle, XCircle, Loader2, Coffee, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

const PAYMENT_NAMES = {
  paypal: 'PayPal',
  venmo: 'Venmo',
  cashapp: 'Cash App',
  zelle: 'Zelle',
  stripe: 'Card'
};

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const paymentMethod = searchParams.get('payment_method');
  const { clearCart } = useCart();
  
  const [status, setStatus] = useState('loading'); // loading, success, pending, failed
  const [order, setOrder] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [pollingCount, setPollingCount] = useState(0);

  // Fetch tracking info (queue position, ETA)
  const fetchTrackingInfo = async (id) => {
    try {
      const response = await axios.get(`${API}/orders/track/${id}`);
      setTrackingInfo(response.data);
    } catch (error) {
      console.error('Error fetching tracking info:', error);
    }
  };

  // Handle manual payment flow (Cash, Venmo, CashApp, Zelle) - runs once
  useEffect(() => {
    if (paymentMethod && orderId && paymentMethod !== 'stripe') {
      const fetchOrder = async () => {
        try {
          const orderRes = await axios.get(`${API}/orders/${orderId}`);
          setOrder(orderRes.data);
          setStatus('pending'); // Payment pending verification
          clearCart();
          // Fetch tracking info
          fetchTrackingInfo(orderId);
        } catch (error) {
          console.error('Error fetching order:', error);
          setStatus('failed');
        }
      };
      fetchOrder();
    }
  }, [orderId, paymentMethod]); // Only run when orderId or paymentMethod changes

  // Handle Stripe payment flow with polling - separate effect
  useEffect(() => {
    // Skip if this is a manual payment flow (not stripe)
    if (paymentMethod && paymentMethod !== 'stripe') {
      return;
    }
    
    // For Stripe, we use session_id
    if (!sessionId && !orderId) {
      setStatus('failed');
      return;
    }

    const checkStripePayment = async () => {
      try {
        // If we have a session ID, check Stripe directly
        if (sessionId) {
          const response = await axios.get(`${API}/stripe/session/${sessionId}`);
          
          if (response.data.payment_status === 'paid') {
            setStatus('success');
            clearCart();
            
            // Fetch order details
            const fetchOrderId = response.data.order_id || orderId;
            if (fetchOrderId) {
              const orderRes = await axios.get(`${API}/orders/${fetchOrderId}`);
              setOrder(orderRes.data);
              fetchTrackingInfo(fetchOrderId);
            }
            return true;
          } else if (response.data.status === 'expired') {
            setStatus('failed');
            return true;
          }
        } else if (orderId && paymentMethod === 'stripe') {
          // If we just have order_id with stripe payment method, fetch order directly
          const orderRes = await axios.get(`${API}/orders/${orderId}`);
          setOrder(orderRes.data);
          if (orderRes.data.payment_status === 'paid') {
            setStatus('success');
            clearCart();
            fetchTrackingInfo(orderId);
            return true;
          }
        }
        
        return false;
      } catch (error) {
        console.error('Error checking payment status:', error);
        return false;
      }
    };

    const poll = async () => {
      const complete = await checkStripePayment();
      if (!complete && pollingCount < 10) {
        setTimeout(() => {
          setPollingCount(prev => prev + 1);
        }, 2000);
      } else if (!complete) {
        // If we have an orderId with stripe, show success anyway (Stripe will update via webhook)
        if (orderId && paymentMethod === 'stripe') {
          const orderRes = await axios.get(`${API}/orders/${orderId}`);
          setOrder(orderRes.data);
          setStatus(orderRes.data.payment_status === 'paid' ? 'success' : 'pending');
          fetchTrackingInfo(orderId);
        } else {
          setStatus('failed');
        }
      }
    };

    poll();
  }, [sessionId, orderId, paymentMethod, pollingCount]); // Dependencies

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (status === 'loading') {
    return (
      <div className="page-container" data-testid="order-success-loading">
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <Loader2 className="w-16 h-16 text-gold animate-spin mx-auto mb-6" />
          <h1 className="font-serif text-2xl text-espresso mb-2">Processing Payment</h1>
          <p className="text-espresso/70">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="page-container" data-testid="order-success-failed">
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="font-serif text-2xl text-espresso mb-2">Payment Failed</h1>
          <p className="text-espresso/70 mb-8">
            We couldn't process your payment. Please try again or contact us for assistance.
          </p>
          <Link to="/cart">
            <Button className="bg-burgundy hover:bg-burgundy-dark text-white rounded-full px-8 py-6">
              Return to Cart
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Pending verification for manual payments
  if (status === 'pending') {
    return (
      <div className="page-container" data-testid="order-success-pending">
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-gold" />
          </div>
          <h1 className="font-serif text-2xl text-espresso mb-2">Order Received!</h1>
          <p className="text-espresso/70 mb-6">
            Thank you! Your order has been placed via <strong>{PAYMENT_NAMES[paymentMethod] || paymentMethod}</strong>.
          </p>

          {/* Queue Position & ETA - NEW */}
          {trackingInfo && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gold/10 rounded-xl p-4">
                <p className="text-espresso/60 text-xs mb-1">Your Position</p>
                <p className="text-4xl font-bold text-gold">#{trackingInfo.queue_position}</p>
                <p className="text-xs text-espresso/50">in queue</p>
              </div>
              <div className="bg-burgundy/10 rounded-xl p-4">
                <p className="text-espresso/60 text-xs mb-1">Estimated Wait</p>
                <p className="text-3xl font-bold text-burgundy">{trackingInfo.estimated_wait || '...'}</p>
                <p className="text-xs text-espresso/50">
                  {order?.order_type === 'delivery' ? 'until arrival' : 'until ready'}
                </p>
              </div>
            </div>
          )}

          {/* Order Info */}
          {order && (
            <div className="bg-cream rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-3 text-espresso">
                <Coffee className="w-5 h-5 text-gold" />
                <span className="font-semibold">Order #{order.id?.slice(-8).toUpperCase()}</span>
              </div>
              
              <div className="space-y-2 text-sm text-espresso/80">
                {order.order_type === 'delivery' && order.delivery_address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold" />
                    <span>Delivery to: {order.delivery_address}</span>
                  </div>
                )}
                {order.zone_name && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold" />
                    <span>{order.zone_name}</span>
                  </div>
                )}
                {order.time_window && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gold" />
                    <span>{formatTime(order.time_window.start)} - {formatTime(order.time_window.end)}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-espresso/10">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-gold">${order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800">
            <p>
              <strong>Payment Pending Verification</strong><br/>
              We'll confirm your {PAYMENT_NAMES[paymentMethod] || 'payment'} and start preparing your order shortly!
            </p>
          </div>

          {/* Track Order Button - NEW */}
          <div className="flex flex-col gap-3">
            {order && (
              <Link to={`/track/${order.id}`}>
                <Button className="w-full bg-gold hover:bg-gold-dark text-white rounded-full px-8 py-6 gap-2">
                  <MapPin className="w-5 h-5" />
                  Track Your Order
                </Button>
              </Link>
            )}
            <Link to="/">
              <Button variant="outline" className="w-full border-espresso/20 text-espresso hover:bg-cream-dark rounded-full px-8 py-6">
                Back to Home
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" data-testid="order-success-page">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 animate-fade-in">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <h1 className="font-serif text-3xl text-espresso mb-2 animate-fade-in stagger-1">
            Order Confirmed!
          </h1>
          <p className="text-espresso/70 animate-fade-in stagger-2">
            Thank you for your order. We'll have your coffee ready when you arrive!
          </p>
        </div>

        {order && (
          <div className="space-y-6 animate-fade-in stagger-3">
            {/* Order Details Card */}
            <div className="order-ticket">
              <div className="order-ticket-header">
                <div className="flex justify-between items-center">
                  <span className="font-serif text-lg font-semibold text-espresso">Order Details</span>
                  <span className="badge-gold">#{order.id.slice(0, 8)}</span>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Pickup Info */}
                <div className="flex items-start gap-3 p-3 bg-cream rounded-xl">
                  <MapPin className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-espresso">{order.zone_name}</p>
                    <p className="text-sm text-espresso/70 flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(order.time_window?.start)} - {formatTime(order.time_window?.end)}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-espresso">
                          {item.quantity}x {item.menu_item_name}
                        </p>
                        {item.customizations && Object.keys(item.customizations).length > 0 && (
                          <p className="text-sm text-espresso/60">
                            {Object.entries(item.customizations).map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="text-espresso font-medium">${item.item_total?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="pt-4 border-t border-cream-dark space-y-2">
                  <div className="flex justify-between text-espresso/70">
                    <span>Subtotal</span>
                    <span>${order.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-espresso/70">
                    <span>Tax</span>
                    <span>${order.tax?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg text-espresso">
                    <span>Total</span>
                    <span className="price-tag">${order.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="font-serif text-lg font-semibold text-espresso mb-4">Customer Details</h3>
              <div className="space-y-2 text-espresso/70">
                <p><span className="font-medium text-espresso">Name:</span> {order.customer_info?.name}</p>
                <p><span className="font-medium text-espresso">Email:</span> {order.customer_info?.email}</p>
                {order.customer_info?.phone && (
                  <p><span className="font-medium text-espresso">Phone:</span> {order.customer_info?.phone}</p>
                )}
                {order.customer_info?.company && (
                  <p><span className="font-medium text-espresso">Company:</span> {order.customer_info?.company}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={`/order/${order.id}`} className="flex-1">
                <Button className="w-full bg-gold hover:bg-gold-light text-white rounded-full py-6">
                  Track Order
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/menu" className="flex-1">
                <Button variant="outline" className="w-full border-espresso/20 text-espresso hover:bg-cream-dark rounded-full py-6">
                  <Coffee className="w-5 h-5 mr-2" />
                  Order More
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
