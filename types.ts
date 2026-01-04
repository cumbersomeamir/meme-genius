
export interface MemeTemplate {
  id: string;
  name: string;
  url: string;
}

export interface MemeState {
  image: string | null;
  topText: string;
  bottomText: string;
  fontSize: number;
  fontColor: string;
}

export interface MagicCaptionResponse {
  captions: string[];
}
