import urllib.request
import urllib.parse
import json
import sys

# Configuração da API
API_URL = "http://localhost:5000/api/tools/busca_imoveis"

# Dados de teste
test_data = {
    'agentId': '98e0230d-0c09-4395-aace-f851731255ea',
    'tipo_imovel': 'apartamento'
}

def test_api():
    print("🔍 Testando a API busca_imoveis...")
    print(f"URL: {API_URL}")
    print(f"Dados: {json.dumps(test_data, indent=2)}")
    print("-" * 50)
    
    try:
        # Preparando os dados
        json_data = json.dumps(test_data).encode('utf-8')
        
        # Criando a requisição
        req = urllib.request.Request(
            API_URL,
            data=json_data,
            headers={
                'Content-Type': 'application/json',
                'Content-Length': len(json_data)
            },
            method='POST'
        )
        
        # Fazendo a requisição
        with urllib.request.urlopen(req, timeout=10) as response:
            status_code = response.getcode()
            print(f"Status Code: {status_code}")
            
            if status_code == 200:
                response_text = response.read().decode('utf-8')
                print(f"Resposta bruta (primeiros 200 chars): {response_text[:200]}")
                
                if not response_text.strip():
                    print("⚠️ Resposta vazia!")
                    return
                    
                try:
                    data = json.loads(response_text)
                except json.JSONDecodeError as e:
                    print(f"❌ Erro ao decodificar JSON: {e}")
                    print(f"Resposta completa: {response_text}")
                    return
                print(f"✅ Requisição bem sucedida!")
                print(f"Total de imóveis retornados: {len(data.get('imoveis', []))}")
                
                # Verificando os tipos de imóveis
                properties = data.get('imoveis', [])
                if properties:
                    print("\n📊 Análise dos resultados:")
                    
                    # Contando tipos de imóveis
                    tipos = {}
                    for prop in properties:
                        prop_type = prop.get('property_type', 'N/A')
                        tipos[prop_type] = tipos.get(prop_type, 0) + 1
                    
                    print("Tipos de imóveis encontrados:")
                    for tipo, count in tipos.items():
                        print(f"  - {tipo}: {count}")
                    
                    # Verificando se são todos apartamentos
                    apartamentos = sum(1 for prop in properties if prop.get('property_type') == 'apartamento')
                    print(f"\n🏢 Apartamentos encontrados: {apartamentos} de {len(properties)}")
                    
                    if apartamentos == len(properties):
                        print("✅ Todos os imóveis retornados são apartamentos!")
                    else:
                        print("❌ Alguns imóveis retornados não são apartamentos!")
                        
                    # Mostrando exemplos de imóveis
                    print("\n📋 Exemplos de imóveis retornados:")
                    for i, prop in enumerate(properties[:3]):
                        print(f"  {i+1}. ID: {prop.get('id', 'N/A')}")
                        print(f"     Tipo: {prop.get('property_type', 'N/A')}")
                        print(f"     Título: {prop.get('title', 'N/A')}")
                        print(f"     Transação: {prop.get('tipo_transacao', 'N/A')}")
                        print()
                else:
                    print("⚠️ Nenhum imóvel retornado!")
            else:
                print(f"❌ Erro na requisição: {status_code}")
                try:
                    error_data = json.loads(response.read().decode('utf-8'))
                    print(f"Detalhes do erro: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"Resposta: {response.read().decode('utf-8')}")
                    
    except urllib.error.URLError as e:
        if isinstance(e.reason, ConnectionRefusedError):
            print("❌ Erro de conexão: Não foi possível conectar à API.")
            print("Verifique se o servidor está rodando em http://localhost:5000")
        else:
            print(f"❌ Erro de URL: {e.reason}")
    except Exception as e:
        print(f"❌ Erro inesperado: {str(e)}")

if __name__ == "__main__":
    test_api()