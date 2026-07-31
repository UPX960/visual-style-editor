export {};

declare global {
  interface Window {
    __VSE_CONTENT_BOOTSTRAPPED__?: boolean;
  }
}
