export interface GettyImage {
  id: string;
  title: string;
  caption: string;
  displaySizes: { name: string; uri: string }[];
  thumbUri: string;
  previewUri: string;
  downloadUri: string;
}

export interface GettySearchResult {
  images: GettyImage[];
  resultCount: number;
}

export class GettyImagesService {
  private apiKey: string | undefined;
  private apiSecret: string | undefined;
  private baseUrl = "https://api.gettyimages.com/v3";

  constructor() {
    this.apiKey = process.env.GETTY_API_KEY;
    this.apiSecret = process.env.GETTY_API_SECRET;
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.apiSecret;
  }

  async searchImages(query: string, options: { limit?: number; page?: number } = {}): Promise<GettySearchResult> {
    if (!this.apiKey) {
      throw new Error("Getty Images API key not configured. Please add GETTY_API_KEY to your secrets.");
    }

    const limit = options.limit || 10;
    const page = options.page || 1;

    const params = new URLSearchParams({
      phrase: query,
      page_size: limit.toString(),
      page: page.toString(),
      fields: "id,title,caption,display_set,thumb,preview",
      sort_order: "best_match",
    });

    const response = await fetch(`${this.baseUrl}/search/images?${params}`, {
      headers: {
        "Api-Key": this.apiKey,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Getty Images API error: ${error}`);
    }

    const data = await response.json();

    const images: GettyImage[] = (data.images || []).map((img: any) => {
      const displaySizes = img.display_sizes || [];
      const thumb = displaySizes.find((d: any) => d.name === "thumb") || displaySizes[0];
      const preview = displaySizes.find((d: any) => d.name === "preview") || displaySizes[0];

      return {
        id: img.id,
        title: img.title || "Untitled",
        caption: img.caption || "",
        displaySizes,
        thumbUri: thumb?.uri || "",
        previewUri: preview?.uri || "",
        downloadUri: "",
      };
    });

    return {
      images,
      resultCount: data.result_count || images.length,
    };
  }

  async getImageDownloadUrl(imageId: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Getty Images API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/downloads/images/${imageId}`, {
      method: "POST",
      headers: {
        "Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_type: "premiumaccess",
        download_details: {
          download_notes: "SocialCommand content creation",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Getty Images download error: ${error}`);
    }

    const data = await response.json();
    return data.uri || data.download_uri || "";
  }
}

export const gettyService = new GettyImagesService();
