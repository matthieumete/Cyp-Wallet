export * from '../shared/types';

export interface SupabaseConfig {
  url: string;
  key: string;
  isEnabled: boolean;
  isFromEnv?: boolean;
}
