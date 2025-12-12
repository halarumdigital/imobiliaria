#!/usr/bin/env python3
"""Script para verificar mensagens e histórico no banco de dados"""

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

    print("🔍 ========== VERIFICANDO HISTÓRICO DE MENSAGENS ==========\n")

    # 1. Buscar todas as conversas
    print("📋 1. Conversas no banco:")
    cursor.execute("""
        SELECT id, whatsapp_instance_id, contact_phone, contact_name, last_message, created_at
        FROM conversations
        ORDER BY created_at DESC
        LIMIT 5
    """)

    conversations = cursor.fetchall()
    for conv in conversations:
        print(f"\n  📱 Conversa ID: {conv['id']}")
        print(f"     Telefone: {conv['contact_phone']}")
        print(f"     Nome: {conv['contact_name']}")
        print(f"     Última msg: {conv['last_message'][:50] if conv['last_message'] else 'N/A'}...")
        print(f"     Criada em: {conv['created_at']}")

        # Buscar mensagens desta conversa
        cursor.execute("""
            SELECT id, sender, content, message_type, created_at
            FROM messages
            WHERE conversation_id = %s
            ORDER BY created_at ASC
        """, (conv['id'],))

        messages = cursor.fetchall()
        print(f"\n     📝 Mensagens ({len(messages)} total):")

        for msg in messages[-10:]:  # Últimas 10 mensagens
            content_preview = msg['content'][:60] + '...' if len(msg['content']) > 60 else msg['content']
            sender_emoji = '👤' if msg['sender'] == 'user' else '🤖'
            print(f"       {sender_emoji} [{msg['sender']}]: {content_preview}")

    # 2. Verificar se há mensagens duplicadas ou problemas
    print("\n\n📊 2. Estatísticas de mensagens:")
    cursor.execute("""
        SELECT
            sender,
            COUNT(*) as total
        FROM messages
        GROUP BY sender
    """)

    stats = cursor.fetchall()
    for stat in stats:
        print(f"   {stat['sender']}: {stat['total']} mensagens")

    # 3. Verificar últimas 10 mensagens globais
    print("\n\n📜 3. Últimas 10 mensagens (todas as conversas):")
    cursor.execute("""
        SELECT
            m.id,
            m.sender,
            m.content,
            m.created_at,
            c.contact_phone
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 10
    """)

    recent_msgs = cursor.fetchall()
    for msg in recent_msgs:
        content_preview = msg['content'][:50] + '...' if len(msg['content']) > 50 else msg['content']
        sender_emoji = '👤' if msg['sender'] == 'user' else '🤖'
        print(f"  {sender_emoji} {msg['contact_phone']}: {content_preview} ({msg['created_at']})")

    cursor.close()
    connection.close()

    print("\n\n✅ Verificação concluída!")

except Exception as e:
    print(f"❌ Erro: {e}")
