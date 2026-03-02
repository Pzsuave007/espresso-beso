import requests
import sys
from datetime import datetime

BACKEND_URL = "https://van-route-optimizer.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class EspressoBesoAPITester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.token = None
        self.order_id = None
        self.zone_id = None
        self.menu_item_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{API_BASE}{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if self.token:
            default_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return response.json() if response.content else {}
                except:
                    return {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.content:
                    print(f"   Response: {response.text[:200]}...")
                return {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "/", 200)

    def test_seed_data(self):
        """Test seeding initial data"""
        return self.run_test("Seed Data", "POST", "/seed", 200)

    def test_zones_endpoint(self):
        """Test zones endpoints"""
        zones = self.run_test("Get Zones", "GET", "/zones", 200)
        if zones and isinstance(zones, list) and len(zones) > 0:
            self.zone_id = zones[0]['id']
            print(f"   Found {len(zones)} zones, using zone: {zones[0]['name']}")
        
        active_zones = self.run_test("Get Active Zones", "GET", "/zones/active", 200)
        if active_zones:
            print(f"   Found {len(active_zones)} active zones")
        return zones

    def test_menu_endpoint(self):
        """Test menu endpoints"""
        menu = self.run_test("Get Menu", "GET", "/menu", 200)
        if menu and isinstance(menu, list) and len(menu) > 0:
            self.menu_item_id = menu[0]['id']
            print(f"   Found {len(menu)} menu items, using: {menu[0]['name']}")
        
        available_menu = self.run_test("Get Available Menu", "GET", "/menu/available", 200)
        categories = self.run_test("Get Categories", "GET", "/menu/categories", 200)
        if categories:
            print(f"   Found categories: {categories}")
        return menu

    def test_admin_auth(self):
        """Test admin authentication"""
        timestamp = datetime.now().strftime("%H%M%S")
        admin_data = {
            "email": f"test_admin_{timestamp}@espressobeso.com",
            "password": "TestPassword123!",
            "name": f"Test Admin {timestamp}"
        }
        
        # Test registration
        register_response = self.run_test("Admin Registration", "POST", "/auth/register", 200, admin_data)
        if register_response and 'token' in register_response:
            self.token = register_response['token']
            print(f"   Admin registered and token obtained")
            
            # Test login
            login_data = {"email": admin_data["email"], "password": admin_data["password"]}
            login_response = self.run_test("Admin Login", "POST", "/auth/login", 200, login_data)
            
            # Test getting current admin info
            me_response = self.run_test("Get Current Admin", "GET", "/auth/me", 200)
            if me_response:
                print(f"   Current admin: {me_response.get('name')}")
            
            return True
        return False

    def test_orders_endpoint(self):
        """Test orders functionality"""
        if not self.zone_id or not self.menu_item_id:
            print("❌ Cannot test orders - missing zone_id or menu_item_id")
            return False
        
        # Create order
        order_data = {
            "customer_info": {
                "name": "Test Customer",
                "email": "test@example.com",
                "phone": "+1234567890",
                "company": "Test Company"
            },
            "items": [{
                "menu_item_id": self.menu_item_id,
                "menu_item_name": "Test Coffee",
                "quantity": 2,
                "unit_price": 5.50,
                "customizations": {"Size": "Large", "Milk": "Oat"},
                "item_total": 11.00
            }],
            "zone_id": self.zone_id,
            "time_window": {"start": "07:00", "end": "10:00"}
        }
        
        order_response = self.run_test("Create Order", "POST", "/orders", 200, order_data)
        if order_response and 'id' in order_response:
            self.order_id = order_response['id']
            print(f"   Order created with ID: {self.order_id[:8]}...")
            
            # Test getting specific order
            self.run_test("Get Order", "GET", f"/orders/{self.order_id}", 200)
            
            if self.token:  # Admin endpoints
                # Get all orders (admin)
                self.run_test("Get All Orders (Admin)", "GET", "/orders", 200)
                
                # Get today's orders
                self.run_test("Get Today's Orders", "GET", "/orders/today", 200)
                
                # Get order summary
                self.run_test("Get Order Summary", "GET", "/orders/summary", 200)
                
                # Update order status
                status_data = {"status": "confirmed"}
                self.run_test("Update Order Status", "PUT", f"/orders/{self.order_id}/status", 200, status_data)
            
            return True
        return False

    def test_group_requests(self):
        """Test group request functionality"""
        group_data = {
            "address": "123 Test Street, Spokane, WA",
            "people_count": 15,
            "preferred_date": "2024-01-15",
            "preferred_time": "10:00 AM",
            "contact_name": "Test Contact",
            "contact_email": "contact@test.com",
            "contact_phone": "+1234567890",
            "company_name": "Test Company",
            "notes": "Please bring extra cups"
        }
        
        group_response = self.run_test("Create Group Request", "POST", "/group-requests", 200, group_data)
        if group_response and 'id' in group_response:
            request_id = group_response['id']
            print(f"   Group request created with ID: {request_id[:8]}...")
            
            if self.token:  # Admin endpoints
                # Get all group requests (admin)
                self.run_test("Get Group Requests (Admin)", "GET", "/group-requests", 200)
                
                # Update group request status
                status_data = {"status": "contacted"}
                self.run_test("Update Group Request Status", "PUT", f"/group-requests/{request_id}/status", 200, status_data)
            
            return True
        return False

    def test_van_location(self):
        """Test van location endpoints"""
        # Get current van location
        location_response = self.run_test("Get Van Location", "GET", "/van-location", 200)
        if location_response:
            print(f"   Van location: {location_response.get('lat', 'N/A')}, {location_response.get('lng', 'N/A')}")
        
        if self.token:  # Admin endpoint
            # Update van location
            location_data = {
                "lat": 47.6588,
                "lng": -117.4260,
                "status": "available",
                "current_zone": "Downtown"
            }
            self.run_test("Update Van Location (Admin)", "POST", "/van-location", 200, location_data)
        
        return True

    def test_checkout_flow(self):
        """Test checkout and payment flow"""
        if not self.order_id:
            print("❌ Cannot test checkout - no order created")
            return False
        
        # Create checkout session
        checkout_data = {
            "order_id": self.order_id,
            "origin_url": "https://espressobeso.com"
        }
        
        checkout_response = self.run_test("Create Checkout Session", "POST", "/checkout/create", 200, checkout_data)
        if checkout_response and 'session_id' in checkout_response:
            session_id = checkout_response['session_id']
            print(f"   Checkout session created: {session_id[:20]}...")
            
            # Get checkout status
            self.run_test("Get Checkout Status", "GET", f"/checkout/status/{session_id}", 200)
            
            return True
        return False

def main():
    """Run all API tests"""
    print("🚀 Starting Espresso Beso API Tests")
    print(f"Testing against: {BACKEND_URL}")
    
    tester = EspressoBesoAPITester()
    
    # Run tests in order
    tester.test_root_endpoint()
    tester.test_seed_data()
    tester.test_zones_endpoint()
    tester.test_menu_endpoint()
    tester.test_admin_auth()
    tester.test_orders_endpoint()
    tester.test_group_requests()
    tester.test_van_location()
    tester.test_checkout_flow()
    
    # Print final results
    print(f"\n📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    print(f"Success rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())