# Shop offline/online ordering gate tests (ensure_shop_online on /api/orders and /api/stripe/create-checkout)
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
ADMIN = {"email": "admin@espressobeso.com", "password": "TestAdmin123!"}


def _order_payload():
    return {
        "customer_info": {"name": "TEST_offline_user", "email": "test_offline@example.com", "phone": "5555555555"},
        "items": [{"menu_item_id": "x", "menu_item_name": "TEST Latte", "quantity": 1,
                   "unit_price": 4.5, "customizations": {}, "item_total": 4.5}],
        "order_type": "at_location",
        "payment_method": "manual",
    }


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
    if r.status_code != 200:
        pytest.skip("admin login failed")
    return r.json().get("token") or r.json().get("access_token")


@pytest.fixture(scope="module")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


def _set_online(auth, want):
    s = requests.get(f"{BASE_URL}/api/shop-status").json()
    if s["is_online"] != want:
        r = requests.post(f"{BASE_URL}/api/shop-status/toggle", headers=auth)
        assert r.status_code == 200
        assert r.json()["is_online"] == want
    assert requests.get(f"{BASE_URL}/api/shop-status").json()["is_online"] == want


# Offline: menu still available, ordering blocked
class TestOffline:
    def test_menu_available_offline(self, auth):
        _set_online(auth, False)
        r = requests.get(f"{BASE_URL}/api/menu/available")
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_create_order_blocked(self, auth):
        _set_online(auth, False)
        r = requests.post(f"{BASE_URL}/api/orders", json=_order_payload())
        assert r.status_code == 403
        assert "offline" in r.json()["detail"].lower()

    def test_stripe_checkout_blocked(self, auth):
        _set_online(auth, False)
        r = requests.post(f"{BASE_URL}/api/stripe/create-checkout",
                          json={"order_id": "nonexistent", "success_url": "https://x/s", "cancel_url": "https://x/c"})
        assert r.status_code == 403

    def test_toggle_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/shop-status/toggle")
        assert r.status_code in (401, 403)


# Online: ordering works, then cancel test order
class TestOnline:
    def test_create_order_online_and_cancel(self, auth):
        _set_online(auth, True)
        r = requests.post(f"{BASE_URL}/api/orders", json=_order_payload())
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["customer_info"]["name"] == "TEST_offline_user"
        oid = order["id"]
        g = requests.get(f"{BASE_URL}/api/orders/{oid}", headers=auth)
        assert g.status_code == 200 and g.json()["id"] == oid
        c = requests.post(f"{BASE_URL}/api/orders/{oid}/cancel", headers=auth)
        assert c.status_code == 200
        assert requests.get(f"{BASE_URL}/api/orders/{oid}", headers=auth).json()["status"] == "cancelled"

    def test_stripe_checkout_online_not_403(self, auth):
        _set_online(auth, True)
        r = requests.post(f"{BASE_URL}/api/stripe/create-checkout",
                          json={"order_id": "nonexistent", "success_url": "https://x/s", "cancel_url": "https://x/c"})
        assert r.status_code != 403
        assert r.status_code in (404, 500)
