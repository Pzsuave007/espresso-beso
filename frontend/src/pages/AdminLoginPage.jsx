import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '../App';
import { Coffee, Lock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_8eb9ed2b-80c2-447f-a8a6-53bb1c68d925/artifacts/82psuie2_Espresso-Vesso-Logo%20ready1.png";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate('/admin/dashboard');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (isRegister && !formData.name) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister 
        ? { email: formData.email, password: formData.password, name: formData.name }
        : { email: formData.email, password: formData.password };
      
      const response = await axios.post(`${API}${endpoint}`, payload);
      
      login(response.data.token, response.data.admin);
      toast.success(isRegister ? 'Account created!' : 'Welcome back!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-espresso flex items-center justify-center px-4" data-testid="admin-login-page">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={LOGO_URL} 
            alt="Espresso Beso" 
            className="h-24 w-auto mx-auto mb-4"
          />
          <h1 className="font-serif text-3xl text-cream font-bold">Admin Portal</h1>
          <p className="text-cream/70 mt-2">
            {isRegister ? 'Create your admin account' : 'Sign in to manage your business'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-floating p-8 space-y-6">
          {isRegister && (
            <div>
              <Label htmlFor="name" className="form-label">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                className="form-input"
                data-testid="admin-name"
              />
            </div>
          )}

          <div>
            <Label htmlFor="email" className="form-label">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-espresso/40" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@espressobeso.com"
                className="form-input pl-10"
                data-testid="admin-email"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="form-label">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-espresso/40" />
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="form-input pl-10"
                data-testid="admin-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-burgundy hover:bg-burgundy-dark text-white rounded-full py-6 text-lg"
            data-testid="admin-submit-btn"
          >
            {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-gold hover:text-gold-light transition-colors text-sm"
              data-testid="toggle-auth-mode"
            >
              {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
            </button>
          </div>
        </form>

        {/* Back to site */}
        <div className="text-center mt-6">
          <a href="/" className="text-cream/70 hover:text-cream text-sm transition-colors">
            ← Back to website
          </a>
        </div>
      </div>
    </div>
  );
}
