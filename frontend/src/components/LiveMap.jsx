import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { Crosshair } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Get status color for marker
const getMarkerColor = (status, mode) => {
  // Stationary mode uses a special burgundy color
  if (mode === 'stationary') {
    return { bg: '#8B1A1A', shadow: 'rgba(139, 26, 26, 0.4)', text: '📍 Parked Here!', isStationary: true, isTraveling: false };
  }
  
  switch (status) {
    case 'available':
      return { bg: '#10B981', shadow: 'rgba(16, 185, 129, 0.4)', text: 'Available ☕', isStationary: false, isTraveling: false };
    case 'preparing':
      return { bg: '#F59E0B', shadow: 'rgba(245, 158, 11, 0.4)', text: 'Preparing...', isStationary: false, isTraveling: false };
    case 'traveling':
      return { bg: '#3B82F6', shadow: 'rgba(59, 130, 246, 0.4)', text: '🚐 On my way!', isStationary: false, isTraveling: true };
    default:
      return { bg: '#9CA3AF', shadow: 'rgba(156, 163, 175, 0.4)', text: 'Offline', isStationary: false, isTraveling: false };
  }
};

// Create dynamic coffee marker icon with speech bubble
const createCoffeeIcon = (status, zone, mode, stationaryLocationName, travelingTo) => {
  const colors = getMarkerColor(status, mode);
  
  // Determine what text to show below the status
  let locationText = '';
  if (colors.isTraveling && travelingTo) {
    // Show who we're traveling to
    locationText = `➡️ ${travelingTo}`;
  } else if (mode === 'stationary' && stationaryLocationName) {
    locationText = stationaryLocationName;
  } else if (zone) {
    locationText = `📍 ${zone}`;
  }
  
  // Different icon for stationary mode - a pin/location marker
  // Different icon for traveling - a van/car
  const iconSvg = colors.isStationary ? `
    <!-- Location Pin Icon for Stationary -->
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3" fill="${colors.bg}"/>
    </svg>
  ` : colors.isTraveling ? `
    <!-- Van/Truck Icon for Traveling -->
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
      <path d="M15 18H9"/>
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
      <circle cx="17" cy="18" r="2"/>
      <circle cx="7" cy="18" r="2"/>
    </svg>
  ` : `
    <!-- Coffee Cup Icon for Mobile -->
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
      <line x1="6" x2="6" y1="2" y2="4"/>
      <line x1="10" x2="10" y1="2" y2="4"/>
      <line x1="14" x2="14" y1="2" y2="4"/>
    </svg>
  `;
  
  return L.divIcon({
    className: 'custom-coffee-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <!-- Speech Bubble -->
        <div style="
          position: relative;
          background: ${colors.isTraveling ? '#DBEAFE' : colors.isStationary ? '#FEF3C7' : 'white'};
          border-radius: 12px;
          padding: 6px 12px;
          margin-bottom: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.15);
          white-space: nowrap;
          font-family: 'Manrope', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: ${colors.bg};
          border: 2px solid ${colors.bg};
          ${colors.isStationary || colors.isTraveling ? 'max-width: 200px; white-space: normal; text-align: center;' : ''}
        ">
          ${colors.text}
          ${locationText ? `<div style="font-size: 11px; color: ${colors.isTraveling ? '#1D4ED8' : '#8B6914'}; font-weight: 600; margin-top: 2px;">${locationText}</div>` : ''}
          <!-- Triangle pointer -->
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid ${colors.bg};
          "></div>
          <div style="
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid ${colors.isStationary ? '#FEF3C7' : 'white'};
          "></div>
        </div>
        <!-- Icon Circle -->
        <div style="
          width: 48px;
          height: 48px;
          background: ${colors.bg};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px ${colors.shadow};
          border: 3px solid white;
          ${colors.isStationary ? '' : 'animation: pulse 2s infinite;'}
        ">
          ${iconSvg}
        </div>
        ${colors.isStationary ? `
        <!-- Stationary indicator ring -->
        <div style="
          position: absolute;
          bottom: 0;
          width: 60px;
          height: 60px;
          border: 3px dashed ${colors.bg};
          border-radius: 50%;
          opacity: 0.5;
          animation: stationaryRing 3s infinite;
        "></div>
        ` : ''}
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes stationaryRing {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.2; }
        }
      </style>
    `,
    iconSize: [120, 120],
    iconAnchor: [60, 110],
    popupAnchor: [0, -110],
  });
};

// Component to recenter map when location changes
function MapUpdater({ position, shouldCenter, mapRef }) {
  const map = useMap();
  
  useEffect(() => {
    if (mapRef) {
      mapRef.current = map;
    }
  }, [map, mapRef]);
  
  useEffect(() => {
    if (position && shouldCenter) {
      map.setView(position, map.getZoom(), { animate: true });
    }
  }, [position, shouldCenter, map]);
  
  return null;
}

export default function LiveMap({ className = "" }) {
  const [vanLocation, setVanLocation] = useState(null);
  const [prevLocation, setPrevLocation] = useState(null);
  const [position, setPosition] = useState([47.6588, -117.4260]); // Default: Spokane
  const [shouldCenter, setShouldCenter] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [showUpdateBadge, setShowUpdateBadge] = useState(false);
  const mapRef = React.useRef(null);

  // Create marker icon based on current status, zone, and mode
  const markerIcon = useMemo(() => {
    // Determine what name to show when traveling
    const travelingTo = vanLocation?.status === 'traveling' ? vanLocation?.traveling_to_name : null;
    
    return createCoffeeIcon(
      vanLocation?.status, 
      vanLocation?.current_zone, 
      vanLocation?.mode,
      vanLocation?.stationary_location_name,
      travelingTo
    );
  }, [vanLocation?.status, vanLocation?.current_zone, vanLocation?.mode, vanLocation?.stationary_location_name, vanLocation?.traveling_to_name]);

  // Center map on van
  const centerOnVan = () => {
    if (mapRef.current && position) {
      mapRef.current.setView(position, 15, { animate: true });
      setShowUpdateBadge(false);
    }
  };

  // Poll for van location every 5 seconds
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await axios.get(`${API}/van-location`);
        const newLocation = response.data;
        
        if (newLocation && newLocation.lat && newLocation.lng) {
          const newPos = [newLocation.lat, newLocation.lng];
          
          // Check if location or status changed
          const locationChanged = !prevLocation || 
            Math.abs(newLocation.lat - (prevLocation?.lat || 0)) > 0.0001 ||
            Math.abs(newLocation.lng - (prevLocation?.lng || 0)) > 0.0001;
          const statusChanged = prevLocation && newLocation.status !== prevLocation.status;
          
          setPosition(newPos);
          setVanLocation(newLocation);
          setPrevLocation(newLocation);
          
          // First load: center on van
          if (isFirstLoad && newLocation.status !== 'offline') {
            setShouldCenter(true);
            setIsFirstLoad(false);
            setTimeout(() => setShouldCenter(false), 500);
          } 
          // After first load: show update badge if van moved or status changed
          else if (!isFirstLoad && (locationChanged || statusChanged) && newLocation.status !== 'offline') {
            setShowUpdateBadge(true);
          }
        }
      } catch (error) {
        console.error('Error fetching van location:', error);
      }
    };

    // Fetch immediately
    fetchLocation();
    
    // Then poll every 5 seconds
    const interval = setInterval(fetchLocation, 5000);
    
    return () => clearInterval(interval);
  }, [isFirstLoad, prevLocation]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500';
      case 'preparing':
        return 'bg-amber-500';
      case 'traveling':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'preparing':
        return 'Preparing Orders';
      case 'traveling':
        return 'On the Way';
      default:
        return 'Offline';
    }
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-card ${className}`} data-testid="live-map">
      {/* Find Van Button - with pulse when van moves */}
      {vanLocation && vanLocation.status !== 'offline' && (
        <button
          onClick={centerOnVan}
          className={`absolute bottom-4 right-4 z-[1000] bg-burgundy hover:bg-burgundy-dark text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-floating transition-all ${showUpdateBadge ? 'animate-pulse ring-4 ring-burgundy/30' : ''}`}
          data-testid="find-van-btn"
        >
          <Crosshair className="w-4 h-4" />
          <span className="text-sm font-medium">
            {showUpdateBadge ? '📍 Van Moved!' : 'Find Van'}
          </span>
        </button>
      )}

      {/* Offline indicator */}
      {(!vanLocation || vanLocation.status === 'offline') && (
        <div className="absolute top-4 left-4 z-[1000] glass rounded-full px-4 py-2 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-400"></span>
          <span className="text-sm font-medium text-espresso">Currently Offline</span>
        </div>
      )}

      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater position={position} shouldCenter={shouldCenter} mapRef={mapRef} />
        
        {vanLocation && vanLocation.status !== 'offline' && (
          <Marker position={position} icon={markerIcon}>
            <Popup>
              <div className="text-center p-2">
                <p className="font-serif font-semibold text-espresso">Espresso Beso</p>
                {vanLocation?.status === 'traveling' && vanLocation?.traveling_to_name ? (
                  <>
                    <p className="text-sm font-medium text-blue-600 mt-1">🚐 On the way!</p>
                    <p className="text-sm text-blue-800 font-medium mt-1">
                      Heading to {vanLocation.traveling_to_name}
                    </p>
                    {vanLocation?.traveling_to_address && (
                      <p className="text-xs text-espresso/60 mt-1">{vanLocation.traveling_to_address}</p>
                    )}
                  </>
                ) : vanLocation?.mode === 'stationary' ? (
                  <>
                    <p className="text-sm font-medium text-burgundy mt-1">Parked & Ready!</p>
                    {vanLocation?.stationary_location_name && (
                      <p className="text-sm text-gold font-medium mt-1">{vanLocation.stationary_location_name}</p>
                    )}
                    <p className="text-xs text-espresso/60 mt-2">Come find us here!</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-espresso/70">{getStatusText(vanLocation?.status)}</p>
                    {vanLocation?.current_zone && (
                      <p className="text-sm text-gold font-medium mt-1">{vanLocation.current_zone}</p>
                    )}
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
