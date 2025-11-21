// Global type declaration for wistia-player element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wistia-player': {
        'media-id': string;
        seo: boolean;
        aspect: number;
        className?: string;
      };
    }
  }
}

export {};