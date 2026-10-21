import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API, useShopStatus } from '../App';
import { Button } from '../components/ui/button';
import { 
  MapPin, Calendar, ArrowRight, CheckCircle,
  Building2, Heart, Trophy, Sparkles, GraduationCap, Users, Home,
  ChevronRight, Phone
} from 'lucide-react';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_8eb9ed2b-80c2-447f-a8a6-53bb1c68d925/artifacts/82psuie2_Espresso-Vesso-Logo%20ready1.png";

export default function HomePage() {
  const { shopStatus } = useShopStatus();
  const [guestCount, setGuestCount] = useState(25);
  const [livePackages, setLivePackages] = useState(null);
  const [liveEventTypes, setLiveEventTypes] = useState(null);

  useEffect(() => {
    axios.get(`${API}/event-settings`).then((res) => {
      setLivePackages(res.data.packages);
      setLiveEventTypes(res.data.event_types);
    }).catch(() => {});
  }, []);

  const eventVisuals = {
    corporate: { icon: Building2, image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=400&fit=crop' },
    wedding: { icon: Heart, image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop' },
    graduation: { icon: GraduationCap, image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&h=400&fit=crop' },
    birthday: { icon: Home, image: 'https://images.pexels.com/photos/5638599/pexels-photo-5638599.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop' },
    sports: { icon: Trophy, image: 'https://images.unsplash.com/photo-1598880513655-d1c6d4b2dfbf?w=600&h=400&fit=crop' },
    community: { icon: Users, image: 'https://images.unsplash.com/photo-1587517947347-293792660d1f?w=600&h=400&fit=crop' },
  };
  const eventTypes = liveEventTypes
    ? Object.entries(liveEventTypes)
        .filter(([key, v]) => v.enabled && eventVisuals[key])
        .map(([key, v]) => ({ key, name: v.name, desc: v.description, ...eventVisuals[key] }))
    : [];

  const basePackages = [
    { id: 'visit', name: 'Coffee Visit', price: 7, unit: '/drink', guests: '5-10 drinks', duration: '1 hour', desc: 'Quick artisanal pop-up for small team gatherings.', features: ['Fresh handcrafted espresso', 'Full barista service', 'Dairy & Oat milk included'], popular: false, badge: 'Flexible' },
    { id: 'small', name: 'Small Event', price: 300, unit: 'flat', guests: '11-25 people', duration: '2 hours', desc: 'Unlimited craft coffee for intimate celebrations.', features: ['Unlimited drinks', 'Full mobile bar setup', 'House-made syrups', 'Matcha & Chai options'], popular: true, badge: 'Most Popular' },
    { id: 'medium', name: 'Medium Event', price: 500, unit: 'flat', guests: '25-50 people', duration: '3 hours', desc: 'Ultimate espresso bar for medium gatherings.', features: ['Unlimited custom drinks', 'High-capacity service', 'Custom event branding option', 'Cold brews & seasonal specials'], popular: false, badge: 'Best Value' },
  ];

  const packages = basePackages
    .map((pkg) => {
      const live = livePackages?.[pkg.id];
      if (!live) return pkg;
      return { ...pkg, name: live.name, price: live.price, guests: live.people_range, duration: live.duration, enabled: live.enabled, unit: live.price_type === 'per_drink' ? '/drink' : 'flat' };
    })
    .filter((pkg) => pkg.enabled !== false);

  const findPkg = (id) => packages.find((p) => p.id === id);
  const getEstimatedPackage = () => {
    const visit = findPkg('visit');
    const small = findPkg('small');
    const medium = findPkg('medium');
    if (guestCount <= 10 && visit) return { name: visit.name, price: guestCount * visit.price, unit: 'estimated' };
    if (guestCount <= 25 && small) return { name: small.name, price: small.price, unit: 'flat rate' };
    if (guestCount > 50) return null;
    const fallback = medium || small || visit;
    if (!fallback) return null;
    return { name: fallback.name, price: fallback.price, unit: fallback.id === 'visit' ? '/drink' : 'flat rate' };
  };
  const estimatedPackage = getEstimatedPackage();

  const steps = [
    { num: '01', title: 'Choose Your Package', desc: 'Select the perfect package for your guest count and event type.' },
    { num: '02', title: 'Pick Your Date', desc: 'Tell us when and where your event is happening.' },
    { num: '03', title: 'We Set Up', desc: 'Our barista arrives 30 min early with full espresso bar setup.' },
    { num: '04', title: 'Guests Enjoy', desc: 'Unlimited handcrafted drinks served with a smile.' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E1]" data-testid="homepage">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D]"></div>
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&h=1080&fit=crop"
            alt="Coffee atmosphere"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B6914]/20 rounded-full text-[#D4AF37] text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Events & Catering
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Artisanal Espresso<br />
                <span className="text-[#D4AF37]">Brought to Your Event</span>
              </h1>
              <p className="text-xl text-white/80 mb-8 max-w-lg">
                We bring a complete mobile espresso bar to your venue. Corporate meetings, weddings, parties — premium coffee, professional barista, unforgettable experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link to="/book-event">
                  <Button 
                    className="bg-[#8B1A1A] hover:bg-[#701515] text-white rounded-full px-8 py-6 text-lg font-semibold gap-2 w-full sm:w-auto"
                    data-testid="hero-book-event-button"
                  >
                    <Calendar className="w-5 h-5" />
                    Book Your Event
                  </Button>
                </Link>
                <a href="#calculator">
                  <Button 
                    variant="outline" 
                    className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white rounded-full px-8 py-6 text-lg w-full sm:w-auto"
                    data-testid="hero-quote-calc-button"
                  >
                    Get Instant Quote
                  </Button>
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/70 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                  <span>No Hidden Fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                  <span>Professional Setup</span>
                </div>
              </div>
            </div>
            
            {/* Quick Quote Calculator Card */}
            <div id="calculator" className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 scroll-mt-24" data-testid="quote-calculator">
              <h3 className="text-white font-serif text-2xl mb-2">Instant Quote</h3>
              <p className="text-white/60 text-sm mb-6">Slide to see your estimated price</p>
              
              <div className="mb-6">
                <label className="text-white/80 text-sm mb-2 block">How many guests?</label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                  data-testid="guest-calculator-slider"
                />
                <div className="flex justify-between text-white/60 text-xs mt-1">
                  <span>5</span>
                  <span className="text-[#D4AF37] font-bold text-lg" data-testid="guest-count-value">{guestCount}</span>
                  <span>60+</span>
                </div>
              </div>
              
              <div className="bg-[#1A1A1A] rounded-2xl p-6 mb-6" data-testid="calculator-instant-quote-display">
                <p className="text-white/60 text-sm mb-1">Recommended Package</p>
                <p className="text-white font-serif text-xl mb-2" data-testid="calculator-package-name">{estimatedPackage?.name || 'Custom Quote (50+ guests)'}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[#D4AF37] font-bold text-4xl" data-testid="calculator-package-price">{estimatedPackage ? `$${estimatedPackage.price}` : 'Contact us'}</span>
                  <span className="text-white/60 text-sm">{estimatedPackage?.unit}</span>
                </div>
              </div>
              
              <Link to="/book-event">
                <Button 
                  className="w-full bg-[#D4AF37] hover:bg-[#B8960F] text-[#1A1A1A] rounded-full py-6 font-semibold"
                  data-testid="calculator-submit-quote-button"
                >
                  {estimatedPackage ? 'Book This Package' : 'Request Custom Quote'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section id="packages" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B1A1A] mb-4 block">Pricing</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1A1A1A] mb-4">
              Simple, Transparent Packages
            </h2>
            <p className="text-[#5C5446] max-w-2xl mx-auto">
              Choose the perfect package for your event. All packages include professional barista service and premium coffee.
            </p>
          </div>
          
          <div className={`grid gap-6 ${packages.length >= 3 ? 'md:grid-cols-3' : packages.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'max-w-md mx-auto'}`}>
            {packages.map((pkg) => (
              <div 
                key={pkg.id}
                className={`rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 ${
                  pkg.popular 
                    ? 'bg-[#1A1A1A] text-white ring-4 ring-[#D4AF37]' 
                    : 'bg-[#F5F0E1] hover:shadow-xl'
                }`}
                data-testid={`package-card-${pkg.id}`}
              >
                {pkg.badge && (
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-4 ${
                    pkg.popular ? 'bg-[#D4AF37] text-[#1A1A1A]' : 'bg-[#8B1A1A]/10 text-[#8B1A1A]'
                  }`}>
                    {pkg.badge}
                  </span>
                )}
                <h3 className={`font-serif text-2xl mb-1 ${pkg.popular ? 'text-white' : 'text-[#1A1A1A]'}`}>
                  {pkg.name}
                </h3>
                <p className={`text-sm mb-4 ${pkg.popular ? 'text-white/60' : 'text-[#5C5446]'}`}>
                  {pkg.guests} • {pkg.duration}
                </p>
                <div className="mb-4">
                  <span className={`text-4xl font-bold ${pkg.popular ? 'text-[#D4AF37]' : 'text-[#8B6914]'}`} data-testid={`package-price-${pkg.id}`}>
                    ${pkg.price}
                  </span>
                  <span className={`text-sm ${pkg.popular ? 'text-white/60' : 'text-[#5C5446]'}`}>
                    {' '}{pkg.unit}
                  </span>
                </div>
                <p className={`text-sm mb-6 ${pkg.popular ? 'text-white/70' : 'text-[#5C5446]'}`}>
                  {pkg.desc}
                </p>
                <ul className="space-y-2 mb-6">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${pkg.popular ? 'text-[#D4AF37]' : 'text-green-600'}`} />
                      <span className={pkg.popular ? 'text-white/80' : 'text-[#5C5446]'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/book-event">
                  <Button 
                    className={`w-full rounded-full py-5 ${
                      pkg.popular 
                        ? 'bg-[#D4AF37] hover:bg-[#B8960F] text-[#1A1A1A]' 
                        : 'bg-[#8B1A1A] hover:bg-[#701515] text-white'
                    }`}
                    data-testid={`package-book-button-${pkg.id}`}
                  >
                    Book Now
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Types Section */}
      <section className="py-20 bg-[#F5F0E1]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B1A1A] mb-4 block">What We Do</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1A1A1A] mb-4">
              Perfect for Any Occasion
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventTypes.map((event) => {
              const Icon = event.icon;
              return (
                <div 
                  key={event.key}
                  className="group bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                  data-testid={`event-type-${event.key}`}
                >
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={event.image}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#8B1A1A]/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-[#8B1A1A]" />
                      </div>
                      <h3 className="font-serif text-lg text-[#1A1A1A]">{event.name}</h3>
                    </div>
                    <p className="text-sm text-[#5C5446]">{event.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37] mb-4 block">Process</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-4">
              How It Works
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Booking your mobile espresso bar is simple. Here's what to expect.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="text-[#D4AF37] font-serif text-5xl font-bold mb-4 opacity-50">{step.num}</div>
                <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-white/60 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/book-event">
              <Button className="bg-[#8B1A1A] hover:bg-[#701515] text-white rounded-full px-8 py-6 text-lg w-full sm:w-auto" data-testid="how-it-works-book-button">
                Book Your Event Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Daily Street Service Banner */}
      <section className="py-12 bg-[#E6DCC3]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#8B1A1A] flex items-center justify-center">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-[#1A1A1A]">Looking for our daily pop-up?</h3>
                <p className="text-[#5C5446] text-sm">Check our live location & order individual drinks for pickup</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {shopStatus?.is_online ? (
                <span className="flex items-center gap-2 text-green-700 bg-green-100 px-4 py-2 rounded-full text-sm font-medium" data-testid="shop-status-online">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  We're Online
                </span>
              ) : (
                <span className="flex items-center gap-2 text-[#5C5446] bg-white px-4 py-2 rounded-full text-sm" data-testid="shop-status-offline">
                  Currently Offline
                </span>
              )}
              <Link to="/live" data-testid="secondary-street-location-link">
                <Button variant="outline" className="bg-transparent border-[#8B1A1A] text-[#8B1A1A] hover:bg-[#8B1A1A] hover:text-white rounded-full">
                  See Live Map
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#8B1A1A]">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-6">
            Ready to Elevate Your Event?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Let's create a memorable coffee experience for your guests. Get in touch today for a custom quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-event">
              <Button className="bg-[#D4AF37] hover:bg-[#B8960F] text-[#1A1A1A] rounded-full px-8 py-6 text-lg font-semibold w-full sm:w-auto" data-testid="cta-book-event-button">
                <Calendar className="w-5 h-5 mr-2" />
                Book Your Event
              </Button>
            </Link>
            <a href="tel:+15095551234" data-testid="cta-call-link">
              <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 hover:text-white rounded-full px-8 py-6 text-lg w-full sm:w-auto">
                <Phone className="w-5 h-5 mr-2" />
                Call Us
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] pt-12 pb-36 -mb-24 md:pb-20 md:-mb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#F5F0E1] rounded-2xl px-3 py-2"><img src={LOGO_URL} alt="Espresso Beso" className="h-10 w-auto" data-testid="footer-logo" /></div>
              <div>
                <p className="text-white font-serif text-lg">Espresso Beso</p>
                <p className="text-white/50 text-sm">Mobile Espresso & Event Catering</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-white/60 text-sm">
              <Link to="/live" className="hover:text-white transition-colors" data-testid="footer-live-link">Live Location</Link>
              <Link to="/events" className="hover:text-white transition-colors">Events</Link>
              <Link to="/menu" className="hover:text-white transition-colors">Menu</Link>
              <Link to="/book-event" className="hover:text-white transition-colors">Book Event</Link>
            </div>
            <p className="text-white/40 text-sm">© {new Date().getFullYear()} Espresso Beso. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
