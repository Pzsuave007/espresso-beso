import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { 
  Briefcase, Heart, GraduationCap, Trophy, Cake, Users, Calendar,
  Coffee, CheckCircle, ArrowRight, Star, Clock, MapPin
} from 'lucide-react';

const iconMap = {
  'briefcase': Briefcase,
  'heart': Heart,
  'graduation-cap': GraduationCap,
  'trophy': Trophy,
  'cake': Cake,
  'users': Users,
  'calendar': Calendar,
};

export default function EventsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API}/event-settings`);
        setSettings(res.data);
      } catch (error) {
        console.error('Error fetching event settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const enabledEventTypes = settings?.event_types 
    ? Object.entries(settings.event_types).filter(([_, v]) => v.enabled)
    : [];

  const enabledPackages = settings?.packages
    ? Object.entries(settings.packages).filter(([_, v]) => v.enabled)
    : [];

  return (
    <div className="min-h-screen bg-cream" data-testid="events-page">
      {/* Hero Section */}
      <div className="relative bg-espresso text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/30 to-transparent"></div>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="text-center">
            <span className="inline-block px-4 py-2 bg-gold/20 rounded-full text-gold text-sm font-medium mb-6">
              Events & Catering
            </span>
            <h1 className="font-serif text-4xl md:text-6xl mb-6">
              Bring the <span className="text-gold">Coffee Experience</span><br />
              to Your Event
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              From corporate meetings to wedding celebrations, we bring premium espresso service directly to your special occasion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-event">
                <Button className="bg-gold hover:bg-gold/90 text-espresso rounded-full px-8 py-6 text-lg font-semibold gap-2">
                  <Calendar className="w-5 h-5" />
                  Book Your Event
                </Button>
              </Link>
              <a href="#packages">
                <Button variant="outline" className="border-white text-white hover:bg-white/10 rounded-full px-8 py-6 text-lg">
                  View Packages
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-espresso mb-4">Why Choose Espresso Beso?</h2>
            <p className="text-espresso/70 max-w-2xl mx-auto">We bring the full coffee shop experience to your location</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-8 h-8 text-gold" />
              </div>
              <h3 className="font-serif text-xl text-espresso mb-2">Premium Coffee</h3>
              <p className="text-espresso/70">Freshly made espresso drinks crafted by experienced baristas</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gold" />
              </div>
              <h3 className="font-serif text-xl text-espresso mb-2">We Come to You</h3>
              <p className="text-espresso/70">Our mobile espresso bar arrives at your location, fully equipped</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gold" />
              </div>
              <h3 className="font-serif text-xl text-espresso mb-2">Memorable Experience</h3>
              <p className="text-espresso/70">Create a unique coffee experience your guests will remember</p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Types */}
      <div className="py-16 bg-cream">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-espresso mb-4">Events We Serve</h2>
            <p className="text-espresso/70 max-w-2xl mx-auto">Perfect for any occasion, big or small</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {!loading && enabledEventTypes.map(([key, event]) => {
              const IconComponent = iconMap[event.icon] || Calendar;
              return (
                <div 
                  key={key}
                  className="bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="w-14 h-14 bg-burgundy/10 rounded-xl flex items-center justify-center mb-4">
                    <IconComponent className="w-7 h-7 text-burgundy" />
                  </div>
                  <h3 className="font-serif text-xl text-espresso mb-2">{event.name}</h3>
                  <p className="text-espresso/70 text-sm">{event.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Packages Section */}
      <div id="packages" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-espresso mb-4">Event Packages</h2>
            <p className="text-espresso/70 max-w-2xl mx-auto">Simple, transparent pricing for your event</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {!loading && enabledPackages.map(([key, pkg]) => (
              <div 
                key={key}
                className={`rounded-3xl p-8 ${key === 'medium' ? 'bg-espresso text-white ring-4 ring-gold' : 'bg-cream'}`}
              >
                {key === 'medium' && (
                  <span className="inline-block px-3 py-1 bg-gold text-espresso text-xs font-bold rounded-full mb-4">
                    MOST POPULAR
                  </span>
                )}
                <h3 className={`font-serif text-2xl mb-2 ${key === 'medium' ? 'text-white' : 'text-espresso'}`}>
                  {pkg.name}
                </h3>
                <p className={`text-sm mb-4 ${key === 'medium' ? 'text-white/70' : 'text-espresso/70'}`}>
                  {pkg.people_range} guests
                </p>
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${key === 'medium' ? 'text-gold' : 'text-gold'}`}>
                    ${pkg.price}
                  </span>
                  <span className={`text-sm ${key === 'medium' ? 'text-white/70' : 'text-espresso/70'}`}>
                    {' '}starting price
                  </span>
                </div>
                <p className={`text-sm mb-6 ${key === 'medium' ? 'text-white/80' : 'text-espresso/70'}`}>
                  {pkg.description}
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className={`w-5 h-5 ${key === 'medium' ? 'text-gold' : 'text-green-500'}`} />
                    <span className={key === 'medium' ? 'text-white/90' : 'text-espresso/80'}>
                      Full espresso bar setup
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className={`w-5 h-5 ${key === 'medium' ? 'text-gold' : 'text-green-500'}`} />
                    <span className={key === 'medium' ? 'text-white/90' : 'text-espresso/80'}>
                      Experienced barista
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className={`w-5 h-5 ${key === 'medium' ? 'text-gold' : 'text-green-500'}`} />
                    <span className={key === 'medium' ? 'text-white/90' : 'text-espresso/80'}>
                      Premium coffee & supplies
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className={`w-5 h-5 ${key === 'medium' ? 'text-gold' : 'text-green-500'}`} />
                    <span className={key === 'medium' ? 'text-white/90' : 'text-espresso/80'}>
                      {key === 'small' ? '2 hour service' : '3 hour service'}
                    </span>
                  </li>
                </ul>
                <Link to="/book-event">
                  <Button 
                    className={`w-full rounded-full py-6 text-lg ${
                      key === 'medium' 
                        ? 'bg-gold hover:bg-gold/90 text-espresso' 
                        : 'bg-burgundy hover:bg-burgundy-dark text-white'
                    }`}
                  >
                    Book This Package
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-espresso/60 mt-8 text-sm">
            * Prices may vary based on location and specific requirements. Contact us for a custom quote.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-burgundy text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl mb-4">Ready to Make Your Event Special?</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Let's create a memorable coffee experience for your guests. Book your event today!
          </p>
          <Link to="/book-event">
            <Button className="bg-gold hover:bg-gold/90 text-espresso rounded-full px-8 py-6 text-lg font-semibold gap-2">
              <Calendar className="w-5 h-5" />
              Request a Quote
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
