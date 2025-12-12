import requests
import json
import sys

# Configuração da API
API_URL = "http://localhost:5000/api/busca_imoveis"

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
        # Fazendo a requisição POST
        response = requests.post(API_URL, json=test_data, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Requisição bem sucedida!")
            print(f"Total de imóveis retornados: {len(data.get('properties', []))}")
            
            # Verificando os tipos de imóveis
            properties = data.get('properties', [])
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
            print(f"❌ Erro na requisição: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Detalhes do erro: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Resposta: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Erro de conexão: Não foi possível conectar à API.")
        print("Verifique se o servidor está rodando em http://localhost:5000")
    except requests.exceptions.Timeout:
        print("❌ Timeout: A requisição demorou demais para responder.")
    except Exception as e:
        print(f"❌ Erro inesperado: {str(e)}")

if __name__ == "__main__":
    test_api()