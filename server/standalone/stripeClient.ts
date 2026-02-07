
import Stripe from 'stripe';

async function getCredentials() {
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY) {
    return {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
    };
  }
  
  if (process.env.NODE_ENV !== 'production') {
    return { publishableKey: "pk_test_dummy", secretKey: "sk_test_dummy" };
  }
  throw new Error('Stripe credentials not found. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY.');
}

export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, {
    apiVersion: '2025-11-17.clover' as any,
  });
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}

// Standalone version doesn't use stripe-replit-sync by default
export async function getStripeSync() {
  console.warn("StripeSync is not available in standalone mode without extra configuration.");
  return null;
}
