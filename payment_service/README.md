# Just In Time - Backend API

Backend server for Just In Time with Dodo Payments integration.

## Features

- ✅ Express.js REST API
- ✅ JSON file storage (no database required)
- ✅ Dodo Payments integration
- ✅ Rate limiting (1000 req/min, 100 req/sec)
- ✅ Proper error handling
- ✅ Webhook support

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   - Copy `.env.example` to `.env`
   - Update `DODO_API_KEY` with your API key

3. **Start Server**:
   ```bash
   npm run dev
   ```

Server runs on http://localhost:5000

## API Endpoints

### Checkout
- `POST /api/checkout/create-session` - Create checkout session

### Subscription
- `GET /api/subscription/:username` - Get subscription details
- `POST /api/subscription/update-autopay` - Toggle auto-payment
- `POST /api/subscription/cancel` - Cancel subscription

### Webhooks
- `POST /api/webhook/payment` - Handle Dodo payment webhooks

## Data Storage

Data is stored in JSON files at `backend/data/`:
- `users.json` - User accounts and subscriptions
- `payments.json` - Payment transactions

## Error Codes

- `INVALID_REQUEST` - Invalid parameters
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `USER_NOT_FOUND` - User doesn't exist
- `INTERNAL_ERROR` - Server error

## Testing

Test the API with:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": "test_mode"
}
```
