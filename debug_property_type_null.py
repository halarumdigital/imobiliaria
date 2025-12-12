import mysql.connector
import os

try:
    # Conectar ao banco de dados
    connection = mysql.connector.connect(
        host='31.97.91.252',
        user='alugamai_dev',
        password='MbRWU14S5D9b',
        database='alugamai_dev',
        port=3306
    )
    
    cursor = connection.cursor(dictionary=True)
    
    print("🔍 Verificando valores de property_type na tabela properties...")
    
    # Verificar todos os valores de property_type
    cursor.execute("""
        SELECT 
            id,
            code,
            name,
            property_type,
            transaction_type,
            company_id
        FROM properties 
        ORDER BY created_at DESC
        LIMIT 10
    """)
    
    results = cursor.fetchall()
    
    print(f"\n📊 Total de imóveis verificados: {len(results)}")
    print("\n📋 Primeiros 10 imóveis (valores brutos de property_type):")
    
    for i, prop in enumerate(results, 1):
        print(f"\n  [{i}] ID: {prop['id']}")
        print(f"      Código: {prop['code']}")
        print(f"      Nome: {prop['name']}")
        print(f"      Property Type (RAW): {repr(prop['property_type'])}")
        print(f"      Transaction Type: {prop['transaction_type']}")
        print(f"      Company ID: {prop['company_id']}")
    
    # Verificar quantos imóveis têm property_type NULL vs não NULL
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN property_type IS NULL THEN 1 END) as null_count,
            COUNT(CASE WHEN property_type IS NOT NULL THEN 1 END) as not_null_count
        FROM properties
    """)
    
    stats = cursor.fetchone()
    print(f"\n📈 Estatísticas de property_type:")
    print(f"      Total de imóveis: {stats['total']}")
    print(f"      Com property_type NULL: {stats['null_count']}")
    print(f"      Com property_type NOT NULL: {stats['not_null_count']}")
    
    # Verificar se há algum imóvel com property_type = 'apartamento'
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM properties 
        WHERE LOWER(property_type) = 'apartamento'
    """)
    
    apartamentos = cursor.fetchone()
    print(f"\n🏢 Imóveis marcados como 'apartamento': {apartamentos['count']}")
    
    # Verificar os valores distintos de property_type
    cursor.execute("""
        SELECT 
            property_type,
            COUNT(*) as count
        FROM properties 
        GROUP BY property_type
        ORDER BY count DESC
    """)
    
    distinct_types = cursor.fetchall()
    print(f"\n🏷️ Valores distintos de property_type:")
    for tipo in distinct_types:
        print(f"      {repr(tipo['property_type'])}: {tipo['count']} imóveis")
    
    cursor.close()
    connection.close()
    
    print("\n✅ Verificação concluída!")
    
except Exception as e:
    print(f"❌ Erro: {e}")