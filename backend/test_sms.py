import asyncio
import sys
import os

# Add the project root to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.utils.sms import notify_payment
from backend.app.core.config import settings

async def test_sms():
    print("--- SMS Notification Test ---")
    
    # You can set these temporarily for testing if you have an API key/URL
    # settings.SMS_GATEWAY_URL = "https://your-gateway-url.com/api"
    # settings.SMS_API_KEY = "your_api_key_here"
    
    test_phone = "03164129435"
    test_amount = 5000
    test_balance = 25000
    
    print(f"Testing SMS to: {test_phone}")
    print(f"Gateway URL: {settings.SMS_GATEWAY_URL or '[SIMULATION MODE]'}")
    
    success = await notify_payment(test_phone, test_amount, test_balance)
    
    if success:
        print("\nSUCCESS: SMS task completed.")
        if not settings.SMS_GATEWAY_URL:
            print("Note: Currently in SIMULATION MODE. Check the console output above.")
    else:
        print("\nFAILED: Check logs for errors.")

if __name__ == "__main__":
    asyncio.run(test_sms())
