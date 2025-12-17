export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  duration: number;
  user: {
    name: string;
    url: string;
  };
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
  video_pictures: Array<{
    id: number;
    picture: string;
    nr: number;
  }>;
}

export interface PexelsSearchResult {
  photos?: PexelsPhoto[];
  videos?: PexelsVideo[];
  total_results: number;
  page: number;
  per_page: number;
}

export interface BRollResult {
  type: "photo" | "video";
  id: number;
  url: string;
  previewUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
  duration?: number;
  attribution: string;
}

export class PexelsService {
  private apiKey: string | undefined;
  private baseUrl = "https://api.pexels.com";

  constructor() {
    this.apiKey = process.env.PEXELS_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async searchPhotos(query: string, perPage: number = 10, page: number = 1): Promise<BRollResult[]> {
    if (!this.apiKey) {
      throw new Error("Pexels API key not configured. Please add PEXELS_API_KEY to your secrets.");
    }

    const params = new URLSearchParams({
      query,
      per_page: perPage.toString(),
      page: page.toString(),
    });

    const response = await fetch(`${this.baseUrl}/v1/search?${params}`, {
      headers: {
        Authorization: this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pexels API error: ${error}`);
    }

    const data = await response.json() as { photos: PexelsPhoto[] };
    
    return data.photos.map((photo) => ({
      type: "photo" as const,
      id: photo.id,
      url: photo.url,
      previewUrl: photo.src.medium,
      downloadUrl: photo.src.large,
      width: photo.width,
      height: photo.height,
      attribution: `Photo by ${photo.photographer} on Pexels`,
    }));
  }

  async searchVideos(query: string, perPage: number = 10, page: number = 1): Promise<BRollResult[]> {
    if (!this.apiKey) {
      throw new Error("Pexels API key not configured. Please add PEXELS_API_KEY to your secrets.");
    }

    const params = new URLSearchParams({
      query,
      per_page: perPage.toString(),
      page: page.toString(),
    });

    const response = await fetch(`${this.baseUrl}/videos/search?${params}`, {
      headers: {
        Authorization: this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pexels API error: ${error}`);
    }

    const data = await response.json() as { videos: PexelsVideo[] };
    
    return data.videos.map((video) => {
      const hdFile = video.video_files.find(f => f.quality === "hd") || video.video_files[0];
      const preview = video.video_pictures[0]?.picture || "";
      
      return {
        type: "video" as const,
        id: video.id,
        url: video.url,
        previewUrl: preview,
        downloadUrl: hdFile?.link || "",
        width: video.width,
        height: video.height,
        duration: video.duration,
        attribution: `Video by ${video.user.name} on Pexels`,
      };
    });
  }

  async searchBRoll(query: string, mediaType: "photos" | "videos" | "both" = "both", perPage: number = 10): Promise<BRollResult[]> {
    if (!this.apiKey) {
      throw new Error("Pexels API key not configured. Please add PEXELS_API_KEY to your secrets.");
    }

    const results: BRollResult[] = [];

    if (mediaType === "photos" || mediaType === "both") {
      const photos = await this.searchPhotos(query, mediaType === "both" ? Math.floor(perPage / 2) : perPage);
      results.push(...photos);
    }

    if (mediaType === "videos" || mediaType === "both") {
      const videos = await this.searchVideos(query, mediaType === "both" ? Math.floor(perPage / 2) : perPage);
      results.push(...videos);
    }

    return results;
  }

  async getCuratedPhotos(perPage: number = 10): Promise<BRollResult[]> {
    if (!this.apiKey) {
      throw new Error("Pexels API key not configured. Please add PEXELS_API_KEY to your secrets.");
    }

    const response = await fetch(`${this.baseUrl}/v1/curated?per_page=${perPage}`, {
      headers: {
        Authorization: this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pexels API error: ${error}`);
    }

    const data = await response.json() as { photos: PexelsPhoto[] };
    
    return data.photos.map((photo) => ({
      type: "photo" as const,
      id: photo.id,
      url: photo.url,
      previewUrl: photo.src.medium,
      downloadUrl: photo.src.large,
      width: photo.width,
      height: photo.height,
      attribution: `Photo by ${photo.photographer} on Pexels`,
    }));
  }

  async getPopularVideos(perPage: number = 10): Promise<BRollResult[]> {
    if (!this.apiKey) {
      throw new Error("Pexels API key not configured. Please add PEXELS_API_KEY to your secrets.");
    }

    const response = await fetch(`${this.baseUrl}/videos/popular?per_page=${perPage}`, {
      headers: {
        Authorization: this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pexels API error: ${error}`);
    }

    const data = await response.json() as { videos: PexelsVideo[] };
    
    return data.videos.map((video) => {
      const hdFile = video.video_files.find(f => f.quality === "hd") || video.video_files[0];
      const preview = video.video_pictures[0]?.picture || "";
      
      return {
        type: "video" as const,
        id: video.id,
        url: video.url,
        previewUrl: preview,
        downloadUrl: hdFile?.link || "",
        width: video.width,
        height: video.height,
        duration: video.duration,
        attribution: `Video by ${video.user.name} on Pexels`,
      };
    });
  }
}

export const pexelsService = new PexelsService();
