export interface SchemaOrg {
  "@context": "https://schema.org";
  "@type": string;
  [key: string]: unknown;
}

export interface ContentPostingSchema extends SchemaOrg {
  "@type": "BlogPosting";
  headline: string;
  description: string;
  author: {
    "@type": "Person";
    name: string;
    image: string;
  };
  datePublished: string;
  dateModified: string;
  image: string;
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
    additionalType: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    logo: {
      "@type": "ImageObject";
      url: string;
    };
  };
  keywords: string;
  articleBody: string;
  articleSection: string;
  wordcount: number;
  featured: boolean;
  draft?: boolean;
}

export interface ContentTree {
  path: string;
  type: "file" | "dir";
  name: string;
  children?: ContentTree[];
  content?: ContentFile;
}

export interface ContentFile {
  path: string;
  slug: string;
  schema: ContentPostingSchema;
  readingTime: string;
  rawContent: string;
}

export interface PostParams {
  slug: string;
}

export interface PostPageProps {
  params: Promise<PostParams>;
}

export interface PostListPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}
