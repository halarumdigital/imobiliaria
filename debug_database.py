import mysql.connector
from mysql.connector import Error

def debug_database():
    try:
        # Conectar ao banco de dados
        connection = mysql.connector.connect(
            host='31.97.91.252',
            port=3306,
            user='alugamai_dev',
            password='MbRWU14S5D9b',
            database='alugamai_dev'
        )
        
        if connection.is_connected():
            print('🔍 Conectado ao banco de dados')
            cursor = connection.cursor(dictionary=True)
            
            # Verificar estrutura da tabela
            print('\n📋 Estrutura da tabela properties:')
            cursor.execute('DESCRIBE properties')
            structure = cursor.fetchall()
            for column in structure:
                print(f"  {column['Field']}: {column['Type']} (Null: {column['Null']}, Default: {column['Default']})")
            
            # Verificar todos os imóveis ativos
            print('\n📊 Todos os imóveis ativos (primeiros 10):')
            cursor.execute("""
                SELECT id, name, property_type, transaction_type, city, status, company_id, created_at
                FROM properties 
                WHERE status = 'active'
                ORDER BY created_at DESC
                LIMIT 10
            """)
            all_properties = cursor.fetchall()
            for prop in all_properties:
                print(f"  ID: {prop['id']}, Name: {prop['name']}, Type: {prop['property_type']}, Transaction: {prop['transaction_type']}")
            
            # Verificar especificamente os apartamentos
            print('\n🏢 Verificando apartamentos:')
            cursor.execute("""
                SELECT COUNT(*) as total_apartamentos, property_type
                FROM properties 
                WHERE property_type = 'apartamento' AND status = 'active'
                GROUP BY property_type
            """)
            apartments = cursor.fetchall()
            print(f"  Apartamentos encontrados: {apartments}")
            
            # Verificar todos os tipos de imóveis
            print('\n🏠 Tipos de imóveis cadastrados:')
            cursor.execute("""
                SELECT property_type, COUNT(*) as quantidade
                FROM properties 
                WHERE status = 'active'
                GROUP BY property_type
                ORDER BY quantidade DESC
            """)
            property_types = cursor.fetchall()
            for prop_type in property_types:
                print(f"  {prop_type['property_type']}: {prop_type['quantidade']} imóveis")
            
            # Verificar o total de imóveis ativos
            cursor.execute("SELECT COUNT(*) as total FROM properties WHERE status = 'active'")
            total_active = cursor.fetchone()
            print(f"\n📈 Total de imóveis ativos: {total_active['total']}")
            
            # Testar a query de busca exata usada no método searchProperties
            print('\n🔍 Testando query de busca por apartamentos:')
            cursor.execute("""
                SELECT * FROM properties 
                WHERE company_id = %s AND status = %s AND LOWER(property_type) = %s
                ORDER BY created_at DESC
            """, ('98e0230d-0c09-4395-aace-f851731255ea', 'active', 'apartamento'))
            
            search_test = cursor.fetchall()
            print(f"Encontrados {len(search_test)} apartamentos com a query exata:")
            for prop in search_test[:3]:
                print(f"  ID: {prop['id']}, Name: {prop['name']}, Type: {prop['property_type']}, Transaction: {prop['transaction_type']}")
            
            # Verificar se existem imóveis com property_type NULL ou vazio
            print('\n❓ Verificando imóveis com property_type NULL ou vazio:')
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM properties 
                WHERE status = 'active' AND (property_type IS NULL OR property_type = '' OR property_type = 'N/A')
            """)
            null_types = cursor.fetchone()
            print(f"  Imóveis com property_type NULL/vazio/N/A: {null_types['count']}")
            
            cursor.close()
            connection.close()
            print('\n✅ Conexão encerrada')
            
    except Error as e:
        print(f'❌ Erro ao conectar ao banco de dados: {e}')

if __name__ == '__main__':
    debug_database()