#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json

def test_api(url, data):
    """Função auxiliar para testar a API com dados específicos"""
    try:
        json_data = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=json_data,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f'Erro na requisição: {e}')
        return None

def test_busca_imoveis():
    try:
        print('🧪 Testando busca de imóveis por tipo...')
        
        # Teste 1: Buscar apenas apartamentos
        print('\n📍 Teste 1: Buscando apenas apartamentos...')
        data_apartamentos = {
            'agentId': '98e0230d-0c09-4395-aace-f851731255ea',  # ID válido do agente
            'tipo_imovel': 'apartamento'
        }
        
        response_apartamentos = test_api('http://localhost:5000/api/tools/busca_imoveis', data_apartamentos)
        
        if response_apartamentos:
            print(f'✅ Encontrados {response_apartamentos.get("total", 0)} apartamentos')
            
            # Verificar se todos os resultados são realmente apartamentos
            imoveis = response_apartamentos.get('imoveis', [])
            
            # Verificar pelo campo correto: property_type
            todos_apartamentos = all(
                imovel.get('property_type') and imovel['property_type'].lower() == 'apartamento'
                for imovel in imoveis
            )
            
            print(f'🔍 Verificando campo property_type: {[imovel.get("property_type", "N/A") for imovel in imoveis[:3]]}')
            print(f'🔍 Verificando campo tipo_transacao: {[imovel.get("tipo_transacao", "N/A") for imovel in imoveis[:3]]}')
            
            if todos_apartamentos:
                print('✅ Todos os imóveis retornados são apartamentos (verificado por property_type)')
            else:
                print('❌ Alguns imóveis retornados não são apartamentos (verificado por property_type)')
                property_types = list(set(imovel.get('property_type', '') for imovel in imoveis))
                print(f'Tipos de imóveis (property_type) encontrados: {property_types}')
                
                # Contar quantos apartamentos existem nos resultados
                apartamentos_encontrados = sum(1 for imovel in imoveis if imovel.get('property_type', '').lower() == 'apartamento')
                print(f'🔢 Apartamentos encontrados nos resultados: {apartamentos_encontrados} de {len(imoveis)}')
        
        # Teste 2: Buscar apenas casas
        print('\n📍 Teste 2: Buscando apenas casas...')
        data_casas = {
            'agentId': '98e0230d-0c09-4395-aace-f851731255ea',  # ID válido do agente
            'tipo_imovel': 'casa'
        }
        
        response_casas = test_api('http://localhost:5000/api/tools/busca_imoveis', data_casas)
        
        if response_casas:
            print(f'✅ Encontrados {response_casas.get("total", 0)} casas')
            
            # Verificar se todos os resultados são realmente casas
            imoveis = response_casas.get('imoveis', [])
            
            # Verificar pelo campo correto: property_type
            todos_casas = all(
                imovel.get('property_type') and imovel['property_type'].lower() == 'casa'
                for imovel in imoveis
            )
            
            print(f'🔍 Verificando campo property_type: {[imovel.get("property_type", "N/A") for imovel in imoveis[:3]]}')
            print(f'🔍 Verificando campo tipo_transacao: {[imovel.get("tipo_transacao", "N/A") for imovel in imoveis[:3]]}')
            
            if todos_casas:
                print('✅ Todos os imóveis retornados são casas')
            else:
                print('❌ Alguns imóveis retornados não são casas')
                tipos_encontrados = list(set(imovel.get('tipo_transacao', '') for imovel in imoveis))
                print(f'Tipos encontrados: {tipos_encontrados}')
                print(f'Quantidade por tipo: {[(imovel.get("tipo_transacao", "desconhecido")) for imovel in imoveis[:5]]}')
        
        # Teste 3: Buscar todos os imóveis (sem filtro)
        print('\n📍 Teste 3: Buscando todos os imóveis (sem filtro)...')
        data_todos = {
            'agentId': '98e0230d-0c09-4395-aace-f851731255ea'  # ID válido do agente
        }
        
        response_todos = test_api('http://localhost:5000/api/tools/busca_imoveis', data_todos)
        
        if response_todos:
            print(f'✅ Encontrados {response_todos.get("total", 0)} imóveis no total')
            
    except Exception as error:
        print(f'❌ Erro no teste: {error}')

if __name__ == "__main__":
    print('📝 Script de teste para a API busca_imoveis')
    print('⚠️  Antes de executar, substitua "test-agent-id" por um ID de agente válido!')
    print('')
    print('Para executar o teste:')
    print('python3 test_busca_imoveis.py')
    print('')
    
    # Verificar se o servidor está rodando
    try:
        response = urllib.request.urlopen('http://localhost:5000/api/auth/login', timeout=5)
        print('✅ Servidor está rodando em http://localhost:5000')
        print('')
        test_busca_imoveis()
    except Exception as e:
        print('❌ Servidor não está rodando em http://localhost:5000')
        print('Por favor, inicie o servidor antes de executar este teste.')
        print(f'Erro: {e}')