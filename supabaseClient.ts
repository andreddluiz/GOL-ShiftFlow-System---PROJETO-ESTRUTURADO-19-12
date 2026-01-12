import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO CLIENTE SUPABASE
 * Projeto: GOL ShiftFlow
 */
const supabaseUrl = 'https://hlffggifeaodejhtfczh.supabase.co';
const supabaseAnonKey = 'sb_publishable_49jRmvhUI4uDiH2TITry5w_4GMZ6V6J';

/**
 * Inicialização do cliente Supabase para uso em toda a aplicação.
 * Este cliente gerencia a comunicação com o banco de dados, autenticação e storage.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log de depuração para ambiente de desenvolvimento
console.debug('[Supabase] Cliente inicializado com sucesso para o projeto GOL ShiftFlow.');