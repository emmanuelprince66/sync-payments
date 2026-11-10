/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_AUTH_MODE?: "api" | "mock"
  readonly VITE_GEOAPIFY_KEY?: string
}
interface ImportMeta { readonly env: ImportMetaEnv }
