const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export const loadRazorpayScript = () => new Promise((resolve) => {
    if (typeof window === 'undefined') {
        resolve(false);
        return;
    }

    if (window.Razorpay) {
        resolve(true);
        return;
    }

    const existing = document.querySelector(`script[src="${RAZORPAY_SRC}"]`);
    if (existing) {
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
        return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

export default loadRazorpayScript;
