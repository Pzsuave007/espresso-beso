import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { 
  Briefcase, Heart, GraduationCap, Trophy, Cake, Users, Calendar, Home,
  ArrowLeft, CheckCircle, Coffee, Loader2, MapPin, Phone, Mail, User, Building
} from 'lucide-react';

const iconMap = {
  'briefcase': Briefcase,
  'heart': Heart,
  'graduation-cap': GraduationCap,
  'trophy': Trophy,
  'cake': Cake,
  'home': Home,
  'users': Users,
  'calendar': Calendar,
};

export default function BookEventPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    event_type: '',
    package_size: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    company_name: '',
    address: '',
    people_count: '',
    preferred_date: '',
    preferred_time: '',
    notes: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API}/event-settings`);
        setSettings(res.data);
        // Set default selections
        const enabledTypes = Object.entries(res.data.event_types).filter(([_, v]) => v.enabled);
        const enabledPackages = Object.entries(res.data.packages).filter(([_, v]) => v.enabled);
        if (enabledTypes.length > 0) setFormData(prev => ({ ...prev, event_type: enabledTypes[0][0] }));
        if (enabledPackages.length > 0) setFormData(prev => ({ ...prev, package_size: enabledPackages[0][0] }));
      } catch (error) {
        console.error('Error fetching event settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await axios.post(`${API}/group-requests`, {
        ...formData,
        people_count: parseInt(formData.people_count)
      });
      setSubmitted(true);
      toast.success('Your event request has been submitted!');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const enabledEventTypes = settings?.event_types 
    ? Object.entries(settings.event_types).filter(([_, v]) => v.enabled)
    : [];

  const enabledPackages = settings?.packages
    ? Object.entries(settings.packages).filter(([_, v]) => v.enabled)
    : [];

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 max-w-lg text-center shadow-card">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="font-serif text-3xl text-espresso mb-4">Request Submitted!</h1>
          <p className="text-espresso/70 mb-8">
            Thank you for your interest! We'll review your request and get back to you within 24 hours.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/')} className="bg-burgundy text-white rounded-full">
              Back to Home
            </Button>
            <Button onClick={() => navigate('/menu')} variant="outline" className="rounded-full">
              View Our Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream" data-testid="book-event-page">
      {/* Header */}
      <div className="bg-espresso text-white py-8">
        <div className="max-w-3xl mx-auto px-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="font-serif text-3xl md:text-4xl">Book Your Event</h1>
          <p className="text-white/80 mt-2">Fill out the form below and we'll get back to you within 24 hours</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Event Type Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h2 className="font-serif text-xl text-espresso mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold" />
              What type of event?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {!loading && enabledEventTypes.map(([key, event]) => {
                const IconComponent = iconMap[event.icon] || Calendar;
                const isSelected = formData.event_type === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, event_type: key }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected 
                        ? 'border-burgundy bg-burgundy/5' 
                        : 'border-cream-dark hover:border-gold'
                    }`}
                  >
                    <IconComponent className={`w-6 h-6 mb-2 ${isSelected ? 'text-burgundy' : 'text-espresso/50'}`} />
                    <span className={`text-sm font-medium ${isSelected ? 'text-burgundy' : 'text-espresso'}`}>
                      {event.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Package Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h2 className="font-serif text-xl text-espresso mb-4 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-gold" />
              Select a Package
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {!loading && enabledPackages.map(([key, pkg]) => {
                const isSelected = formData.package_size === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, package_size: key }))}
                    className={`p-5 rounded-xl border-2 text-left transition-all ${
                      isSelected 
                        ? 'border-burgundy bg-burgundy/5' 
                        : 'border-cream-dark hover:border-gold'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`font-serif text-lg ${isSelected ? 'text-burgundy' : 'text-espresso'}`}>
                        {pkg.name}
                      </span>
                      <span className="text-gold font-bold">${pkg.price}</span>
                    </div>
                    <p className="text-sm text-espresso/60">{pkg.people_range} guests</p>
                    <p className="text-xs text-espresso/50 mt-1">{pkg.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h2 className="font-serif text-xl text-espresso mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold" />
              Event Details
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-espresso mb-1 block">Event Date *</label>
                <Input
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferred_date: e.target.value }))}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-cream border-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-espresso mb-1 block">Preferred Time *</label>
                <Input
                  type="text"
                  placeholder="e.g., 9:00 AM - 12:00 PM"
                  value={formData.preferred_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferred_time: e.target.value }))}
                  required
                  className="bg-cream border-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-espresso mb-1 block">Event Address *</label>
                <Input
                  type="text"
                  placeholder="Full address of your event"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  required
                  className="bg-cream border-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-espresso mb-1 block">Number of Guests *</label>
                <Input
                  type="number"
                  placeholder="Estimated number"
                  value={formData.people_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, people_count: e.target.value }))}
                  required
                  min="10"
                  className="bg-cream border-none"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h2 className="font-serif text-xl text-espresso mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gold" />
              Your Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-espresso mb-1 block">Your Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-espresso/40" />
                  <Input
                    type="text"
                    placeholder="Full name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                    required
                    className="bg-cream border-none pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-espresso mb-1 block">Company/Organization</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-espresso/40" />
                  <Input
                    type="text"
                    placeholder="Optional"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    className="bg-cream border-none pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-espresso mb-1 block">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-espresso/40" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    required
                    className="bg-cream border-none pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-espresso mb-1 block">Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-espresso/40" />
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    required
                    className="bg-cream border-none pl-10"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-espresso mb-1 block">Additional Notes</label>
                <Textarea
                  placeholder="Any special requests or details about your event..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="bg-cream border-none min-h-[100px]"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-burgundy hover:bg-burgundy-dark text-white rounded-full py-6 text-lg font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Request
                <CheckCircle className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          <p className="text-center text-espresso/60 text-sm">
            We'll contact you within 24 hours to confirm your event details.
          </p>
        </form>
      </div>
    </div>
  );
}
