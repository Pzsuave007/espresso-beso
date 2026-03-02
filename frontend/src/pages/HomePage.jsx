import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, Coffee, Users, Calendar, Navigation, Loader2, CheckCircle, XCircle } from 'lucide-react';
import LiveMap from '../components/LiveMap';
import { Button } from '../components/ui/button';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const HERO_IMAGE = "https://images.unsplash.com/photo-1559001724-fbad036dbc9e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2ODl8MHwxfHNlYXJjaHwxfHxlc3ByZXNzbyUyMGxhdHRlJTIwYXJ0JTIwY2xvc2UlMjB1cHxlbnwwfHx8fDE3NzIyMzc1Mjd8MA&ixlib=rb-4.1.0&q=85";
const LOGO_DARK = "https://customer-assets.emergentagent.com/job_8eb9ed2b-80c2-447f-a8a6-53bb1c68d925/artifacts/82psuie2_Espresso-Vesso-Logo%20ready1.png";

// Distance threshold in miles
const NEARBY_DISTANCE_MILES = 1;

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function HomePage() {
  const [todayZones, setTodayZones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Nearby check state
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [distance, setDistance] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [vanLocation, setVanLocation] = useState(null);

  useEffect(() => {
    // Fetch today's schedule
    const fetchTodaySchedule = async () => {
      try {
        const response = await axios.get(`${API}/zones/today/schedule`);
        setTodayZones(response.data);
      } catch (error) {
        console.error('Error fetching today schedule:', error);
        // Fallback to all active zones
        try {
          const fallback = await axios.get(`${API}/zones/active`);
          setTodayZones(fallback.data);
        } catch (e) {
          console.error('Error fetching fallback zones:', e);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTodaySchedule();

    // Fetch van location for stationary mode check
    const fetchVanLocation = async () => {
      try {
        const response = await axios.get(`${API}/van-location`);
        setVanLocation(response.data);
      } catch (error) {
        console.error('Error fetching van location:', error);
      }
    };
    fetchVanLocation();
    
    // Poll van location every 10 seconds
    const interval = setInterval(fetchVanLocation, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const checkIfNearby = async () => {
    setCheckingLocation(true);
    setLocationError(null);
    
    try {
      // Get van location first
      const vanRes = await axios.get(`${API}/van-location`);
      const van = vanRes.data;
      setVanLocation(van);
      
      if (!van || van.status === 'offline') {
        setLocationError("We're currently offline. Please request a visit for later!");
        setCheckingLocation(false);
        return;
      }

      // Get customer's location
      if (!navigator.geolocation) {
        setLocationError("Your browser doesn't support location. Please request a visit.");
        setCheckingLocation(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const dist = calculateDistance(latitude, longitude, van.lat, van.lng);
          
          setDistance(dist);
          setIsNearby(dist <= NEARBY_DISTANCE_MILES);
          setLocationChecked(true);
          setCheckingLocation(false);
        },
        (error) => {
          console.error('Location error:', error);
          if (error.code === 1) {
            setLocationError("Location access denied. You can still request a visit!");
          } else {
            setLocationError("Couldn't get your location. Please try again or request a visit.");
          }
          setCheckingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (error) {
      console.error('Error checking location:', error);
      setLocationError("Something went wrong. Please try again.");
      setCheckingLocation(false);
    }
  };

  const resetLocationCheck = () => {
    setLocationChecked(false);
    setIsNearby(false);
    setDistance(null);
    setLocationError(null);
  };

  return (
    <div className="page-container" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[350px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-espresso/70 via-espresso/50 to-cream"></div>
        </div>
        
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <img 
            src={LOGO_DARK} 
            alt="Espresso Beso" 
            className="h-24 md:h-32 w-auto mb-4 drop-shadow-lg animate-fade-in"
          />
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white font-bold tracking-tight mb-3 drop-shadow-lg animate-fade-in stagger-1">
            We Come To You
          </h1>
          <p className="text-base md:text-lg text-white/90 max-w-lg mb-6 animate-fade-in stagger-2">
            Premium mobile espresso delivered to your location. Request a visit and we'll bring the café to you!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 animate-fade-in stagger-3">
            <Link to="/group-request">
              <Button 
                className="bg-burgundy hover:bg-burgundy-dark text-white rounded-full px-8 py-5 text-lg shadow-floating"
                data-testid="request-visit-btn"
              >
                <Users className="w-5 h-5 mr-2" />
                Request a Visit
              </Button>
            </Link>
            <Link to="/menu">
              <Button 
                variant="outline"
                className="bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 rounded-full px-8 py-5 text-lg"
                data-testid="view-menu-btn"
              >
                <Coffee className="w-5 h-5 mr-2" />
                View Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Map Section */}
      <section className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="section-title mb-2">Where Am I Now?</h2>
          <p className="text-espresso/70">
            Track our coffee van live and check if we're nearby!
          </p>
        </div>

        {/* Stationary Mode Banner */}
        {vanLocation?.mode === 'stationary' && vanLocation?.status !== 'offline' && (
          <div className="mb-6 bg-gradient-to-r from-burgundy to-burgundy-dark rounded-2xl p-6 text-white shadow-floating animate-fade-in" data-testid="stationary-banner">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
                  📍
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold">We're Parked Today!</h3>
                  {vanLocation?.stationary_location_name && (
                    <p className="text-white/90 text-lg font-medium mt-1">
                      {vanLocation.stationary_location_name}
                    </p>
                  )}
                  <p className="text-white/70 text-sm mt-1">
                    Come find us at this location - no delivery today!
                  </p>
                </div>
              </div>
              <Link to="/menu">
                <Button className="bg-white text-burgundy hover:bg-cream rounded-full px-6 py-5 font-semibold">
                  <Coffee className="w-5 h-5 mr-2" />
                  Order for Pickup
                </Button>
              </Link>
            </div>
          </div>
        )}
        
        <div className="h-[400px] md:h-[450px]">
          <LiveMap className="h-full" />
        </div>

        {/* Check If Nearby Section */}
        <div className="mt-6 max-w-xl mx-auto">
          {/* Stationary Mode - Different CTA */}
          {vanLocation?.mode === 'stationary' && vanLocation?.status !== 'offline' && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-amber-800 mb-2">
                Come Find Us!
              </h3>
              <p className="text-amber-700 mb-2">
                We're parked at a fixed location today
              </p>
              {vanLocation?.stationary_location_name && (
                <p className="text-amber-900 font-semibold text-lg mb-4">
                  {vanLocation.stationary_location_name}
                </p>
              )}
              <Link to="/menu">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-6">
                  <Coffee className="w-5 h-5 mr-2" />
                  View Menu & Order
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Mode - Original Check Nearby Flow */}
          {vanLocation?.mode !== 'stationary' && !locationChecked && !checkingLocation && !locationError && (
            <div className="bg-white rounded-2xl shadow-card p-6 text-center">
              <h3 className="font-serif text-xl font-semibold text-espresso mb-2">
                Am I near you right now?
              </h3>
              <p className="text-espresso/70 text-sm mb-4">
                Check your distance - if I'm close, you can order with no minimum!
              </p>
              <Button
                onClick={checkIfNearby}
                className="bg-gold hover:bg-gold-light text-white rounded-full px-6 py-5"
                data-testid="check-nearby-btn"
              >
                <Navigation className="w-5 h-5 mr-2" />
                Check If I'm Nearby
              </Button>
            </div>
          )}

          {checkingLocation && (
            <div className="bg-white rounded-2xl shadow-card p-6 text-center">
              <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-3" />
              <p className="text-espresso/70">Checking your location...</p>
            </div>
          )}

          {locationError && (
            <div className="bg-white rounded-2xl shadow-card p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-espresso/70 mb-4">{locationError}</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={resetLocationCheck}
                  variant="outline"
                  className="rounded-full"
                >
                  Try Again
                </Button>
                <Link to="/group-request">
                  <Button className="bg-burgundy hover:bg-burgundy-dark text-white rounded-full">
                    Request a Visit
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {locationChecked && isNearby && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-emerald-800 mb-2">
                🎉 I'm Nearby!
              </h3>
              <p className="text-emerald-700 mb-1">
                Only <span className="font-bold">{distance?.toFixed(1)} miles</span> away
              </p>
              <p className="text-emerald-600 text-lg font-semibold mb-4">
                I'm nearby - NO MINIMUM ORDER! 👋
              </p>
              {vanLocation?.current_zone && (
                <p className="text-emerald-700 mb-4">
                  📍 Currently at: <span className="font-semibold">{vanLocation.current_zone}</span>
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/menu">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6">
                    <Coffee className="w-5 h-5 mr-2" />
                    View Menu & Order
                  </Button>
                </Link>
                <Button
                  onClick={resetLocationCheck}
                  variant="outline"
                  className="border-emerald-400 text-emerald-700 rounded-full"
                >
                  Check Again
                </Button>
              </div>
            </div>
          )}

          {locationChecked && !isNearby && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-amber-800 mb-2">
                I'm a Bit Far
              </h3>
              <p className="text-amber-700 mb-1">
                You're <span className="font-bold">{distance?.toFixed(1)} miles</span> away
              </p>
              <p className="text-amber-600 mb-4">
                Request a visit and I'll come to you! (5 drink minimum)
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/group-request">
                  <Button className="bg-burgundy hover:bg-burgundy-dark text-white rounded-full px-6">
                    <Users className="w-5 h-5 mr-2" />
                    Request a Visit
                  </Button>
                </Link>
                <Button
                  onClick={resetLocationCheck}
                  variant="outline"
                  className="border-amber-400 text-amber-700 rounded-full"
                >
                  Check Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 md:px-8 py-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title mb-10 text-center">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Check If I'm Nearby",
                description: "See my live location. If I'm close, order directly with no minimum!",
                icon: Navigation,
              },
              {
                step: "2",
                title: "Or Request a Visit",
                description: "Too far? Request a visit to your location (5 drink minimum).",
                icon: Users,
              },
              {
                step: "3",
                title: "Fresh Coffee On-Site",
                description: "I'll prepare your drinks fresh right there. Hot, delicious, and ready!",
                icon: Coffee,
              },
            ].map((item, index) => (
              <div 
                key={item.step}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-burgundy" />
                </div>
                <span className="inline-block w-8 h-8 rounded-full bg-gold text-white font-semibold text-sm leading-8 mb-3">
                  {item.step}
                </span>
                <h3 className="font-serif text-xl font-semibold text-espresso mb-2">{item.title}</h3>
                <p className="text-espresso/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Today's Service Areas */}
      <section className="px-4 md:px-8 py-12 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="section-title mb-2">Today's Service Areas</h2>
          <p className="text-espresso/70">
            I'll be traveling through these areas or events today.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {todayZones.map((zone, index) => (
            <div 
              key={zone.id}
              className="bg-white rounded-2xl p-5 shadow-card hover:shadow-floating transition-all animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
              data-testid={`schedule-zone-${zone.id}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-serif font-semibold text-espresso">{zone.name}</h3>
              </div>
              {zone.time_windows && zone.time_windows.map((tw, i) => (
                <div key={i} className="flex items-center gap-2 text-espresso/70 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(tw.start)} - {formatTime(tw.end)}</span>
                </div>
              ))}
              <Link to="/group-request" className="mt-4 block">
                <Button 
                  variant="outline" 
                  className="w-full border-gold/30 text-gold hover:bg-gold hover:text-white rounded-full text-sm"
                >
                  Request Visit Here
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Perfect For Section */}
      <section className="px-4 md:px-8 py-12 bg-cream-dark/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title mb-8 text-center">Perfect For</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: "Office Breaks", 
                desc: "Treat your team to premium coffee",
                image: "https://images.unsplash.com/photo-1590649880765-91b1956b8276?w=400&h=300&fit=crop"
              },
              { 
                title: "Events", 
                desc: "Weddings, parties, corporate events",
                image: "https://images.unsplash.com/photo-1772127822525-7eda37383b9f?w=400&h=300&fit=crop"
              },
              { 
                title: "Neighborhoods", 
                desc: "Get your neighbors together",
                image: "https://images.unsplash.com/photo-1770790323277-c1ca469472db?w=400&h=300&fit=crop"
              },
              { 
                title: "Construction Sites", 
                desc: "Fuel the crew with great coffee",
                image: "https://images.unsplash.com/photo-1759542878135-bc80368e74ef?w=400&h=300&fit=crop"
              },
            ].map((item, index) => (
              <div 
                key={item.title}
                className="bg-white rounded-xl overflow-hidden shadow-card"
              >
                <div className="h-40 overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-serif font-semibold text-espresso mb-1">{item.title}</h3>
                  <p className="text-sm text-espresso/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-8 py-16 bg-espresso">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-cream font-bold mb-4">
            Ready for Great Coffee?
          </h2>
          <p className="text-cream/80 mb-8 text-lg">
            Check if I'm nearby for no-minimum orders, or request a visit to your location!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/group-request">
              <Button 
                className="bg-gold hover:bg-gold-light text-white rounded-full px-8 py-6 text-lg"
                data-testid="cta-request-btn"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Request a Visit
              </Button>
            </Link>
            <Link to="/menu">
              <Button 
                variant="outline"
                className="border-cream/30 text-cream hover:bg-cream/10 rounded-full px-8 py-6 text-lg"
              >
                <Coffee className="w-5 h-5 mr-2" />
                See Our Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Footer */}
      <footer className="bg-espresso text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo & Tagline */}
            <div className="text-center md:text-left">
              <h3 className="font-serif text-2xl font-bold text-gold">Espresso Beso</h3>
              <p className="text-cream/70 text-sm mt-1">Mobile Coffee, Made with Love ☕</p>
            </div>
            
            {/* Contact Links */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Phone */}
              <a 
                href="tel:503-985-6472"
                className="flex items-center gap-2 text-cream hover:text-gold transition-colors"
                data-testid="footer-phone"
              >
                <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <span className="font-medium">503-985-6472</span>
              </a>
              
              {/* Instagram */}
              <a 
                href="https://www.instagram.com/espressobeso"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-cream hover:text-gold transition-colors"
                data-testid="footer-instagram"
              >
                <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                </div>
                <span className="font-medium">@espressobeso</span>
              </a>
            </div>
          </div>
          
          {/* Bottom text */}
          <div className="mt-6 pt-6 border-t border-cream/10 text-center text-cream/50 text-sm">
            <p>Serving the Spokane area with mobile espresso goodness</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
