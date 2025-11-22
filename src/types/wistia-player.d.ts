declare namespace JSX {
  interface IntrinsicElements {
    'wistia-player': {
      'media-id': string;
      aspect?: number;
      seo?: boolean;
      children?: React.ReactNode;
    };
  }
}
