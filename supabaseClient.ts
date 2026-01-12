// Fix: Removed problematic triple-slash reference to 'vite/client' which was causing a 'Cannot find type definition' error
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO CLIENTE SUPABASE
 * Suporta variáveis de ambiente do Vite para Deploy (Netlify)
 * Adicionado encadeamento opcional (?.) para evitar erro de 'undefined' em ambientes sem build.
 */
// Fix: Using any casting on import.meta to bypass missing Vite type definitions and safely access the env property
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
// Fix: Use the casted env helper to safely access the current environment mode
console.debug('[Supabase] Cliente inicializado. Ambiente:', env.MODE || 'production');