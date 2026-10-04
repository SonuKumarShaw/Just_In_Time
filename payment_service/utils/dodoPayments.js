import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const DODO_API_KEY = process.env.DODO_API_KEY;
const DODO_BASE_URL = process.env.DODO_ENVIRONMENT === 'test_mode'
    ? 'https://test.dodopayments.com'
    : 'https://live.dodopayments.com';

// Create checkout session
export async function createCheckoutSession({ productId, customerEmail, customerName, returnUrl, metadata }) {
    try {
        const response = await axios.post(
            `${DODO_BASE_URL}/checkouts`,
            {
                product_cart: [{
                    product_id: productId,
                    quantity: 1
                }],
                customer: {
                    email: customerEmail,
                    name: customerName
                },
                return_url: returnUrl,
                metadata
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DODO_API_KEY}`
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Dodo API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to create checkout session');
    }
}

// Verify webhook signature (implement based on Dodo's webhook signature verification)
export function verifyWebhookSignature(payload, signature, secret) {
    // TODO: Implement signature verification based on Dodo's documentation
    return true;
}

// Get checkout session details
export async function getCheckoutSession(sessionId) {
    try {
        const response = await axios.get(
            `${DODO_BASE_URL}/checkouts/${sessionId}`,
            {
                headers: {
                    'Authorization': `Bearer ${DODO_API_KEY}`
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Dodo API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch checkout session');
    }
}
