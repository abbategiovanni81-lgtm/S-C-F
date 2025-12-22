import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  // Check if premium product already exists
  const existingProducts = await stripe.products.search({ 
    query: "name:'SocialCommand Premium'" 
  });
  
  if (existingProducts.data.length > 0) {
    console.log('Premium product already exists:', existingProducts.data[0].id);
    return;
  }

  // Create Premium subscription product
  const product = await stripe.products.create({
    name: 'SocialCommand Premium',
    description: 'Full access to all AI features including content generation, voice synthesis, video creation, and social listening.',
    metadata: {
      tier: 'premium',
      features: 'ai_content,voice,video,images,social_listening'
    }
  });

  console.log('Created product:', product.id);

  // Create monthly price
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 2900, // $29.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { billing: 'monthly' }
  });

  console.log('Created monthly price:', monthlyPrice.id, '- $29/month');

  // Create yearly price (with discount)
  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 29000, // $290.00/year ($24.17/month - 17% savings)
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { billing: 'yearly' }
  });

  console.log('Created yearly price:', yearlyPrice.id, '- $290/year');

  console.log('\nStripe products created successfully!');
  console.log('Product ID:', product.id);
  console.log('Monthly Price ID:', monthlyPrice.id);
  console.log('Yearly Price ID:', yearlyPrice.id);
}

createProducts().catch(console.error);
