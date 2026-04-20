import httpx
from backend.app.core.config import settings
import logging

logger = logging.getLogger(__name__)

async def send_sms_notification(phone: str, message: str):
    """
    Sends an SMS notification via the configured gateway.
    Supports both Android Gateway and standard API providers.
    """
    if not settings.SMS_GATEWAY_URL:
        logger.info(f"SMS simulation for {phone}: {message}")
        print(f"\n[SMS SIMULATION] To: {phone} | Msg: {message}\n")
        return True

    try:
        # Standard format for most Android Gateway APIs
        # Change this payload structure based on the specific provider documentation
        payload = {
            "to": phone,
            "message": message,
            "key": settings.SMS_API_KEY
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(settings.SMS_GATEWAY_URL, data=payload, timeout=10.0)
            response.raise_for_status()
            logger.info(f"SMS successfully sent to {phone}")
            return True
            
    except Exception as e:
        logger.error(f"Failed to send SMS to {phone}: {str(e)}")
        return False

async def notify_payment(phone: str, amount: float, balance: float):
    """Specific helper for payment notifications."""
    message = f"Dear Customer, you paid PKR {amount:,.0f} to {settings.PROJECT_NAME}. Your remaining balance is PKR {balance:,.0f}. Thank you!"
    return await send_sms_notification(phone, message)
