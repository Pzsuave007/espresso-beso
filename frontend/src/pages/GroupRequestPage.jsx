import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Users, MapPin, Calendar, Clock, User, Mail, Phone, Building, Send, CheckCircle, Coffee, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const MINIMUM_DRINKS = 5;
const MINIMUM_ORDER = 20;

export default function GroupRequestPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    people_count: '',
    expected_drinks: '',
    preferred_date: '',
    preferred_time: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    company_name: '',
    notes: ''
  });

  const expectedDrinks = parseInt(formData.expected_drinks) || 0;
  const meetsMinimum = expectedDrinks >= MINIMUM_DRINKS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.address || !formData.expected_drinks || !formData.contact_name || !formData.contact_email || !formData.contact_phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!meetsMinimum) {
      toast.error(`Minimum ${MINIMUM_DRINKS} drinks required for scheduled visits`);
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/group-requests`, {
        ...formData,
        people_count: parseInt(formData.people_count) || parseInt(formData.expected_drinks),
        notes: `Expected drinks: ${formData.expected_drinks}. ${formData.notes || ''}`
      });
      
      setSubmitted(true);
      toast.success('Request submitted successfully!');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="page-container" data-testid="group-request-success">
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 animate-fade-in">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <h1 className="font-serif text-3xl text-espresso mb-4 animate-fade-in stagger-1">
            Request Submitted!
          </h1>
          <p className="text-espresso/70 mb-8 animate-fade-in stagger-2">
            Thank you for your interest! We'll review your request and contact you within 24 hours to coordinate your visit.
          </p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-burgundy hover:bg-burgundy-dark text-white rounded-full px-8 py-6 animate-fade-in stagger-3"
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" data-testid="group-request-page">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gold" />
          </div>
          <h1 className="section-title mb-2">Request a Visit</h1>
          <p className="text-espresso/70">
            We'll bring Espresso Beso to your location and prepare fresh coffee on-site!
          </p>
        </div>

        {/* Minimum Order Notice */}
        <div className="bg-gold/10 border border-gold/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Coffee className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-espresso">Minimum Order: {MINIMUM_DRINKS} drinks</p>
            <p className="text-sm text-espresso/70 mt-1">
              For scheduled visits, we require a minimum of {MINIMUM_DRINKS} drinks (approx. ${MINIMUM_ORDER}+). 
              This helps us serve you better!
            </p>
            <p className="text-sm text-gold font-medium mt-2">
              💡 Tip: If you see me nearby on the map, just come find me - no minimum needed!
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-6 md:p-8 space-y-6">
          
          {/* Order Details */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-espresso flex items-center gap-2">
              <Coffee className="w-5 h-5 text-gold" />
              Order Details
            </h3>
            
            <div>
              <Label htmlFor="expected_drinks" className="form-label">Expected Number of Drinks *</Label>
              <Input
                id="expected_drinks"
                type="number"
                min="1"
                value={formData.expected_drinks}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_drinks: e.target.value }))}
                placeholder="e.g., 8"
                className={`form-input ${formData.expected_drinks && !meetsMinimum ? 'border-red-300 ring-red-200' : ''}`}
                data-testid="expected-drinks"
              />
              {formData.expected_drinks && !meetsMinimum && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Minimum {MINIMUM_DRINKS} drinks required for scheduled visits
                </p>
              )}
              {meetsMinimum && (
                <p className="text-emerald-600 text-sm mt-1 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Great! That meets our minimum
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="people_count" className="form-label">Number of People (Optional)</Label>
              <Input
                id="people_count"
                type="number"
                min="1"
                value={formData.people_count}
                onChange={(e) => setFormData(prev => ({ ...prev, people_count: e.target.value }))}
                placeholder="e.g., 10"
                className="form-input"
                data-testid="group-people-count"
              />
              <p className="text-xs text-espresso/50 mt-1">Helps us prepare enough supplies</p>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-espresso flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold" />
              Location
            </h3>
            
            <div>
              <Label htmlFor="address" className="form-label">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter full address"
                className="form-input"
                data-testid="group-address"
              />
            </div>

            <div>
              <Label htmlFor="company_name" className="form-label">Company / Location Name (Optional)</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="e.g., ABC Company, Oak Park, etc."
                className="form-input"
                data-testid="group-company"
              />
            </div>
          </div>

          {/* Timing */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-espresso flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold" />
              Preferred Schedule
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferred_date" className="form-label">Preferred Date</Label>
                <Input
                  id="preferred_date"
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferred_date: e.target.value }))}
                  className="form-input"
                  data-testid="group-date"
                />
              </div>
              <div>
                <Label htmlFor="preferred_time" className="form-label">Preferred Time</Label>
                <Input
                  id="preferred_time"
                  type="time"
                  value={formData.preferred_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferred_time: e.target.value }))}
                  className="form-input"
                  data-testid="group-time"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-espresso flex items-center gap-2">
              <User className="w-5 h-5 text-gold" />
              Contact Information
            </h3>
            
            <div>
              <Label htmlFor="contact_name" className="form-label">Your Name *</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                placeholder="Your full name"
                className="form-input"
                data-testid="group-contact-name"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_email" className="form-label">Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="your@email.com"
                  className="form-input"
                  data-testid="group-contact-email"
                />
              </div>
              <div>
                <Label htmlFor="contact_phone" className="form-label">Phone *</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="(509) 555-1234"
                  className="form-input"
                  data-testid="group-contact-phone"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="form-label">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any special requests, parking info, or details we should know..."
              className="form-input min-h-[100px]"
              data-testid="group-notes"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading || !meetsMinimum}
            className="w-full bg-burgundy hover:bg-burgundy-dark text-white rounded-full py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="group-submit-btn"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
            <Send className="w-5 h-5 ml-2" />
          </Button>

          {!meetsMinimum && formData.expected_drinks && (
            <p className="text-center text-red-500 text-sm">
              Please increase to at least {MINIMUM_DRINKS} drinks to submit
            </p>
          )}
        </form>

        {/* Info */}
        <div className="mt-8 text-center text-espresso/60 text-sm">
          <p>We typically respond within 24 hours.</p>
          <p className="mt-1">See me nearby on the map? Just come find me - no minimum needed! 👋</p>
        </div>
      </div>
    </div>
  );
}
