
class DataIsolationService {
  obterDadosIsolados(perfil: string, tipo: string): any[] {
    if (tipo === 'bases') {
      const data = localStorage.getItem('gol_shiftflow_bases_v2');
      return data ? JSON.parse(data) : [];
    }
    return [];
  }
}

export const dataIsolationService = new DataIsolationService();
