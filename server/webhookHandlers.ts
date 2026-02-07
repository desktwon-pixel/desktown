import { getStripeSync } from './stripeClient.ts';
import { db } from './db.ts';
import { serviceOrders } from '../shared/schema.ts';
import { eq } from 'drizzle-orm';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);
  }

  static async handleCheckoutSessionCompleted(session: any): Promise<void> {
    const orderId = session.metadata?.orderId;
    if (!orderId) return;

    await db.update(serviceOrders)
      .set({
        status: 'paid',
        stripePaymentIntentId: session.payment_intent,
        stripeInvoiceUrl: session.invoice ? `https://invoice.stripe.com/i/${session.invoice}` : null,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(serviceOrders.id, parseInt(orderId)));
  }

  static async handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) return;

    await db.update(serviceOrders)
      .set({
        status: 'paid',
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(serviceOrders.id, parseInt(orderId)));
  }

  static async handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) return;

    await db.update(serviceOrders)
      .set({
        status: 'payment_failed',
        updatedAt: new Date(),
      })
      .where(eq(serviceOrders.id, parseInt(orderId)));
  }
}
