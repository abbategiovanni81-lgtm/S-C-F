import { getUncachableStripeClient } from './stripeClient';

interface ProductConfig {
  name: string;
  description: string;
  tier: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  features: string;
}

const PRODUCTS: ProductConfig[] = [
  {
    name: 'SocialCommand Core',
    description: '1 social channel, unlimited content with your own API keys. Perfect for solo creators.',
    tier: 'core',
    monthlyPrice: 999,
    yearlyPrice: 9900,
    features: '1_channel,own_apis,unlimited_with_keys'
  },
  {
    name: 'SocialCommand Premium',
    description: '3 social channels with platform AI credits. Includes voiceover, video creation, and image generation.',
    tier: 'premium',
    monthlyPrice: 2999,
    yearlyPrice: 29900,
    features: '3_channels,platform_apis,voiceover,video,images,social_listening'
  },
  {
    name: 'SocialCommand Pro',
    description: '5 social channels with 2x Premium quotas. Best for growing creators and small teams.',
    tier: 'pro',
    monthlyPrice: 4999,
    yearlyPrice: 49900,
    features: '5_channels,platform_apis,2x_quotas,voiceover,video,images,social_listening'
  },
  {
    name: 'SocialCommand Studio',
    description: '9 social channels, Creator Studio included, Steve AI video generation, 5 concurrent logins. Ultimate package for professional creators.',
    tier: 'studio',
    monthlyPrice: 9999,
    yearlyPrice: 99900,
    features: '9_channels,creator_studio,steve_ai,5_logins,3x_quotas'
  },
  {
    name: 'SocialCommand Creator Studio',
    description: 'Creator Studio add-on for Premium/Pro subscribers. Advanced AI creation tools.',
    tier: 'creator_studio',
    monthlyPrice: 2000,
    features: 'voice_cloning,talking_photos,face_swap,ai_dubbing'
  },
  {
    name: 'SocialCommand Usage Top-Up',
    description: 'Add 40% to your current monthly quotas (one-time purchase).',
    tier: 'topup',
    monthlyPrice: 1000,
    features: 'one_time,40_percent_boost'
  }
];

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  for (const config of PRODUCTS) {
    const searchQuery = `name:'${config.name}'`;
    const existingProducts = await stripe.products.search({ query: searchQuery });
    
    if (existingProducts.data.length > 0) {
      console.log(`${config.name} already exists:`, existingProducts.data[0].id);
      continue;
    }

    const product = await stripe.products.create({
      name: config.name,
      description: config.description,
      metadata: {
        tier: config.tier,
        features: config.features
      }
    });

    console.log('Created product:', config.name, '-', product.id);

    if (config.tier === 'topup') {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: config.monthlyPrice,
        currency: 'gbp',
        metadata: { billing: 'one_time', tier: config.tier }
      });
      console.log(`  One-time price: £${config.monthlyPrice / 100}`);
    } else {
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: config.monthlyPrice,
        currency: 'gbp',
        recurring: { interval: 'month' },
        metadata: { billing: 'monthly', tier: config.tier }
      });
      console.log(`  Monthly price: £${config.monthlyPrice / 100}/month -`, monthlyPrice.id);

      if (config.yearlyPrice) {
        const yearlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: config.yearlyPrice,
          currency: 'gbp',
          recurring: { interval: 'year' },
          metadata: { billing: 'yearly', tier: config.tier }
        });
        console.log(`  Yearly price: £${config.yearlyPrice / 100}/year -`, yearlyPrice.id);
      }
    }
  }

  console.log('\nStripe products setup complete!');
}

createProducts().catch(console.error);
