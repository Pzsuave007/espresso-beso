import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '../App';
import { 
  LayoutDashboard, Coffee, MapPin, Users, Settings, LogOut, 
  DollarSign, Package, TrendingUp, Clock, ChevronRight, RefreshCw,
  CheckCircle, XCircle, Loader2, Navigation, Power, Calendar, GripVertical, Save,
  Plus, Pencil, Trash2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_8eb9ed2b-80c2-447f-a8a6-53bb1c68d925/artifacts/82psuie2_Espresso-Vesso-Logo%20ready1.png";

// Dashboard Overview
function DashboardOverview() {
  const [summary, setSummary] = useState(null);
  const [todayOrders, setTodayOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [summaryRes, ordersRes] = await Promise.all([
        axios.get(`${API}/orders/summary`, { headers }),
        axios.get(`${API}/orders/today`, { headers })
      ]);
      setSummary(summaryRes.data);
      setTodayOrders(ordersRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-dashboard-overview">
      <div className="flex justify-between items-center">
        <h1 className="section-title">Dashboard</h1>
        <Button onClick={fetchData} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="admin-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="admin-stat-label">Today's Revenue</span>
          </div>
          <p className="admin-stat">${summary?.total_revenue?.toFixed(2) || '0.00'}</p>
        </div>
        
        <div className="admin-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <span className="admin-stat-label">Total Orders</span>
          </div>
          <p className="admin-stat">{summary?.total_orders || 0}</p>
        </div>

        <div className="admin-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-amber-600" />
            </div>
            <span className="admin-stat-label">Drinks Made</span>
          </div>
          <p className="admin-stat">{summary?.total_drinks || 0}</p>
        </div>

        <div className="admin-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="admin-stat-label">Zones Covered</span>
          </div>
          <p className="admin-stat">{Object.keys(summary?.by_zone || {}).length}</p>
        </div>
      </div>

      {/* Zone Breakdown */}
      {summary?.by_zone && Object.keys(summary.by_zone).length > 0 && (
        <div className="admin-card">
          <h3 className="font-serif text-lg font-semibold text-espresso mb-4">Orders by Zone</h3>
          <div className="space-y-4">
            {Object.entries(summary.by_zone).map(([zoneName, data]) => (
              <div key={zoneName} className="p-4 bg-cream rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-espresso flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold" />
                    {zoneName}
                  </h4>
                  <span className="text-gold font-semibold">${data.total?.toFixed(2)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.drinks || {}).map(([drink, count]) => (
                    <span key={drink} className="badge-gold">
                      {drink} x{count}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="admin-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-serif text-lg font-semibold text-espresso">Today's Orders</h3>
          <Link to="/admin/orders" className="text-gold hover:text-gold-light text-sm font-medium flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {todayOrders.length === 0 ? (
          <p className="text-espresso/60 text-center py-8">No orders today yet</p>
        ) : (
          <div className="space-y-3">
            {todayOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-cream rounded-xl">
                <div>
                  <p className="font-medium text-espresso">{order.customer_info?.name}</p>
                  <p className="text-sm text-espresso/60">{order.items?.length} items • {order.zone_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gold">${order.total?.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    order.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'preparing' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Orders Management with Logistics
function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [filter, setFilter] = useState('active'); // 'all', 'active', 'at_location', 'delivery'
  const [groupBy, setGroupBy] = useState('none'); // 'none', 'location', 'status'
  const [vanLocation, setVanLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [previousOrderIds, setPreviousOrderIds] = useState(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const { token } = useAuth();

  // Check push notification status on load
  useEffect(() => {
    checkPushStatus();
  }, []);

  const checkPushStatus = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setPushEnabled(!!subscription);
      } catch (e) {
        console.log('Push check failed:', e);
      }
    }
  };

  const subscribeToPush = async () => {
    setPushLoading(true);
    try {
      // Get VAPID key from server
      const { data: { publicKey } } = await axios.get(`${API}/push/vapid-key`);
      
      // Convert VAPID key
      const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Send subscription to backend
      await axios.post(`${API}/push/subscribe`, {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
        }
      }, { headers: { Authorization: `Bearer ${token}` } });

      setPushEnabled(true);
      toast.success('Push notifications enabled!');
    } catch (e) {
      console.error('Push subscription failed:', e);
      toast.error('Failed to enable push notifications');
    } finally {
      setPushLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setPushLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await axios.post(`${API}/push/unsubscribe`, {
          endpoint: subscription.endpoint,
          keys: {}
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        await subscription.unsubscribe();
      }
      
      setPushEnabled(false);
      toast.success('Push notifications disabled');
    } catch (e) {
      console.error('Push unsubscribe failed:', e);
      toast.error('Failed to disable push notifications');
    } finally {
      setPushLoading(false);
    }
  };

  const testPushNotification = async () => {
    try {
      await axios.post(`${API}/push/test`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      toast.success('Test notification sent!');
    } catch (e) {
      toast.error('Failed to send test notification');
    }
  };

  // Notification sound for new orders
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      // Create audio context and play a notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Play two beeps
      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start(audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      // Second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1100; // Higher pitch
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start(audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        osc2.stop(audioContext.currentTime + 0.3);
      }, 250);
    } catch (e) {
      console.log('Audio notification failed:', e);
    }
  };

  // Status workflow
  const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
  const STATUS_COLORS = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-700', icon: '⏳' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '✓' },
    preparing: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '☕' },
    ready: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '🔔' },
    completed: { bg: 'bg-green-100', text: 'text-green-700', icon: '✅' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: '✗' }
  };

  // Calculate distance between two points (Haversine formula)
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

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Geolocation error:', err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Fetch van location
  useEffect(() => {
    const fetchVanLocation = async () => {
      try {
        const res = await axios.get(`${API}/van-location`);
        setVanLocation(res.data);
      } catch (err) {
        console.error('Error fetching van location:', err);
      }
    };
    fetchVanLocation();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newOrders = response.data;
      
      // Check for new orders (orders that weren't in previous fetch)
      if (previousOrderIds.size > 0) {
        const newOrderIds = newOrders.map(o => o.id);
        const brandNewOrders = newOrderIds.filter(id => !previousOrderIds.has(id));
        
        if (brandNewOrders.length > 0) {
          // Play notification sound
          playNotificationSound();
          toast.success(`🔔 ${brandNewOrders.length} new order${brandNewOrders.length > 1 ? 's' : ''}!`, {
            duration: 5000
          });
        }
      }
      
      // Update previous order IDs
      setPreviousOrderIds(new Set(newOrders.map(o => o.id)));
      setOrders(newOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Poll every 30 seconds for new orders
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Order ${newStatus}!`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Verify payment (mark as paid)
  const verifyPayment = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/verify-payment`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('💰 Payment verified!');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to verify payment');
    }
  };

  // Cancel order
  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await axios.post(`${API}/orders/${orderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Order cancelled');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  // Quick status advance - move to next status in workflow
  const advanceStatus = (order) => {
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    if (currentIndex < STATUS_FLOW.length - 1) {
      updateStatus(order.id, STATUS_FLOW[currentIndex + 1]);
    }
  };

  // Start delivery - set van to traveling mode and open navigation
  const startDelivery = async (order) => {
    try {
      // Set van status to traveling with customer info
      await axios.post(`${API}/van-location/traveling-to/${order.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`On the way to ${order.customer_info?.company || order.customer_info?.name}!`);
      
      // Refresh orders to update status
      fetchOrders();
      
      // Open navigation
      if (order.delivery_address) {
        navigateToAddress(order.delivery_address);
      }
    } catch (error) {
      console.error('Error starting delivery:', error);
      toast.error('Failed to start delivery');
    }
  };

  // Mark as arrived - clear traveling status
  const markArrived = async () => {
    try {
      await axios.post(`${API}/van-location/arrived`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Arrived! Status cleared.');
    } catch (error) {
      console.error('Error marking arrived:', error);
    }
  };

  // Open navigation to address
  const navigateToAddress = (address) => {
    const encoded = encodeURIComponent(address);
    // This URL works on both iOS (opens Apple Maps) and Android (opens Google Maps)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    window.open(url, '_blank');
  };

  // Call customer
  const callCustomer = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filter === 'active') return !['completed', 'cancelled'].includes(order.status);
    if (filter === 'at_location') return order.order_type === 'at_location';
    if (filter === 'delivery') return order.order_type === 'delivery';
    return true;
  });

  // Group orders
  const groupedOrders = () => {
    if (groupBy === 'none') return { 'All Orders': filteredOrders };
    
    if (groupBy === 'location') {
      return filteredOrders.reduce((groups, order) => {
        const key = order.order_type === 'delivery' 
          ? '🚗 Deliveries' 
          : (order.zone_name || vanLocation?.stationary_location_name || '📍 At My Location');
        if (!groups[key]) groups[key] = [];
        groups[key].push(order);
        return groups;
      }, {});
    }
    
    if (groupBy === 'status') {
      return filteredOrders.reduce((groups, order) => {
        const key = `${STATUS_COLORS[order.status]?.icon || ''} ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(order);
        return groups;
      }, {});
    }
    
    return { 'All Orders': filteredOrders };
  };

  // Calculate stats
  const stats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    preparing: filteredOrders.filter(o => o.status === 'preparing').length,
    ready: filteredOrders.filter(o => o.status === 'ready').length,
    deliveries: filteredOrders.filter(o => o.order_type === 'delivery').length,
    revenue: filteredOrders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0)
  };

  // Get delivery orders with addresses
  const deliveryOrders = filteredOrders.filter(o => 
    o.order_type === 'delivery' && 
    o.delivery_address && 
    !['completed', 'cancelled'].includes(o.status)
  );

  // Simple geocoding simulation for demo (in production, use a real geocoding API)
  const geocodeAddress = (address) => {
    if (!address) return { lat: vanLocation?.lat || 47.6588, lng: vanLocation?.lng || -117.426 };
    const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const latOffset = ((hash % 100) - 50) * 0.002;
    const lngOffset = ((hash % 77) - 38) * 0.003;
    return {
      lat: (vanLocation?.lat || 47.6588) + latOffset,
      lng: (vanLocation?.lng || -117.426) + lngOffset
    };
  };

  // Calculate smart priority score for an order
  const calculatePriorityScore = (order) => {
    // Calculate wait time in minutes
    const createdAt = order.created_at;
    let waitMinutes = 0;
    if (createdAt) {
      const orderTime = new Date(createdAt);
      const now = new Date();
      waitMinutes = (now - orderTime) / 1000 / 60;
    }
    
    // Calculate distance
    const coords = geocodeAddress(order.delivery_address || '');
    const distance = vanLocation ? 
      calculateDistance(vanLocation.lat, vanLocation.lng, coords.lat, coords.lng) : 5;
    
    // Priority score: higher wait time = higher priority, higher distance = lower priority
    // Formula: (wait_time_minutes * 3) - (distance_miles * 2)
    const priority = (waitMinutes * 3) - (distance * 2);
    
    return {
      priority_score: Math.round(priority * 10) / 10,
      wait_minutes: Math.round(waitMinutes),
      distance_miles: Math.round(distance * 10) / 10,
      coords
    };
  };

  // Calculate optimized route using SMART PRIORITY (balances wait time + distance)
  const calculateOptimizedRoute = () => {
    if (deliveryOrders.length === 0 || !vanLocation) return;
    
    // Calculate priority for each order
    const ordersWithPriority = deliveryOrders.map(order => {
      const priorityInfo = calculatePriorityScore(order);
      return {
        ...order,
        ...priorityInfo
      };
    });

    // Sort by priority score (highest first) - this balances fairness and efficiency
    ordersWithPriority.sort((a, b) => b.priority_score - a.priority_score);

    // Calculate cumulative distance and time
    let currentPos = { lat: vanLocation.lat, lng: vanLocation.lng };
    let totalDist = 0;
    
    ordersWithPriority.forEach((order, idx) => {
      const dist = calculateDistance(currentPos.lat, currentPos.lng, order.coords.lat, order.coords.lng);
      order.distanceFromPrev = dist;
      totalDist += dist;
      order.cumulativeDistance = totalDist;
      order.estimatedTime = Math.round(totalDist * 3); // ~3 min per mile
      order.stopNumber = idx + 1;
      currentPos = order.coords;
    });
    
    setOptimizedRoute(ordersWithPriority);
  };

  // Recalculate route when delivery orders change
  useEffect(() => {
    if (viewMode === 'map') {
      calculateOptimizedRoute();
    }
  }, [deliveryOrders.length, viewMode, vanLocation]);

  // Open multi-stop navigation
  const openMultiStopNavigation = () => {
    if (optimizedRoute.length === 0) return;
    
    // Build Google Maps directions URL with waypoints
    const addresses = optimizedRoute.map(o => encodeURIComponent(o.delivery_address));
    const destination = addresses.pop();
    const waypoints = addresses.join('|');
    
    let url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }
    window.open(url, '_blank');
  };

  // Format time ago
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="admin-orders">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="section-title flex items-center gap-2">
          <Package className="w-6 h-6 text-gold" />
          Orders
        </h1>
        <div className="flex items-center gap-2">
          {/* History Button */}
          <Link to="/admin/history">
            <Button variant="outline" size="sm" className="gap-2">
              <Clock className="w-4 h-4" />
              History
            </Button>
          </Link>
          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playNotificationSound();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              soundEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}
            title={soundEnabled ? 'Sound notifications ON' : 'Sound notifications OFF'}
          >
            {soundEnabled ? '🔔' : '🔕'}
          </button>
          {/* Push Notification Toggle */}
          {'PushManager' in window && (
            <button
              onClick={pushEnabled ? unsubscribeFromPush : subscribeToPush}
              disabled={pushLoading}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pushEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              } ${pushLoading ? 'opacity-50' : ''}`}
              title={pushEnabled ? 'Push notifications ON - tap to disable' : 'Push notifications OFF - tap to enable'}
            >
              {pushLoading ? '⏳' : pushEnabled ? '📲' : '📵'}
            </button>
          )}
          {/* Test Push (only show when push is enabled) */}
          {pushEnabled && (
            <button
              onClick={testPushNotification}
              className="flex items-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 transition-colors hover:bg-purple-200"
              title="Send test notification"
            >
              🧪
            </button>
          )}
          <Button onClick={fetchOrders} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <p className="text-xs text-espresso/60">Active Orders</p>
          <p className="text-2xl font-bold text-espresso">{stats.total}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-amber-700">Preparing</p>
          <p className="text-2xl font-bold text-amber-600">{stats.preparing}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-emerald-700">Ready</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.ready}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-blue-700">Deliveries</p>
          <p className="text-2xl font-bold text-blue-600">{stats.deliveries}</p>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex bg-cream rounded-lg p-1 gap-1">
            {[
              { key: 'active', label: 'Active' },
              { key: 'all', label: 'All' },
              { key: 'at_location', label: '📍 Here' },
              { key: 'delivery', label: '🚗 Delivery' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === f.key ? 'bg-white shadow text-espresso' : 'text-espresso/60 hover:text-espresso'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          
          {viewMode === 'list' && (
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Group by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="location">By Location</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-cream rounded-lg p-1 gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${
              viewMode === 'list' ? 'bg-white shadow text-espresso' : 'text-espresso/60 hover:text-espresso'
            }`}
            data-testid="view-list"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${
              viewMode === 'map' ? 'bg-white shadow text-espresso' : 'text-espresso/60 hover:text-espresso'
            }`}
            data-testid="view-map"
          >
            <MapPin className="w-4 h-4" />
            Route Map
          </button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="space-y-4">
          {/* Route Summary */}
          {optimizedRoute.length > 0 && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    🗺️ Optimized Delivery Route
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {optimizedRoute.length} stops • ~{optimizedRoute[optimizedRoute.length - 1]?.cumulativeDistance?.toFixed(1)} miles • 
                    ~{optimizedRoute[optimizedRoute.length - 1]?.estimatedTime} min total
                  </p>
                </div>
                <button
                  onClick={openMultiStopNavigation}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
                  data-testid="start-route-btn"
                >
                  <Navigation className="w-5 h-5" />
                  Start Route
                </button>
              </div>
            </div>
          )}

          {/* Route Stops List */}
          {optimizedRoute.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="p-4 bg-cream/50 border-b border-cream-dark">
                <h4 className="font-semibold text-espresso">Smart Delivery Queue</h4>
                <p className="text-xs text-espresso/60">Balanced by wait time + distance for fairness & efficiency</p>
              </div>
              <div className="divide-y divide-cream-dark">
                {optimizedRoute.map((order, idx) => (
                  <div 
                    key={order.id} 
                    className={`p-4 hover:bg-cream/30 transition-colors ${selectedOrder?.id === order.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                        {order.stopNumber}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-espresso">{order.customer_info?.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]?.bg} ${STATUS_COLORS[order.status]?.text}`}>
                            {order.status}
                          </span>
                          {order.wait_minutes > 10 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              ⏳ {order.wait_minutes}m waiting
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-espresso/70">{order.delivery_address}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-espresso/50 flex-wrap">
                          <span>{order.distance_miles} mi away</span>
                          <span>•</span>
                          <span>~{order.estimatedTime} min from start</span>
                          <span>•</span>
                          <span className="text-gold font-medium">${order.total?.toFixed(2)}</span>
                          <span>•</span>
                          <span className="text-blue-600" title="Smart priority score">⚡ {order.priority_score}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); callCustomer(order.customer_info?.phone); }}
                          className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors"
                          title="Call customer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); startDelivery(order); }}
                          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                          title="Start delivery - updates map & opens navigation"
                          data-testid={`start-delivery-${order.id}`}
                        >
                          <Navigation className="w-4 h-4" />
                          Go
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-semibold text-espresso mb-2">No Delivery Orders</h3>
              <p className="text-espresso/60 text-sm">
                Delivery orders with addresses will appear here with an optimized route.
              </p>
            </div>
          )}
        </div>
      )}

      {/* List View - Orders */}
      {viewMode === 'list' && !selectedOrder && (
        <>
        {filteredOrders.length === 0 ? (
        <div className="admin-card text-center py-12">
          <Package className="w-12 h-12 text-espresso/30 mx-auto mb-4" />
          <p className="text-espresso/60">No orders found</p>
        </div>
      ) : (
        Object.entries(groupedOrders()).map(([groupName, groupOrders]) => (
          <div key={groupName} className="space-y-2">
            {groupBy !== 'none' && (
              <h3 className="font-semibold text-espresso flex items-center gap-2 mt-4">
                {groupName}
                <span className="text-sm font-normal text-espresso/60">({groupOrders.length})</span>
              </h3>
            )}
            
            {/* Compact Order List */}
            {groupOrders.map((order) => (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className={`bg-white rounded-xl shadow-sm p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                  order.status === 'ready' ? 'border-emerald-500' :
                  order.status === 'preparing' ? 'border-amber-500' :
                  order.status === 'pending' ? 'border-gray-300' :
                  order.status === 'confirmed' ? 'border-blue-400' :
                  'border-transparent'
                }`}
                data-testid={`order-${order.id}`}
              >
                {/* Status Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  order.status === 'ready' ? 'bg-emerald-100' :
                  order.status === 'preparing' ? 'bg-amber-100' :
                  order.status === 'confirmed' ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  {STATUS_COLORS[order.status]?.icon || '⏳'}
                </div>
                
                {/* Order Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-espresso truncate">
                      {order.customer_info?.name}
                    </span>
                    {order.order_type === 'delivery' && (
                      <span className="text-blue-500 text-xs">🚗</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-espresso/50">
                    <span>{order.items?.reduce((sum, i) => sum + i.quantity, 0)} drinks</span>
                    <span>•</span>
                    <span>{timeAgo(order.created_at)}</span>
                  </div>
                </div>
                
                {/* Price & Payment */}
                <div className="text-right">
                  <p className="font-bold text-gold">${order.total?.toFixed(2)}</p>
                  <span className={`text-xs ${
                    order.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {order.payment_status === 'paid' ? '✓ paid' : '⏳ pending'}
                  </span>
                </div>
                
                {/* Chevron */}
                <ChevronRight className="w-5 h-5 text-espresso/30" />
              </div>
            ))}
          </div>
        ))
      )}
      </> )}

      {/* Order Detail View */}
      {viewMode === 'list' && selectedOrder && (
        <div className="space-y-4">
          {/* Back Button */}
          <button
            onClick={() => setSelectedOrder(null)}
            className="flex items-center gap-2 text-espresso/70 hover:text-espresso transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span>Back to Orders</span>
          </button>

          {/* Order Header Card */}
          <div className={`bg-white rounded-2xl shadow-card overflow-hidden border-l-4 ${
            selectedOrder.status === 'ready' ? 'border-emerald-500' :
            selectedOrder.status === 'preparing' ? 'border-amber-500' :
            selectedOrder.status === 'confirmed' ? 'border-blue-400' :
            'border-gray-300'
          }`}>
            <div className={`p-4 ${
              selectedOrder.status === 'ready' ? 'bg-emerald-50' :
              selectedOrder.status === 'preparing' ? 'bg-amber-50' :
              'bg-white'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-espresso">
                    {selectedOrder.customer_info?.name}
                  </h2>
                  {selectedOrder.customer_info?.company && (
                    <p className="text-espresso/60">{selectedOrder.customer_info.company}</p>
                  )}
                  <p className="text-sm text-espresso/50 mt-1">
                    Order #{selectedOrder.id.slice(0, 8).toUpperCase()} • {timeAgo(selectedOrder.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gold">${selectedOrder.total?.toFixed(2)}</p>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                    selectedOrder.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedOrder.payment_status === 'paid' ? '✓ Paid' : '⏳ Payment Pending'}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4 flex items-center gap-2">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${STATUS_COLORS[selectedOrder.status]?.bg} ${STATUS_COLORS[selectedOrder.status]?.text}`}>
                  {STATUS_COLORS[selectedOrder.status]?.icon} {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </span>
                <span className={`px-3 py-2 rounded-full text-sm ${
                  selectedOrder.order_type === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {selectedOrder.order_type === 'delivery' ? '🚗 Delivery' : '📍 Pickup'}
                </span>
              </div>
            </div>

            {/* Delivery Address */}
            {selectedOrder.order_type === 'delivery' && selectedOrder.delivery_address && (
              <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-1">Deliver to:</p>
                <p className="text-blue-900 font-medium">{selectedOrder.delivery_address}</p>
              </div>
            )}

            {/* Pickup Instructions */}
            {selectedOrder.customer_info?.pickup_instructions && (
              <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
                <p className="text-xs text-amber-600 font-medium mb-1">📝 Instructions:</p>
                <p className="text-amber-900">{selectedOrder.customer_info.pickup_instructions}</p>
              </div>
            )}
          </div>

          {/* Drinks to Prepare */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="p-4 bg-gold/10 border-b border-gold/20">
              <h3 className="font-semibold text-espresso flex items-center gap-2">
                ☕ Drinks to Prepare
                <span className="text-sm font-normal text-espresso/60">
                  ({selectedOrder.items?.reduce((sum, i) => sum + i.quantity, 0)} total)
                </span>
              </h3>
            </div>
            <div className="divide-y divide-cream">
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-gold">{item.quantity}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-espresso">{item.menu_item_name}</p>
                    {item.customizations && Object.keys(item.customizations).length > 0 && (
                      <p className="text-sm text-espresso/60">
                        {Object.entries(item.customizations).map(([key, val]) => `${key}: ${val}`).join(' • ')}
                      </p>
                    )}
                  </div>
                  <p className="font-medium text-espresso/70">${item.item_total?.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-card p-4 space-y-3">
            <h3 className="font-semibold text-espresso">Quick Actions</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Call Customer */}
              {selectedOrder.customer_info?.phone && (
                <button
                  onClick={() => callCustomer(selectedOrder.customer_info.phone)}
                  className="flex items-center justify-center gap-2 p-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl font-medium transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Call
                </button>
              )}

              {/* Navigate (for deliveries) */}
              {selectedOrder.order_type === 'delivery' && selectedOrder.delivery_address && (
                <button
                  onClick={() => startDelivery(selectedOrder)}
                  className="flex items-center justify-center gap-2 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                >
                  <Navigation className="w-5 h-5" />
                  Navigate
                </button>
              )}

              {/* Verify Payment */}
              {selectedOrder.payment_status !== 'paid' && selectedOrder.status !== 'cancelled' && (
                <button
                  onClick={() => { verifyPayment(selectedOrder.id); setSelectedOrder({...selectedOrder, payment_status: 'paid'}); }}
                  className="flex items-center justify-center gap-2 p-4 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl font-medium transition-colors"
                >
                  💰 Verify Paid
                </button>
              )}

              {/* Cancel */}
              {!['completed', 'cancelled'].includes(selectedOrder.status) && (
                <button
                  onClick={() => { cancelOrder(selectedOrder.id); setSelectedOrder(null); }}
                  className="flex items-center justify-center gap-2 p-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-medium transition-colors"
                >
                  ✕ Cancel
                </button>
              )}
            </div>
          </div>

          {/* Status Update Buttons */}
          {!['completed', 'cancelled'].includes(selectedOrder.status) && (
            <div className="bg-white rounded-2xl shadow-card p-4">
              <h3 className="font-semibold text-espresso mb-3">Update Status</h3>
              <div className="flex flex-col gap-2">
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => { updateStatus(selectedOrder.id, 'confirmed'); setSelectedOrder({...selectedOrder, status: 'confirmed'}); }}
                    className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors text-lg"
                  >
                    ✓ Confirm Order
                  </button>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <button
                    onClick={() => { updateStatus(selectedOrder.id, 'preparing'); setSelectedOrder({...selectedOrder, status: 'preparing'}); }}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors text-lg"
                  >
                    ☕ Start Making
                  </button>
                )}
                {selectedOrder.status === 'preparing' && (
                  <button
                    onClick={() => { updateStatus(selectedOrder.id, 'ready'); setSelectedOrder({...selectedOrder, status: 'ready'}); }}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors text-lg"
                  >
                    🔔 Mark Ready
                  </button>
                )}
                {selectedOrder.status === 'ready' && (
                  <button
                    onClick={() => { updateStatus(selectedOrder.id, 'completed'); setSelectedOrder(null); }}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors text-lg"
                  >
                    ✅ Complete Order
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Completed/Cancelled Status */}
          {selectedOrder.status === 'completed' && (
            <div className="bg-green-50 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-green-700 font-semibold">Order Completed!</p>
            </div>
          )}
          {selectedOrder.status === 'cancelled' && (
            <div className="bg-red-50 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-2">❌</div>
              <p className="text-red-700 font-semibold">Order Cancelled</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Order History Component
function OrderHistory() {
  const [archivedDays, setArchivedDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dailyReport, setDailyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const { token } = useAuth();

  // Fetch archived orders
  const fetchArchived = async () => {
    try {
      const response = await axios.get(`${API}/orders/history/archived?days=30`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArchivedDays(response.data);
    } catch (error) {
      console.error('Error fetching archived orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch daily report
  const fetchDailyReport = async (date) => {
    setReportLoading(true);
    try {
      const response = await axios.get(`${API}/orders/history/daily/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDailyReport(response.data);
      setSelectedDate(date);
    } catch (error) {
      console.error('Error fetching daily report:', error);
      toast.error('Failed to load daily report');
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchArchived();
  }, [token]);

  // Format date nicely
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today.toISOString().slice(0, 10)) return 'Today';
    if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="order-history">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <Clock className="w-6 h-6 text-gold" />
            Order History
          </h1>
          <p className="text-sm text-espresso/60 mt-1">Completed orders from the last 30 days</p>
        </div>
        {selectedDate && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { setSelectedDate(null); setDailyReport(null); }}
            className="gap-2"
          >
            ← Back to Overview
          </Button>
        )}
      </div>

      {/* Daily Report View */}
      {selectedDate && dailyReport ? (
        <div className="space-y-4">
          {/* Report Header */}
          <div className="bg-gradient-to-r from-gold to-gold-dark rounded-2xl p-6 text-white">
            <h2 className="text-2xl font-serif font-bold">{formatDate(selectedDate)}</h2>
            <p className="text-white/80 text-sm">{selectedDate}</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="bg-white/20 rounded-xl p-3">
                <p className="text-white/70 text-xs">Revenue</p>
                <p className="text-2xl font-bold">${dailyReport.total_revenue?.toFixed(2)}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <p className="text-white/70 text-xs">Orders</p>
                <p className="text-2xl font-bold">{dailyReport.total_orders}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <p className="text-white/70 text-xs">Drinks</p>
                <p className="text-2xl font-bold">{dailyReport.total_drinks}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <p className="text-white/70 text-xs">Avg Order</p>
                <p className="text-2xl font-bold">
                  ${dailyReport.total_orders > 0 ? (dailyReport.total_revenue / dailyReport.total_orders).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Drinks */}
            <div className="bg-white rounded-2xl shadow-card p-4">
              <h3 className="font-semibold text-espresso mb-3 flex items-center gap-2">
                <Coffee className="w-4 h-4 text-gold" />
                Top Drinks
              </h3>
              <div className="space-y-2">
                {dailyReport.top_drinks?.length > 0 ? (
                  dailyReport.top_drinks.map(([name, count], idx) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-gold text-white' : 'bg-cream text-espresso'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm text-espresso">{name}</span>
                      </div>
                      <span className="text-sm font-medium text-gold">{count} sold</span>
                    </div>
                  ))
                ) : (
                  <p className="text-espresso/50 text-sm">No drinks sold</p>
                )}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl shadow-card p-4">
              <h3 className="font-semibold text-espresso mb-3 flex items-center gap-2">
                💳 Payment Methods
              </h3>
              <div className="space-y-2">
                {Object.entries(dailyReport.payment_methods || {}).length > 0 ? (
                  Object.entries(dailyReport.payment_methods).map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between">
                      <span className="text-sm text-espresso capitalize">{method}</span>
                      <span className="text-sm font-medium text-gold">${amount.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-espresso/50 text-sm">No paid orders</p>
                )}
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="p-4 bg-cream/50 border-b border-cream-dark">
              <h3 className="font-semibold text-espresso">Orders ({dailyReport.orders?.length})</h3>
            </div>
            <div className="divide-y divide-cream-dark max-h-96 overflow-y-auto">
              {dailyReport.orders?.map(order => (
                <div key={order.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-espresso">{order.customer_info?.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-espresso/50 mt-0.5">
                        #{order.id?.slice(0, 8)} • {order.items?.reduce((sum, i) => sum + i.quantity, 0)} drinks
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gold">${order.total?.toFixed(2)}</p>
                      <p className="text-xs text-espresso/50">{order.payment_method}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Overview - List of Days */
        <>
          {archivedDays.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card p-12 text-center">
              <Clock className="w-12 h-12 text-espresso/30 mx-auto mb-4" />
              <h3 className="font-semibold text-espresso mb-2">No Completed Orders Yet</h3>
              <p className="text-espresso/60 text-sm">
                Completed orders will appear here grouped by day.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedDays.map(day => (
                <div 
                  key={day.date}
                  onClick={() => fetchDailyReport(day.date)}
                  className="bg-white rounded-2xl shadow-card p-4 cursor-pointer hover:shadow-floating transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-espresso">{formatDate(day.date)}</h3>
                        <p className="text-xs text-espresso/50">{day.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-espresso/50">Orders</p>
                        <p className="font-semibold text-espresso">{day.total_orders}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-espresso/50">Drinks</p>
                        <p className="font-semibold text-espresso">{day.total_drinks}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-espresso/50">Revenue</p>
                        <p className="font-bold text-gold">${day.total_revenue?.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          ✓ {day.completed}
                        </span>
                        {day.cancelled > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            ✗ {day.cancelled}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-espresso/30" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Group Requests
function GroupRequestsManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${API}/group-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching group requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const updateStatus = async (requestId, newStatus) => {
    try {
      await axios.put(`${API}/group-requests/${requestId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Request status updated');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-group-requests">
      <h1 className="section-title">Group Requests</h1>

      {requests.length === 0 ? (
        <div className="admin-card text-center py-12">
          <Users className="w-12 h-12 text-espresso/30 mx-auto mb-4" />
          <p className="text-espresso/60">No group requests yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div key={request.id} className="admin-card" data-testid={`group-request-${request.id}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-espresso">{request.contact_name}</h3>
                  <p className="text-sm text-espresso/60">{request.company_name || 'Individual'}</p>
                </div>
                <Select
                  value={request.status}
                  onValueChange={(value) => updateStatus(request.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gold" />
                  <span className="text-espresso/70">{request.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gold" />
                  <span className="text-espresso/70">{request.people_count} people</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold" />
                  <span className="text-espresso/70">{request.preferred_date} at {request.preferred_time}</span>
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-cream-dark text-sm">
                <p><span className="text-espresso/60">Email:</span> {request.contact_email}</p>
                <p><span className="text-espresso/60">Phone:</span> {request.contact_phone}</p>
                {request.notes && (
                  <p className="mt-2"><span className="text-espresso/60">Notes:</span> {request.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Menu Management Component
function MenuManagement() {
  const { token } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Signature Drinks',
    image_url: '',
    is_available: true
  });

  const categories = ['Signature Drinks', 'Espresso Classics', 'Iced Drinks', 'Smoothies'];

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API}/menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [token]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Signature Drinks',
      image_url: '',
      is_available: true
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast.error('Please fill in name and price');
      return;
    }

    try {
      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
        customizations: []
      };

      if (editingItem) {
        // Update existing item
        await axios.put(`${API}/menu/${editingItem.id}`, itemData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Menu item updated!');
      } else {
        // Create new item
        await axios.post(`${API}/menu`, itemData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Menu item added!');
      }
      
      resetForm();
      fetchMenu();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Failed to save menu item');
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      image_url: item.image_url || '',
      is_available: item.is_available
    });
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    
    try {
      await axios.delete(`${API}/menu/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Menu item deleted!');
      fetchMenu();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await axios.put(`${API}/menu/${item.id}`, {
        ...item,
        is_available: !item.is_available
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMenu();
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-menu">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="section-title flex items-center gap-3">
          <Coffee className="w-6 h-6 sm:w-8 sm:h-8 text-gold" />
          Menu Management
        </h1>
        <Button 
          onClick={() => { resetForm(); setShowAddForm(true); }}
          className="bg-burgundy hover:bg-burgundy-dark text-white rounded-full w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Drink
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="admin-card bg-cream border-2 border-gold">
          <h3 className="font-semibold text-espresso mb-4">
            {editingItem ? 'Edit Drink' : 'Add New Drink'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Beso Delight"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Price *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="3.25"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Hazelnut Sensation Mocha..."
              />
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Category</label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">Image URL</label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
              />
              <span className="text-sm text-espresso">Available for ordering</span>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-gold hover:bg-gold-dark text-white">
                <Save className="w-4 h-4 mr-2" />
                {editingItem ? 'Update' : 'Add'} Drink
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Items List */}
      <div className="admin-card">
        <p className="text-espresso/70 mb-4">
          {menuItems.length} drinks on your menu. Toggle availability or edit/delete items.
        </p>

        {categories.map((category) => {
          const categoryItems = menuItems.filter(item => item.category === category);
          if (categoryItems.length === 0) return null;
          
          return (
            <div key={category} className="mb-6">
              <h3 className="font-semibold text-espresso mb-3 flex items-center gap-2">
                <Coffee className="w-4 h-4 text-gold" />
                {category} ({categoryItems.length})
              </h3>
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div 
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      item.is_available 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    {/* Toggle */}
                    <Switch
                      checked={item.is_available}
                      onCheckedChange={() => toggleAvailability(item)}
                    />
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-espresso truncate">{item.name}</span>
                        <span className="text-gold font-semibold">${item.price.toFixed(2)}</span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-espresso/60 truncate">{item.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 hover:bg-blue-100 rounded text-blue-600"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 hover:bg-red-100 rounded text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {menuItems.length === 0 && (
          <p className="text-center text-espresso/60 py-8">No menu items yet. Add your first drink!</p>
        )}
      </div>
    </div>
  );
}

// Schedule Management Component
function ScheduleManagement() {
  const { token } = useAuth();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');

  const fetchZones = async () => {
    try {
      const response = await axios.get(`${API}/zones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sort by sort_order and mark custom zones
      const sorted = response.data
        .map(z => ({
          ...z,
          is_custom: z.is_custom || String(z.id).startsWith('custom-')
        }))
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setZones(sorted);
    } catch (error) {
      console.error('Error fetching zones:', error);
      toast.error('Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, [token]);

  const addCustomLocation = () => {
    if (!newLocationName.trim()) {
      toast.error('Please enter a location name');
      return;
    }
    
    const customZone = {
      id: `custom-${Date.now()}`,
      name: newLocationName.trim(),
      is_custom: true,
      active_today: true,
      sort_order: zones.length,
      time_windows: [{ start: '09:00', end: '17:00' }]
    };
    
    setZones(prev => [...prev, customZone]);
    setNewLocationName('');
    toast.success(`Added "${customZone.name}" to today's schedule`);
  };

  const removeCustomLocation = (zoneId) => {
    setZones(prev => prev.filter(z => z.id !== zoneId));
    toast.success('Location removed');
  };

  const toggleActiveToday = (zoneId) => {
    setZones(prev => prev.map(z => 
      z.id === zoneId ? { ...z, active_today: !z.active_today } : z
    ));
  };

  const updateTimeWindow = (zoneId, field, value) => {
    setZones(prev => prev.map(z => {
      if (z.id === zoneId) {
        const timeWindows = z.time_windows && z.time_windows.length > 0 
          ? [{ ...z.time_windows[0], [field]: value }]
          : [{ start: '09:00', end: '17:00', [field]: value }];
        return { ...z, time_windows: timeWindows };
      }
      return z;
    }));
  };

  const moveZone = (index, direction) => {
    if (direction === 'up' && index > 0) {
      const newZones = [...zones];
      [newZones[index], newZones[index - 1]] = [newZones[index - 1], newZones[index]];
      // Update sort_order
      newZones.forEach((z, i) => z.sort_order = i);
      setZones(newZones);
    } else if (direction === 'down' && index < zones.length - 1) {
      const newZones = [...zones];
      [newZones[index], newZones[index + 1]] = [newZones[index + 1], newZones[index]];
      // Update sort_order
      newZones.forEach((z, i) => z.sort_order = i);
      setZones(newZones);
    }
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      const scheduleData = zones.map((z, index) => ({
        id: z.id,
        name: z.name,
        active_today: z.active_today,
        sort_order: index,
        time_windows: z.time_windows,
        is_custom: z.is_custom || false
      }));
      
      await axios.put(`${API}/zones/today/schedule`, 
        { zones: scheduleData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Schedule saved!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-schedule">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="section-title flex items-center gap-3">
          <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-gold" />
          Today's Schedule
        </h1>
        <Button 
          onClick={saveSchedule} 
          disabled={saving}
          className="bg-burgundy hover:bg-burgundy-dark text-white rounded-full w-full sm:w-auto"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="admin-card">
        <p className="text-espresso/70 mb-4">
          Toggle zones on/off for today and set the time windows.
        </p>

        {/* Add Custom Location */}
        <div className="mb-4 p-3 bg-cream rounded-xl">
          <label className="block text-sm font-medium text-espresso mb-2">
            Add a custom location for today:
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g., Smith Wedding, Tech Conference..."
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomLocation()}
              className="flex-1"
              data-testid="add-location-input"
            />
            <Button 
              onClick={addCustomLocation}
              className="bg-gold hover:bg-gold-dark text-white px-4"
              data-testid="add-location-btn"
            >
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {zones.map((zone, index) => (
            <div 
              key={zone.id}
              className={`p-4 rounded-xl border-2 transition-all relative ${
                zone.active_today 
                  ? zone.is_custom 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-emerald-50 border-emerald-200' 
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
              data-testid={`schedule-zone-${zone.id}`}
            >
              {/* Delete button for custom locations - Top Right */}
              {zone.is_custom && (
                <button
                  onClick={() => removeCustomLocation(zone.id)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-md z-10"
                  title="Remove"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}

              {/* Top row: Toggle, Zone Name, Move Buttons */}
              <div className="flex items-center gap-3">
                {/* Toggle */}
                <Switch
                  checked={zone.active_today}
                  onCheckedChange={() => toggleActiveToday(zone.id)}
                  data-testid={`toggle-${zone.id}`}
                />

                {/* Zone Name */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-4 h-4 ${zone.is_custom ? 'text-blue-500' : 'text-gold'}`} />
                    <span className="font-semibold text-espresso">{zone.name}</span>
                    {zone.is_custom && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Custom
                      </span>
                    )}
                  </div>
                </div>

                {/* Move Buttons */}
                <div className="flex gap-1">
                  <button 
                    onClick={() => moveZone(index, 'up')}
                    disabled={index === 0}
                    className="p-2 hover:bg-gray-200 rounded disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4 -rotate-90" />
                  </button>
                  <button 
                    onClick={() => moveZone(index, 'down')}
                    disabled={index === zones.length - 1}
                    className="p-2 hover:bg-gray-200 rounded disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </button>
                </div>
              </div>

              {/* Bottom row: Time Windows (full width on mobile) */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200/50">
                <Clock className="w-4 h-4 text-espresso/50 flex-shrink-0" />
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={zone.time_windows?.[0]?.start || '09:00'}
                    onChange={(e) => updateTimeWindow(zone.id, 'start', e.target.value)}
                    className="flex-1 min-w-0 text-sm"
                    disabled={!zone.active_today}
                  />
                  <span className="text-espresso/50 text-sm">to</span>
                  <Input
                    type="time"
                    value={zone.time_windows?.[0]?.end || '17:00'}
                    onChange={(e) => updateTimeWindow(zone.id, 'end', e.target.value)}
                    className="flex-1 min-w-0 text-sm"
                    disabled={!zone.active_today}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {zones.length === 0 && (
          <p className="text-center text-espresso/60 py-8">No zones configured yet</p>
        )}
      </div>

      {/* Preview */}
      <div className="admin-card bg-cream/50">
        <h3 className="font-semibold text-espresso mb-3 text-sm sm:text-base">Preview - What customers will see:</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {zones.filter(z => z.active_today).map((zone) => (
            <div key={zone.id} className="bg-white rounded-xl p-2 sm:p-3 shadow-sm">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gold flex-shrink-0" />
                <span className="font-medium text-espresso text-xs sm:text-sm truncate">{zone.name}</span>
              </div>
              <div className="flex items-center gap-1 text-espresso/60 text-xs">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{zone.time_windows?.[0]?.start || '09:00'} - {zone.time_windows?.[0]?.end || '17:00'}</span>
              </div>
            </div>
          ))}
        </div>
        {zones.filter(z => z.active_today).length === 0 && (
          <p className="text-espresso/50 text-sm">No zones active for today</p>
        )}
      </div>
    </div>
  );
}

// Location Tracker Component
function LocationTracker() {
  const { token } = useAuth();
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState('offline');
  const [mode, setMode] = useState('mobile'); // mobile or stationary
  const [stationaryLocationName, setStationaryLocationName] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [zones, setZones] = useState([]);
  const [location, setLocation] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Fetch zones
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await axios.get(`${API}/zones`);
        setZones(response.data);
      } catch (err) {
        console.error('Error fetching zones:', err);
      }
    };
    fetchZones();
  }, []);

  // Update location to server
  const updateServerLocation = useCallback(async (lat, lng) => {
    try {
      await axios.post(`${API}/van-location`, {
        lat,
        lng,
        status,
        mode,
        stationary_location_name: mode === 'stationary' ? stationaryLocationName : null,
        current_zone: selectedZone || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error updating location:', err);
      setError('Failed to update location');
    }
  }, [token, status, mode, stationaryLocationName, selectedZone]);

  // Watch position
  useEffect(() => {
    let watchId;
    
    if (tracking) {
      if (!navigator.geolocation) {
        setError('Geolocation not supported');
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          updateServerLocation(latitude, longitude);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError(`Location error: ${err.message}`);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000
        }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [tracking, updateServerLocation]);

  // Update status when it changes
  useEffect(() => {
    if (location && tracking) {
      updateServerLocation(location.lat, location.lng);
    }
  }, [status, selectedZone, mode, stationaryLocationName]);

  const toggleTracking = () => {
    if (tracking) {
      setTracking(false);
      setStatus('offline');
      // Update server to offline
      if (location) {
        axios.post(`${API}/van-location`, {
          lat: location.lat,
          lng: location.lng,
          status: 'offline',
          mode: mode,
          stationary_location_name: null,
          current_zone: null
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } else {
      setTracking(true);
      setStatus('available');
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'available': return 'bg-emerald-500';
      case 'preparing': return 'bg-amber-500';
      case 'traveling': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-location-tracker">
      <h1 className="section-title flex items-center gap-3">
        <Navigation className="w-8 h-8 text-gold" />
        Live Location
      </h1>

      {/* Tracking Toggle */}
      <div className="admin-card text-center">
        <button
          onClick={toggleTracking}
          className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all duration-300 ${
            tracking 
              ? 'bg-burgundy shadow-floating' 
              : 'bg-gray-200'
          }`}
          data-testid="admin-tracking-toggle"
        >
          <Power className={`w-10 h-10 ${tracking ? 'text-white' : 'text-gray-400'}`} />
        </button>
        <p className="mt-4 font-semibold text-espresso">
          {tracking ? '🟢 Tracking Active' : 'Tap to Start Tracking'}
        </p>
        {lastUpdate && (
          <p className="text-sm text-espresso/60 mt-1">
            Last update: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
        {location && tracking && (
          <p className="text-xs text-espresso/50 mt-2">
            📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </p>
        )}
      </div>

      {/* Mode Selection - Mobile vs Stationary */}
      <div className="admin-card bg-gradient-to-r from-gold/10 to-burgundy/10 border-2 border-gold">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
            {mode === 'mobile' ? '🚐' : '📍'}
          </div>
          <div>
            <h3 className="font-semibold text-espresso">Operation Mode</h3>
            <p className="text-sm text-espresso/60">
              {mode === 'mobile' ? 'Customers can request you to come to them' : 'Customers come to your location'}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('mobile')}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              mode === 'mobile'
                ? 'border-gold bg-gold/20 shadow-md'
                : 'border-cream-dark bg-white hover:border-gold/50'
            }`}
            data-testid="mode-mobile"
          >
            <div className="text-2xl mb-2">🚐</div>
            <p className="font-semibold text-espresso text-sm">Mobile</p>
            <p className="text-xs text-espresso/60 mt-1">Driving around</p>
          </button>
          <button
            onClick={() => setMode('stationary')}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              mode === 'stationary'
                ? 'border-burgundy bg-burgundy/20 shadow-md'
                : 'border-cream-dark bg-white hover:border-burgundy/50'
            }`}
            data-testid="mode-stationary"
          >
            <div className="text-2xl mb-2">📍</div>
            <p className="font-semibold text-espresso text-sm">Stationary</p>
            <p className="text-xs text-espresso/60 mt-1">At an event/location</p>
          </button>
        </div>

        {/* Stationary Location Name */}
        {mode === 'stationary' && (
          <div className="mt-4 p-3 bg-burgundy/10 rounded-xl">
            <label className="block text-sm font-medium text-espresso mb-2">
              Where are you parked?
            </label>
            <Input
              type="text"
              placeholder="e.g., Soccer Match at Lincoln Park"
              value={stationaryLocationName}
              onChange={(e) => setStationaryLocationName(e.target.value)}
              className="w-full"
              data-testid="stationary-location-input"
            />
            <p className="text-xs text-espresso/50 mt-2">
              Customers will see this and know to come to you
            </p>
          </div>
        )}
      </div>

      {/* Status & Zone Selection */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Status */}
        <div className="admin-card">
          <label className="block text-sm font-medium text-espresso mb-3">Your Status</label>
          <div className="grid grid-cols-2 gap-2">
            {['available', 'preparing', 'traveling', 'offline'].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`p-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  status === s 
                    ? 'bg-gold text-white' 
                    : 'bg-cream text-espresso hover:bg-cream-dark'
                }`}
                data-testid={`admin-status-${s}`}
              >
                <span className={`w-2 h-2 rounded-full ${getStatusColor(s)}`}></span>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="admin-card">
          <label className="block text-sm font-medium text-espresso mb-3">Where are you?</label>
          <Input
            type="text"
            placeholder="e.g., Smith Wedding, Downtown Tech Event..."
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full"
            data-testid="location-input"
          />
          <p className="text-xs text-espresso/50 mt-2">
            Type your current location - customers will see this on the map
          </p>
          
          {/* Quick select from zones */}
          <div className="mt-3 pt-3 border-t border-cream-dark">
            <p className="text-xs text-espresso/60 mb-2">Quick select:</p>
            <div className="flex flex-wrap gap-2">
              {zones.slice(0, 4).map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedZone === zone.name
                      ? 'bg-gold text-white'
                      : 'bg-cream text-espresso hover:bg-cream-dark'
                  }`}
                >
                  {zone.name}
                </button>
              ))}
            </div>
          </div>
          
          {selectedZone && (
            <p className="mt-3 text-sm text-gold font-medium">
              📍 Currently at: {selectedZone}
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="admin-card bg-cream/50">
        <h3 className="font-medium text-espresso mb-2">How it works:</h3>
        <ul className="text-sm text-espresso/70 space-y-1">
          <li>1. Tap the power button to start sharing your location</li>
          <li>2. Select your current status (customers see this on the map)</li>
          <li>3. Type where you are (event name, location) or quick-select a zone</li>
          <li>4. Your location updates automatically every few seconds</li>
        </ul>
      </div>
    </div>
  );
}

// Main Admin Dashboard
export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, admin } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  // Navigation items - ordered by importance for mobile (show on mobile nav)
  const navItems = [
    { path: '/admin/orders', icon: Package, label: 'Orders' },
    { path: '/admin/location', icon: Navigation, label: 'Location' },
    { path: '/admin/schedule', icon: Calendar, label: 'Schedule' },
    { path: '/admin/menu', icon: Coffee, label: 'Menu' },
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ];
  
  // Additional nav items (accessible via buttons, not bottom nav)
  const secondaryNavItems = [
    { path: '/admin/history', icon: Clock, label: 'History' },
    { path: '/admin/group-requests', icon: Users, label: 'Requests' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-cream" data-testid="admin-dashboard">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-espresso text-cream p-6 hidden lg:block">
        <div className="mb-8">
          <img src={LOGO_URL} alt="Espresso Beso" className="h-16 w-auto" />
          <p className="text-cream/60 text-sm mt-2">Admin Portal</p>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                location.pathname === path
                  ? 'bg-gold text-white'
                  : 'text-cream/70 hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
          
          {/* Secondary nav items */}
          <div className="border-t border-cream/20 mt-4 pt-4">
            {secondaryNavItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  location.pathname === path
                    ? 'bg-gold text-white'
                    : 'text-cream/70 hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="border-t border-cream/20 pt-4">
            <p className="text-cream/60 text-sm mb-2">{admin?.name}</p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-cream/70 hover:text-cream transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 bg-espresso text-cream px-4 py-3 flex justify-between items-center z-50">
        <img src={LOGO_URL} alt="Espresso Beso" className="h-14 w-auto" />
        <button onClick={handleLogout} className="text-cream/70">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-cream-dark px-2 py-2 z-50">
        <div className="flex justify-around">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg ${
                location.pathname === path ? 'text-gold bg-gold/10' : 'text-espresso/60'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] whitespace-nowrap">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 md:p-8 pb-24 lg:pb-8">
        <Routes>
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="history" element={<OrderHistory />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="schedule" element={<ScheduleManagement />} />
          <Route path="location" element={<LocationTracker />} />
          <Route path="group-requests" element={<GroupRequestsManagement />} />
          <Route path="*" element={<DashboardOverview />} />
        </Routes>
      </main>
    </div>
  );
}
