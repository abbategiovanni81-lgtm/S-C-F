import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { db } from './db';
import { users } from '@shared/models/auth';
import { eq } from 'drizzle-orm';
import { applyTopup } from './usageService';

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

    // After syncing, check for subscription events and update user tiers
    const stripe = await getUncachableStripeClient();
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      (await sync.findOrCreateManagedWebhook('')).webhook.secret
    );

    // Handle subscription events to update user tier
    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any;
      const customerId = subscription.customer;
      
      // Determine the tier from the subscription's product metadata
      let tier = 'premium'; // Default
      let creatorStudioAccess = false;
      let maxSessions = 1;
      
      if (subscription.items?.data?.length > 0) {
        const priceId = subscription.items.data[0].price?.id;
        if (priceId) {
          const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
          const product = price.product as any;
          const productTier = product?.metadata?.tier;
          
          if (productTier === 'core') {
            tier = 'core';
          } else if (productTier === 'premium') {
            tier = 'premium';
          } else if (productTier === 'pro') {
            tier = 'pro';
          } else if (productTier === 'studio') {
            tier = 'studio';
            creatorStudioAccess = true;
            maxSessions = 5;
          }
        }
      }
      
      // Find user by stripe customer id and update tier
      if (subscription.status === 'active') {
        await db.update(users)
          .set({ 
            tier,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            ...(tier === 'studio' && { creatorStudioAccess, maxSessions })
          })
          .where(eq(users.stripeCustomerId, customerId));
        console.log(`User upgraded to ${tier} via subscription: ${subscription.id}`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      const customerId = subscription.customer;
      
      // Check if this is a main subscription (not Creator Studio add-on)
      // and downgrade to free
      const [user] = await db.select().from(users)
        .where(eq(users.stripeSubscriptionId, subscription.id));
      
      if (user) {
        await db.update(users)
          .set({ tier: 'free', stripeSubscriptionId: null, maxSessions: 1 })
          .where(eq(users.stripeSubscriptionId, subscription.id));
        console.log(`User downgraded to free, subscription cancelled: ${subscription.id}`);
      }
    }

    // Handle completed checkout sessions for top-ups and Creator Studio
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      
      // Check if this is a top-up payment
      if (session.metadata?.type === 'topup' && session.payment_status === 'paid') {
        const userId = session.metadata.userId;
        
        if (userId) {
          try {
            await applyTopup(userId, session.id, 1000); // £10 = 1000 pence
            console.log(`Top-up applied for user: ${userId}, session: ${session.id}`);
          } catch (error) {
            console.error(`Failed to apply top-up for user ${userId}:`, error);
          }
        }
      }

      // Check if this is a Creator Studio subscription
      if (session.metadata?.type === 'creator_studio' && session.subscription) {
        const userId = session.metadata.userId;
        
        if (userId) {
          await db.update(users)
            .set({ 
              creatorStudioAccess: true,
              creatorStudioStripeId: session.subscription 
            })
            .where(eq(users.id, userId));
          console.log(`Creator Studio enabled for user: ${userId}`);
        }
      }
    }

    // Handle Creator Studio subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      
      // Check if this is a Creator Studio subscription being cancelled
      await db.update(users)
        .set({ creatorStudioAccess: false, creatorStudioStripeId: null })
        .where(eq(users.creatorStudioStripeId, subscription.id));
      console.log(`Creator Studio disabled for subscription: ${subscription.id}`);
    }
  }
}
