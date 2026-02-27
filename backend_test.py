#!/usr/bin/env python3

import requests
import sys
import time
from datetime import datetime

class AutoTrackAPITester:
    def __init__(self, base_url="https://fleet-health-3.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_car_id = None
        self.test_task_id = None

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json().get('detail', 'No detail') if response.content else 'No content'
                    self.log(f"   Error: {error_detail}")
                except:
                    self.log(f"   Raw response: {response.text[:200]}")

            return success, {}

        except Exception as e:
            self.log(f"❌ {name} - Network Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health"""
        return self.run_test("API Health Check", "GET", "", 200)

    def test_register_user(self):
        """Test user registration"""
        timestamp = int(time.time())
        test_email = f"test_user_{timestamp}@example.com"
        test_data = {
            "email": test_email,
            "password": "TestPass123!",
            "name": "Test User"
        }
        success, response = self.run_test("User Registration", "POST", "auth/register", 200, data=test_data)
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.log(f"   Registered user: {test_email}")
            return True
        return False

    def test_login_user(self):
        """Test user login (using same credentials from registration)"""
        if not self.token:
            self.log("❌ Cannot test login - no registered user")
            return False
        
        # We'll test with the same user we registered
        success, _ = self.run_test("Get User Profile", "GET", "auth/me", 200)
        return success

    def test_create_car(self):
        """Test creating a car"""
        car_data = {
            "make": "Toyota",
            "model": "Camry",
            "year": 2020,
            "color": "Silver",
            "license_plate": "TEST123",
            "current_mileage": 50000
        }
        success, response = self.run_test("Create Car", "POST", "cars", 200, data=car_data)
        if success and 'id' in response:
            self.test_car_id = response['id']
            self.log(f"   Created car ID: {self.test_car_id}")
            return True
        return False

    def test_get_cars(self):
        """Test getting user's cars"""
        success, response = self.run_test("Get Cars", "GET", "cars", 200)
        if success and isinstance(response, list):
            self.log(f"   Found {len(response)} cars")
            return True
        return False

    def test_get_car_details(self):
        """Test getting car details"""
        if not self.test_car_id:
            self.log("❌ Cannot test car details - no car created")
            return False
        
        success, response = self.run_test("Get Car Details", "GET", f"cars/{self.test_car_id}", 200)
        return success

    def test_create_maintenance_task(self):
        """Test creating maintenance task"""
        if not self.test_car_id:
            self.log("❌ Cannot test maintenance task - no car created")
            return False

        task_data = {
            "car_id": self.test_car_id,
            "task_type": "oil_change",
            "description": "Regular oil change",
            "last_performed_mileage": 45000,
            "interval_miles": 5000,
            "interval_months": 6,
            "notes": "Full synthetic oil"
        }
        success, response = self.run_test("Create Maintenance Task", "POST", "maintenance", 200, data=task_data)
        if success and 'id' in response:
            self.test_task_id = response['id']
            self.log(f"   Created task ID: {self.test_task_id}")
            return True
        return False

    def test_get_maintenance_tasks(self):
        """Test getting maintenance tasks"""
        success, response = self.run_test("Get Maintenance Tasks", "GET", "maintenance", 200)
        if success and isinstance(response, list):
            self.log(f"   Found {len(response)} maintenance tasks")
            return True
        return False

    def test_complete_maintenance_task(self):
        """Test completing maintenance task"""
        if not self.test_task_id:
            self.log("❌ Cannot test complete task - no task created")
            return False

        success, response = self.run_test(
            "Complete Maintenance Task", 
            "POST", 
            f"maintenance/{self.test_task_id}/complete", 
            200,
            params={"mileage": 55000}
        )
        return success

    def test_log_mileage(self):
        """Test logging mileage"""
        if not self.test_car_id:
            self.log("❌ Cannot test mileage log - no car created")
            return False

        mileage_data = {
            "car_id": self.test_car_id,
            "mileage": 55500,
            "notes": "Highway trip"
        }
        success, response = self.run_test("Log Mileage", "POST", "mileage", 200, data=mileage_data)
        return success

    def test_get_mileage_logs(self):
        """Test getting mileage logs"""
        if not self.test_car_id:
            self.log("❌ Cannot test get mileage logs - no car created")
            return False

        success, response = self.run_test("Get Mileage Logs", "GET", f"mileage/{self.test_car_id}", 200)
        if success and isinstance(response, list):
            self.log(f"   Found {len(response)} mileage logs")
            return True
        return False

    def test_ai_chat(self):
        """Test AI mechanic chat"""
        chat_data = {
            "message": "What should I check if my car won't start?",
            "car_id": self.test_car_id
        }
        success, response = self.run_test("AI Chat", "POST", "chat", 200, data=chat_data)
        if success and 'response' in response:
            self.log(f"   AI response length: {len(response['response'])} chars")
            return True
        return False

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)
        if success and 'total_cars' in response:
            self.log(f"   Stats: {response.get('total_cars')} cars, {response.get('total_tasks')} tasks")
            return True
        return False

    def test_settings(self):
        """Test settings endpoints"""
        # Get settings
        success1, settings = self.run_test("Get Settings", "GET", "settings", 200)
        
        # Update settings
        update_data = {
            "email_reminders": True,
            "push_notifications": False,
            "reminder_days_before": 14
        }
        success2, _ = self.run_test("Update Settings", "PUT", "settings", 200, data=update_data)
        
        return success1 and success2

    def run_all_tests(self):
        """Run comprehensive API tests"""
        self.log("🚀 Starting AutoTrack API Tests")
        self.log(f"📍 Testing against: {self.base_url}")
        
        # Health and Auth tests
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_register_user),
            ("User Authentication", self.test_login_user),
        ]
        
        # Car management tests
        tests.extend([
            ("Create Car", self.test_create_car),
            ("Get Cars", self.test_get_cars),
            ("Get Car Details", self.test_get_car_details),
        ])
        
        # Maintenance tests
        tests.extend([
            ("Create Maintenance Task", self.test_create_maintenance_task),
            ("Get Maintenance Tasks", self.test_get_maintenance_tasks),
            ("Complete Maintenance Task", self.test_complete_maintenance_task),
        ])
        
        # Mileage tests
        tests.extend([
            ("Log Mileage", self.test_log_mileage),
            ("Get Mileage Logs", self.test_get_mileage_logs),
        ])
        
        # Feature tests
        tests.extend([
            ("AI Chat", self.test_ai_chat),
            ("Dashboard Stats", self.test_dashboard_stats),
            ("Settings", self.test_settings),
        ])

        failed_tests = []
        for test_name, test_func in tests:
            try:
                if not test_func():
                    failed_tests.append(test_name)
            except Exception as e:
                self.log(f"❌ {test_name} - Exception: {str(e)}")
                failed_tests.append(test_name)
            
            time.sleep(0.5)  # Brief pause between tests

        # Print results
        self.log("\n" + "="*60)
        self.log(f"📊 FINAL RESULTS")
        self.log(f"✅ Tests passed: {self.tests_passed}/{self.tests_run}")
        self.log(f"❌ Tests failed: {len(failed_tests)}/{self.tests_run}")
        
        if failed_tests:
            self.log("\n❌ Failed tests:")
            for test in failed_tests:
                self.log(f"   - {test}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        self.log(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        return len(failed_tests) == 0

def main():
    tester = AutoTrackAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())