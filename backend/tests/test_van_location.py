"""
Backend tests for van location mode feature
Tests: GET /api/van-location and POST /api/van-location with mode and stationary_location_name fields
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "modetest@test.com"
TEST_PASSWORD = "test123"


class TestVanLocationAPI:
    """Van Location API endpoint tests for Mobile/Stationary mode feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def get_auth_token(self):
        """Get auth token for admin user"""
        response = self.session.post(f"{self.base_url}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    # Test GET /api/van-location returns mode and stationary_location_name
    def test_get_van_location_returns_mode_field(self):
        """GET /api/van-location should return mode field"""
        response = self.session.get(f"{self.base_url}/api/van-location")
        assert response.status_code == 200
        
        data = response.json()
        assert "mode" in data, "Response should contain 'mode' field"
        assert data["mode"] in ["mobile", "stationary"], f"Mode should be 'mobile' or 'stationary', got: {data['mode']}"
        
    def test_get_van_location_returns_stationary_location_name(self):
        """GET /api/van-location should return stationary_location_name field"""
        response = self.session.get(f"{self.base_url}/api/van-location")
        assert response.status_code == 200
        
        data = response.json()
        assert "stationary_location_name" in data, "Response should contain 'stationary_location_name' field"
        # Field can be null or a string
        assert data["stationary_location_name"] is None or isinstance(data["stationary_location_name"], str)
    
    def test_get_van_location_returns_all_required_fields(self):
        """GET /api/van-location should return all required fields"""
        response = self.session.get(f"{self.base_url}/api/van-location")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ["lat", "lng", "status", "mode", "stationary_location_name"]
        for field in required_fields:
            assert field in data, f"Response missing required field: {field}"
    
    # Test POST /api/van-location accepts mode and stationary_location_name
    def test_post_van_location_with_mobile_mode(self):
        """POST /api/van-location should accept mode='mobile'"""
        token = self.get_auth_token()
        assert token is not None, "Failed to authenticate"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        payload = {
            "lat": 47.6588,
            "lng": -117.426,
            "status": "available",
            "mode": "mobile",
            "stationary_location_name": None
        }
        
        response = self.session.post(f"{self.base_url}/api/van-location", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["mode"] == "mobile", f"Mode should be 'mobile', got: {data['mode']}"
        
    def test_post_van_location_with_stationary_mode(self):
        """POST /api/van-location should accept mode='stationary' with location name"""
        token = self.get_auth_token()
        assert token is not None, "Failed to authenticate"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        location_name = "TEST_Soccer Match at Lincoln Park"
        payload = {
            "lat": 47.6588,
            "lng": -117.426,
            "status": "available",
            "mode": "stationary",
            "stationary_location_name": location_name
        }
        
        response = self.session.post(f"{self.base_url}/api/van-location", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["mode"] == "stationary", f"Mode should be 'stationary', got: {data['mode']}"
        assert data["stationary_location_name"] == location_name
        
        # Verify GET returns the updated data
        get_response = self.session.get(f"{self.base_url}/api/van-location")
        assert get_response.status_code == 200
        
        get_data = get_response.json()
        assert get_data["mode"] == "stationary"
        assert get_data["stationary_location_name"] == location_name
        
    def test_post_van_location_clears_stationary_name_on_mobile_mode(self):
        """POST /api/van-location should accept null stationary_location_name for mobile mode"""
        token = self.get_auth_token()
        assert token is not None, "Failed to authenticate"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # First set to stationary
        self.session.post(f"{self.base_url}/api/van-location", json={
            "lat": 47.6588,
            "lng": -117.426,
            "status": "available",
            "mode": "stationary",
            "stationary_location_name": "Test Location"
        })
        
        # Now switch to mobile
        payload = {
            "lat": 47.6588,
            "lng": -117.426,
            "status": "available",
            "mode": "mobile",
            "stationary_location_name": None
        }
        
        response = self.session.post(f"{self.base_url}/api/van-location", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["mode"] == "mobile"
        assert data["stationary_location_name"] is None


class TestAuthAPI:
    """Authentication API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_login_success(self):
        """Login with valid credentials should succeed"""
        response = self.session.post(f"{self.base_url}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "admin" in data
        
    def test_login_invalid_credentials(self):
        """Login with invalid credentials should fail"""
        response = self.session.post(f"{self.base_url}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestAPIHealthCheck:
    """API health check tests"""
    
    def test_api_root_endpoint(self):
        """Root API endpoint should return version info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "version" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
