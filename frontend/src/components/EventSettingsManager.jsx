import { useEffect, useState } from 'react';
import axios from 'axios';
import { API, useAuth } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { 
  Briefcase, Heart, GraduationCap, Trophy, Cake, Users, Calendar,
  Save, Loader2, DollarSign, Settings
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

export default function EventSettingsManager() {
  const { token } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API}/event-settings`);
        setSettings(res.data);
      } catch (error) {
        console.error('Error fetching event settings:', error);
        toast.error('Failed to load event settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggleEventType = (key) => {
    setSettings(prev => ({
      ...prev,
      event_types: {
        ...prev.event_types,
        [key]: {
          ...prev.event_types[key],
          enabled: !prev.event_types[key].enabled
        }
      }
    }));
  };

  const handleTogglePackage = (key) => {
    setSettings(prev => ({
      ...prev,
      packages: {
        ...prev.packages,
        [key]: {
          ...prev.packages[key],
          enabled: !prev.packages[key].enabled
        }
      }
    }));
  };

  const handlePackagePriceChange = (key, price) => {
    setSettings(prev => ({
      ...prev,
      packages: {
        ...prev.packages,
        [key]: {
          ...prev.packages[key],
          price: parseInt(price) || 0
        }
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/event-settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Event settings saved!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
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
    <div className="space-y-6" data-testid="event-settings-manager">
      <div className="flex justify-between items-center">
        <h1 className="section-title flex items-center gap-3">
          <Settings className="w-7 h-7 text-gold" />
          Event Settings
        </h1>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-burgundy hover:bg-burgundy-dark text-white gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Event Types */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-espresso mb-4">Event Types</h2>
        <p className="text-sm text-espresso/60 mb-4">
          Toggle which event types are available for booking
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {settings?.event_types && Object.entries(settings.event_types).map(([key, event]) => {
            const IconComponent = iconMap[event.icon] || Calendar;
            return (
              <div 
                key={key}
                className={`p-4 rounded-xl border-2 transition-all ${
                  event.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-5 h-5 ${event.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`font-medium ${event.enabled ? 'text-espresso' : 'text-gray-500'}`}>
                      {event.name}
                    </span>
                  </div>
                  <Switch 
                    checked={event.enabled}
                    onCheckedChange={() => handleToggleEventType(key)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Packages */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-espresso mb-4">Pricing Packages</h2>
        <p className="text-sm text-espresso/60 mb-4">
          Configure your event packages and pricing
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {settings?.packages && Object.entries(settings.packages).map(([key, pkg]) => (
            <div 
              key={key}
              className={`p-5 rounded-xl border-2 transition-all ${
                pkg.enabled ? 'border-gold bg-gold/5' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`font-semibold ${pkg.enabled ? 'text-espresso' : 'text-gray-500'}`}>
                    {pkg.name}
                  </h3>
                  <p className="text-sm text-espresso/60">{pkg.people_range} guests</p>
                </div>
                <Switch 
                  checked={pkg.enabled}
                  onCheckedChange={() => handleTogglePackage(key)}
                />
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gold" />
                <Input
                  type="number"
                  value={pkg.price}
                  onChange={(e) => handlePackagePriceChange(key, e.target.value)}
                  className="w-32 bg-white"
                  min="0"
                />
                <span className="text-sm text-espresso/60">starting price</span>
              </div>
              <p className="text-xs text-espresso/50 mt-2">{pkg.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
