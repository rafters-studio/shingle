export interface Publisher {
  "@type": string;
  name: string;
  logo: {
    "@type": string;
    url: string;
  };
}

export interface SiteConfig {
  name: string;
  url: string;
  twitterHandle: string;
  defaultAuthor: string;
  featuredCount: number;
  organization: string;
  logo: string;
}

export interface SocialImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

export class PostError extends Error {
  constructor(
    message: string,
    public slug?: string,
    public code: string = "POST_ERROR",
  ) {
    super(message);
    this.name = "PostError";
  }
}
