/**
 * Razorpay Standard Checkout Client Utility.
 * 
 * Safely loads Razorpay Checkout Web SDK and orchestrates
 * order creation, modal popup, and server-side verification.
 */

import { api } from '../api/client';

let scriptLoadingPromise = null;

export function loadRazorpayScript() {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
}

/**
 * Initiates the complete Razorpay checkout flow.
 * 
 * @param {Object} params
 * @param {string} params.planSlug - Plan slug (e.g. 'pro')
 * @param {Function} params.onStateChange - Callback (idle | loading | checkout_open | verifying | success | failed | cancelled)
 * @param {Function} params.onSuccess - Callback after successful server verification
 * @param {Function} params.onError - Callback on checkout/verification error
 * @param {Function} params.onDismiss - Callback when user cancels/dismisses modal
 */
export async function startRazorpayCheckout({
  planSlug = 'pro',
  onStateChange,
  onSuccess,
  onError,
  onDismiss,
}) {
  try {
    onStateChange?.('loading');

    // 1. Ensure Razorpay SDK script is loaded
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      throw new Error('Could not load payment gateway. Please check your internet connection.');
    }

    // 2. Request backend order creation (server calculates price from DB)
    const orderData = await api.post('/payments/create-order', { plan_id: planSlug, ts: Date.now() });

    if (!orderData || !orderData.order_id) {
      throw new Error(orderData?.error || 'Failed to initialize payment order with server.');
    }

    onStateChange?.('checkout_open');

    // 3. Open Razorpay Standard Checkout Modal
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: 'Vakeel Assist',
      description: `${orderData.plan_name || 'Pro Plan'} Subscription`,
      order_id: orderData.order_id,
      prefill: {
        name: orderData.user_name || '',
        email: orderData.user_email || '',
        contact: orderData.user_phone || '',
      },
      theme: {
        color: '#b8935e', // Gold accent theme
        backdrop_color: 'rgba(11, 21, 38, 0.85)',
      },
      modal: {
        ondismiss: () => {
          onStateChange?.('cancelled');
          onDismiss?.();
        },
        escape: true,
        confirm_close: true,
      },
      handler: async function (response) {
        // 4. Payment completed in Razorpay modal -> Send to server for HMAC-SHA256 signature verification
        onStateChange?.('verifying');
        try {
          const verifyResult = await api.post('/payments/verify', {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });

          onStateChange?.('success');
          onSuccess?.(verifyResult);
        } catch (verifyError) {
          onStateChange?.('failed');
          onError?.(verifyError);
        }
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', function (resp) {
      onStateChange?.('failed');
      const errReason = resp?.error?.description || 'Payment failed at gateway.';
      onError?.(new Error(errReason));
    });

    rzp.open();
  } catch (err) {
    onStateChange?.('failed');
    onError?.(err);
  }
}
