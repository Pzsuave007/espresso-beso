import { useState, useEffect, useCallback } from 'react';
import { MapPin, Power, RefreshCw, Coffee, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const LOGO_URL = "https://customer-assets.emergentagent.com/job_8eb9ed2b-80c2-447f-a8a6-53bb1c68d925/artifacts/82psuie2_Espresso-Vesso-Logo%20ready1.png";

// This is a simple PWA-like tracker page for the van owner
export default function TrackerPage() {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('offline');
  const [selectedZone, setSelectedZone] = useState('');
  const [zones, setZones] = useState([]);
  const [tracking, setTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('tracker_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputToken, setInputToken] = useState('');

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

  // Authenticate with token
  const handleAuth = () => {
    if (inputToken.trim()) {
      localStorage.setItem('tracker_token', inputToken.trim());
      setToken(inputToken.trim());
      setIsAuthenticated(true);
      toast.success('Authenticated successfully');
    } else {
      toast.error('Please enter a token');
    }
  };

  // Update location to server
  const updateServerLocation = useCallback(async (lat, lng) => {
    if (!token) return;
    
    try {
      await axios.post(`${API}/van-location/update?token=${token}`, {
        lat,
        lng,
        status,
        current_zone: selectedZone || null
      });
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error updating location:', err);
      if (err.response?.status === 401) {
        setError('Invalid token - please check your tracker token');
        toast.error('Invalid token');
      } else {
        setError(`Failed to update: ${err.response?.data?.detail || err.message}`);
      }
    }
  }, [token, status, selectedZone]);

  // Watch position
  useEffect(() => {
    let watchId;
    
    if (tracking && isAuthenticated) {
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
  }, [tracking, isAuthenticated, updateServerLocation]);

  // Update status to server when it changes
  useEffect(() => {
    if (location && isAuthenticated) {
      updateServerLocation(location.lat, location.lng);
    }
  }, [status, selectedZone]);

  const toggleTracking = () => {
    if (tracking) {
      setTracking(false);
      setStatus('offline');
    } else {
      setTracking(true);
      setStatus('available');
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'available': return 'bg-emerald-500';
      case 'preparing': return 'bg-amber-500';
      case 'traveling': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-espresso flex items-center justify-center p-4" data-testid="tracker-auth">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <img src={LOGO_URL} alt="Espresso Beso" className="h-16 mx-auto mb-6" />
          <h1 className="font-serif text-2xl text-espresso text-center mb-2">Van Tracker</h1>
          <p className="text-espresso/70 text-center mb-6 text-sm">
            Enter your tracker token to start sharing your location
          </p>
          
          <input
            type="password"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            placeholder="Enter tracker token"
            className="w-full p-4 border border-cream-dark rounded-xl mb-4 focus:ring-2 focus:ring-gold outline-none"
            data-testid="tracker-token-input"
          />
          
          <Button
            onClick={handleAuth}
            className="w-full bg-burgundy hover:bg-burgundy-dark text-white rounded-full py-6"
            data-testid="tracker-auth-btn"
          >
            Authenticate
          </Button>
          
          <p className="text-xs text-espresso/50 text-center mt-4">
            Get your token from the admin settings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-espresso" data-testid="tracker-page">
      {/* Header */}
      <header className="bg-espresso border-b border-white/10 p-4 flex items-center justify-between">
        <img src={LOGO_URL} alt="Espresso Beso" className="h-10" />
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()} text-white`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </header>

      <div className="p-4 space-y-4">
        {/* Tracking Toggle */}
        <div className="bg-white rounded-2xl p-6 text-center">
          <button
            onClick={toggleTracking}
            className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center transition-all duration-300 ${
              tracking 
                ? 'bg-burgundy shadow-floating animate-pulse' 
                : 'bg-gray-200'
            }`}
            data-testid="tracking-toggle"
          >
            <Power className={`w-12 h-12 ${tracking ? 'text-white' : 'text-gray-400'}`} />
          </button>
          <p className="mt-4 font-semibold text-espresso">
            {tracking ? 'Tracking Active' : 'Tap to Start'}
          </p>
          {lastUpdate && (
            <p className="text-sm text-espresso/60 mt-1">
              Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Status Selector */}
        <div className="bg-white rounded-2xl p-4">
          <label className="block text-sm font-medium text-espresso mb-2">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {['available', 'preparing', 'traveling', 'offline'].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`p-3 rounded-xl text-sm font-medium transition-all ${
                  status === s 
                    ? 'bg-gold text-white' 
                    : 'bg-cream text-espresso hover:bg-cream-dark'
                }`}
                data-testid={`status-${s}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Zone Selector */}
        <div className="bg-white rounded-2xl p-4">
          <label className="block text-sm font-medium text-espresso mb-2">Current Zone</label>
          <Select value={selectedZone || "none"} onValueChange={(val) => setSelectedZone(val === "none" ? "" : val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Zone</SelectItem>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.name}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Info */}
        {location && (
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-gold" />
              <span className="font-medium text-espresso">Current Location</span>
            </div>
            <p className="text-sm text-espresso/70">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Manual Refresh */}
        <Button
          onClick={() => location && updateServerLocation(location.lat, location.lng)}
          disabled={!tracking || !location}
          className="w-full bg-gold hover:bg-gold-light text-white rounded-full py-4"
          data-testid="manual-refresh"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Force Update
        </Button>
      </div>
    </div>
  );
}
