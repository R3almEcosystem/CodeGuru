// src/hooks/useMessages.ts (only the broken part fixed — rest unchanged)
const loadMessages = async (convId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true }); // ← FIXED: was 'timestamp'

  if (error) {
    console.error('loadMessages error:', error);
    setMessages([]);
    return;
  }

  const parsed: Message[] = (data || []).map((m: any) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    // Use created_at from Supabase (auto-timestamped)
    timestamp: new Date(m.created_at).getTime(),
    attachments: m.attachments ? JSON.parse(m.attachments) : [],
  }));

  setMessages(parsed);
};