# Create Dodo Payments Product - Instructions

## Step 1: Login to Dodo Dashboard
1. Go to https://test.dodopayments.com
2. Login with your account

## Step 2: Create Subscription Product
1. Navigate to **Products** section
2. Click **Create Product** or **New Product**
3. Fill in the details:
   - **Product Name**: Pro Subscription
   - **Product Type**: Subscription (Recurring)
   - **Product ID**: `prod_pro_subscription` (IMPORTANT - must match exactly)
   - **Price**: 1999 INR
   - **Billing Cycle**: Monthly
   - **Trial Period**: 30 days (optional)
   - **Description**: Pro plan with advanced features

4. Click **Save** or **Create**

## Step 3: Verify Product ID
Make sure the product ID is exactly: `prod_pro_subscription`

This ID must match what's in the backend code (`backend/routes/checkout.js` line 45)

## Step 4: Test Payment Flow
1. Restart backend: `npm start`
2. Login to app
3. Go to Pricing page
4. Click "Start Pro Trial"
5. You should be redirected to Dodo's checkout page
6. Use test payment details to complete payment
7. After payment, you'll return to dashboard

## Fallback Behavior
If the product doesn't exist yet, the app will:
- Activate a 30-day trial automatically
- Show message: "Create product in Dodo dashboard to enable payments"
- Users can still use Pro features during trial

## Need Help?
- Dodo Docs: https://docs.dodopayments.com
- Test Cards: Check Dodo documentation for test card numbers
