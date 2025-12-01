# Razorpay Payment Gateway Integration

## Environment Variables

Add the following to your `.env` file in the root directory:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=b3ef028f26d7f99f485710cfc55bdbc70347edf23dcd17c63fe2ab9bba46c245
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

## Features Implemented

1. **Payment Order Creation**: Creates Razorpay orders when payment is initiated
2. **Payment Verification**: Verifies payment signatures after checkout
3. **Webhook Handling**: Processes Razorpay webhooks for payment status updates
4. **Automatic License Creation**: Creates license after successful payment
5. **Email Notifications**: Sends emails on payment success, failure, and processing

## Payment Flow

1. User clicks "Subscribe" on payment page
2. Backend creates payment record and Razorpay order
3. Razorpay checkout modal opens
4. User completes payment
5. Payment is verified on server
6. License is automatically created
7. Success email is sent
8. User gains access to portal

## Webhook Setup

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/v1/payments/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Copy webhook secret and add to `.env` as `RAZORPAY_WEBHOOK_SECRET`

## Testing

Use Razorpay test cards:
- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date










