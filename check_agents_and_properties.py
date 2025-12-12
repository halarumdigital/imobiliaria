import mysql.connector
from mysql.connector import Error

def check_agents_and_properties():
    try:
        connection = mysql.connector.connect(
            host='31.97.91.252',
            database='alugamai_dev',
            user='alugamai_dev',
            password='MbRWU14S5D9b'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Verificar todos os agentes
            cursor.execute('''
                SELECT id, name, company_id, agent_type 
                FROM ai_agents 
                ORDER BY created_at DESC
            ''')
            
            agents = cursor.fetchall()
            
            print(f'🔍 Todos os agentes encontrados:')
            for agent in agents:
                print(f'  ID: {agent[0]}, Nome: {agent[1]}, Company ID: {agent[2]}, Tipo: {agent[3]}')
            
            # Verificar apartamentos para cada empresa
            cursor.execute('''
                SELECT company_id, COUNT(*) as total
                FROM properties 
                WHERE status = 'active' AND property_type = 'apartamento'
                GROUP BY company_id
            ''')
            
            companies = cursor.fetchall()
            
            print(f'\n🏢 Apartamentos por empresa:')
            for company in companies:
                print(f'  Company ID: {company[0]}, Apartamentos: {company[1]}')
            
            # Verificar todos os imóveis por empresa
            cursor.execute('''
                SELECT company_id, COUNT(*) as total
                FROM properties 
                WHERE status = 'active'
                GROUP BY company_id
            ''')
            
            all_properties = cursor.fetchall()
            
            print(f'\n🏢 Todos os imóveis por empresa:')
            for company in all_properties:
                print(f'  Company ID: {company[0]}, Total: {company[1]}')
                
    except Error as e:
        print(f'❌ Erro: {e}')
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print('✅ Conexão encerrada')

if __name__ == "__main__":
    check_agents_and_properties()