
import { supabase } from '../supabaseClient';
import { Usuario, UsuarioBase } from '../types';

class UserManagementService {
  /**
   * Cria um novo usuário no Supabase Auth, o perfil correspondente,
   * e dispara um convite por e-mail para definição de senha.
   * @param email Email do colaborador
   * @param nome Nome completo
   * @param perfil Perfil de acesso (ADMINISTRADOR, LÍDER, etc)
   * @param bases Lista de associações de base
   */
  async criarUsuarioSupabase(
    email: string, 
    nome: string, 
    perfil: string, 
    bases: UsuarioBase[]
  ): Promise<{ sucess: boolean; message: string; data?: any }> {
    console.log(`[UserMgmt] Iniciando criação e convite para: ${email}`);

    try {
      // 1. Criar usuário no Supabase Auth com senha aleatória de alta entropia
      // Essa senha nunca será usada pelo usuário, ela é apenas um placeholder.
      const temporaryPassword = Math.random().toString(36).substring(2) + 
                                Math.random().toString(36).substring(2).toUpperCase() + 
                                "!@#$";

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: temporaryPassword,
        options: {
          data: {
            full_name: nome,
          }
        }
      });

      if (authError) {
        console.error('[UserMgmt] Erro no Auth SignUp:', authError.message);
        return { sucess: false, message: `Erro ao registrar no Auth: ${authError.message}` };
      }

      if (!authData.user) {
        return { sucess: false, message: 'Usuário criado, mas o servidor não retornou o identificador.' };
      }

      const userId = authData.user.id;
      console.log(`[UserMgmt] Auth UID: ${userId}. Gravando perfil operacional...`);

      // 2. Criar perfil na tabela 'public.profiles'
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          nome: nome,
          email: email,
          perfil: perfil,
          bases_associadas: bases,
          ativo: true,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('[UserMgmt] Erro ao criar perfil no DB:', profileError.message);
        return { sucess: false, message: `Usuário criado, mas erro ao salvar perfil: ${profileError.message}` };
      }

      // 3. DISPARAR EMAIL DE RESET/DEFINIÇÃO DE SENHA
      // Este comando envia o e-mail oficial do Supabase para o usuário.
      console.log(`[UserMgmt] Disparando link de definição de senha para ${email}...`);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#/reset-password', // Rota onde ele definirá a senha
      });

      if (resetError) {
        console.warn('[UserMgmt] E-mail de reset não enviado automaticamente:', resetError.message);
        return { 
          sucess: true, 
          message: 'Usuário criado! Mas houve um atraso no e-mail. Peça ao usuário para usar "Esqueci minha senha" no primeiro login.',
          data: authData.user 
        };
      }

      console.log('[UserMgmt] Fluxo de convite concluído com sucesso!');
      return { 
        sucess: true, 
        message: 'Conta criada! Um e-mail de boas-vindas foi enviado para o colaborador definir sua senha.',
        data: authData.user
      };

    } catch (error: any) {
      console.error('[UserMgmt] Erro catastrófico:', error);
      return { sucess: false, message: `Erro inesperado: ${error.message}` };
    }
  }
}

export const userManagementService = new UserManagementService();
