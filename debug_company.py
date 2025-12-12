import mysql.connector
from mysql.connector import Error

def debug_company():
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
            
            # Verificar qual company_id está sendo usado
            company_id = '98e0230d-0c09-4395-aace-f851731255ea'
            print(f'\n🏢 Verificando imóveis para a company_id: {company_id}')
            
            # Verificar se existem imóveis para esta empresa
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM properties 
                WHERE company_id = %s AND status = 'active'
            """, (company_id,))
            total_company = cursor.fetchone()
            print(f"  Total de imóveis para esta empresa: {total_company['total']}")
            
            # Verificar apartamentos para esta empresa
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM properties 
                WHERE company_id = %s AND status = 'active' AND property_type = 'apartamento'
            """, (company_id,))
            apartments_company = cursor.fetchone()
            print(f"  Apartamentos para esta empresa: {apartments_company['total']}")
            
            # Verificar todos os imóveis desta empresa
            cursor.execute("""
                SELECT id, name, property_type, transaction_type
                FROM properties 
                WHERE company_id = %s AND status = 'active'
                ORDER BY created_at DESC
            """, (company_id,))
            company_properties = cursor.fetchall()
            print(f"\n📋 Todos os imóveis da empresa ({len(company_properties)}):")
            for prop in company_properties:
                print(f"  ID: {prop['id']}, Name: {prop['name']}, Type: {prop['property_type']}, Transaction: {prop['transaction_type']}")
            
            # Testar diferentes variações da query
            print(f"\n🧪 Testando variações da query:")
            
            # Query 1: Com LOWER
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM properties 
                WHERE company_id = %s AND status = %s AND LOWER(property_type) = %s
            """, (company_id, 'active', 'apartamento'))
            test1 = cursor.fetchone()
            print(f"  Com LOWER(property_type): {test1['total']} resultados")
            
            # Query 2: Sem LOWER
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM properties 
                WHERE company_id = %s AND status = %s AND property_type = %s
            """, (company_id, 'active', 'apartamento'))
            test2 = cursor.fetchone()
            print(f"  Sem LOWER(property_type): {test2['total']} resultados")
            
            # Query 3: Com LIKE
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM properties 
                WHERE company_id = %s AND status = %s AND property_type LIKE %s
            """, (company_id, 'active', 'apartamento'))
            test3 = cursor.fetchone()
            print(f"  Com LIKE 'apartamento': {test3['total']} resultados")
            
            # Verificar todas as empresas
            print(f"\n🏢 Todas as empresas com imóveis:")
            cursor.execute("""
                SELECT DISTINCT company_id, COUNT(*) as total
                FROM properties 
                WHERE status = 'active'
                GROUP BY company_id
                ORDER BY total DESC
            """)
            companies = cursor.fetchall()
            for comp in companies:
                print(f"  Company ID: {comp['company_id']}, Total: {comp['total']} imóveis")
            
            cursor.close()
            connection.close()
            print('\n✅ Conexão encerrada')
            
    except Error as e:
        print(f'❌ Erro ao conectar ao banco de dados: {e}')

if __name__ == '__main__':
    debug_company()