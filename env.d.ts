/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ENVIRONMENT: string;
  // Добавьте здесь другие переменные, если нужно
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
