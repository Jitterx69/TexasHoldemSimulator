import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://vkjdwblamiitfbwuhnzs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZramR3YmxhbWlpdGZid3VobnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTM3MzEsImV4cCI6MjA3NTA4OTczMX0.WKNafF9r7DeV2yH7m5iLgGgenVrDdWyhJZnWUJhQM4I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});