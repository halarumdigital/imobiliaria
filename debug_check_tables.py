#!/usr/bin/env python3
"""Verificar estrutura das tabelas"""

import mysql.connector

try:
    connection = mysql.connector.connect(
        host='31.97.91.252',
        user='alugamai_dev',
        password='MbRWU14S5D9b',
        database='alugamai_dev',
        port=3306
    )

    cursor = connection.cursor(dictionary=True)

    print("🔍 ========== VERIFICANDO ESTRUTURA DO BANCO ==========\n")

    # Verificar tabela messages
    print("📋 1. Estrutura da tabela 'messages':")
    cursor.execute("DESCRIBE messages")
    cols = cursor.fetchall()
    for col in cols:
        print(f"   - {col['Field']}: {col['Type']} {'(NULL)' if col['Null'] == 'YES' else '(NOT NULL)'}")

    # Verificar se há registros
    print("\n📊 2. Total de registros:")
    cursor.execute("SELECT COUNT(*) as total FROM messages")
    total = cursor.fetchone()
    print(f"   messages: {total['total']} registros")

    cursor.execute("SELECT COUNT(*) as total FROM conversations")
    total = cursor.fetchone()
    print(f"   conversations: {total['total']} registros")

    # Verificar todas as mensagens (sem filtro)
    print("\n📜 3. TODAS as mensagens na tabela (sem JOIN):")
    cursor.execute("SELECT * FROM messages ORDER BY created_at DESC LIMIT 10")
    msgs = cursor.fetchall()
    if not msgs:
        print("   ⚠️ NENHUMA MENSAGEM NA TABELA!")
    else:
        for msg in msgs:
            print(f"   ID: {msg['id']}")
            print(f"   conversation_id: {msg['conversation_id']}")
            print(f"   sender: {msg['sender']}")
            print(f"   content: {str(msg['content'])[:50]}...")
            print("")

    cursor.close()
    connection.close()

    print("\n✅ Verificação concluída!")

except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()
