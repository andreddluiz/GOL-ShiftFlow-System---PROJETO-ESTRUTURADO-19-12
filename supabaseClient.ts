
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO CLIENTE SUPABASE
 * Suporta variáveis de ambiente do Vite para Deploy (Netlify)
 */
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://hlffggifeaodejhtfczh.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_49jRmvhUI4uDiH2TITry5w_4GMZ6V6J';

/**
 * Inicialização do cliente Supabase.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Log de inicialização com proteção de acesso ao ambiente.
 */
console.debug('[Supabase] Cliente inicializado. Ambiente:', env.MODE || 'production');
