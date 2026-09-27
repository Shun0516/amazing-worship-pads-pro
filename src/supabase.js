import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kvfhurjfroqskpqzgjox.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2Zmh1cmpmcm9xc2twcXpnam94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODY3MzMsImV4cCI6MjEwNjA2MjczM30.7825GILWKgcWXGAbEAS19C7BZnbV6R22hJYhr4IZWNo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);