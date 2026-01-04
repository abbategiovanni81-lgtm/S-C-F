const REDDIT_USER_AGENT = 'SocialCommandFlow/1.0 by SocialCommand';

interface RedditTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface RedditUser {
  name: string;
  id: string;
  icon_img?: string;
}

interface SubmitResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export class RedditService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.REDDIT_CLIENT_ID || '';
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET || '';
    this.redirectUri = process.env.REDDIT_REDIRECT_URI || `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/api/reddit/callback`;
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(state: string): string {
    const scopes = ['identity', 'submit', 'read', 'mysubreddits'].join(' ');
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      state: state,
      redirect_uri: this.redirectUri,
      duration: 'permanent',
      scope: scopes,
    });
    return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<RedditTokens> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': REDDIT_USER_AGENT,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to exchange code: ${text}`);
    }

    return response.json() as Promise<RedditTokens>;
  }

  async refreshAccessToken(refreshToken: string): Promise<RedditTokens> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': REDDIT_USER_AGENT,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to refresh token: ${text}`);
    }

    return response.json() as Promise<RedditTokens>;
  }

  async getCurrentUser(accessToken: string): Promise<RedditUser> {
    const response = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': REDDIT_USER_AGENT,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to get user: ${text}`);
    }

    return response.json() as Promise<RedditUser>;
  }

  async submitTextPost(
    accessToken: string,
    subreddit: string,
    title: string,
    text: string
  ): Promise<SubmitResult> {
    const response = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': REDDIT_USER_AGENT,
      },
      body: new URLSearchParams({
        api_type: 'json',
        sr: subreddit,
        kind: 'self',
        title: title,
        text: text,
        resubmit: 'true',
        send_replies: 'true',
      }).toString(),
    });

    const data = await response.json() as any;

    if (data.json?.errors?.length > 0) {
      const errorMsg = data.json.errors.map((e: string[]) => e.join(': ')).join(', ');
      return { success: false, error: errorMsg };
    }

    if (data.json?.data?.id && data.json?.data?.url) {
      return {
        success: true,
        postId: data.json.data.id,
        postUrl: data.json.data.url,
      };
    }

    return { success: false, error: 'Unknown error submitting post' };
  }

  async submitLinkPost(
    accessToken: string,
    subreddit: string,
    title: string,
    url: string
  ): Promise<SubmitResult> {
    const response = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': REDDIT_USER_AGENT,
      },
      body: new URLSearchParams({
        api_type: 'json',
        sr: subreddit,
        kind: 'link',
        title: title,
        url: url,
        resubmit: 'true',
        send_replies: 'true',
      }).toString(),
    });

    const data = await response.json() as any;

    if (data.json?.errors?.length > 0) {
      const errorMsg = data.json.errors.map((e: string[]) => e.join(': ')).join(', ');
      return { success: false, error: errorMsg };
    }

    if (data.json?.data?.id && data.json?.data?.url) {
      return {
        success: true,
        postId: data.json.data.id,
        postUrl: data.json.data.url,
      };
    }

    return { success: false, error: 'Unknown error submitting link post' };
  }

  async getSubredditInfo(accessToken: string, subreddit: string): Promise<any> {
    const response = await fetch(`https://oauth.reddit.com/r/${subreddit}/about`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': REDDIT_USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get subreddit info: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.data;
  }

  async getUserSubreddits(accessToken: string): Promise<any[]> {
    const response = await fetch('https://oauth.reddit.com/subreddits/mine/subscriber?limit=100', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': REDDIT_USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user subreddits: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.data?.children?.map((c: any) => c.data) || [];
  }
}

export const redditService = new RedditService();
