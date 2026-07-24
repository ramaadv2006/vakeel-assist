"""
Advo Buddy - Reminder Configuration

Fill in your Twilio credentials below. Get these free by signing up at:
https://www.twilio.com/try-twilio

After signup, find your Account SID and Auth Token on the Twilio Console
dashboard (https://console.twilio.com).

For SMS: you'll get a free Twilio phone number to send from.
For WhatsApp: Twilio provides a free "Sandbox" number for testing
(https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn) -
your advocates will need to send a join code to that number once, from
their own WhatsApp, before they can receive messages.

IMPORTANT: Do not share this file or commit it publicly once filled in -
it contains secret credentials.
"""

TWILIO_ACCOUNT_SID = "your_account_sid_here"
TWILIO_AUTH_TOKEN = "your_auth_token_here"

# The Twilio phone number you were given for SMS (format: +1XXXXXXXXXX)
TWILIO_SMS_FROM = "+1XXXXXXXXXX"

# The Twilio WhatsApp sandbox number (format: whatsapp:+14155238886 - this
# exact number is Twilio's standard sandbox number, same for everyone)
TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886"
