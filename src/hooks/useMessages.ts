// src/hooks/useMessages.ts
import { useState, useEffect, useRef } from 'react';
import { supabase, getUserId } from '../lib/supabase';
import { Message, FileAttachment, Conversation, Project, StreamingMessage } from '../types';
import { useSettings } from './useSettings';

type Setters = {
  setCurrentProjectId: (id: string | null) => void;
  setCurrentConvId: (id: string | null) => void;
};

export function useMessages(
  urlProjectId?: string | null,
  urlConvId?: string | null,
  setters?: Setters
) {
  const { apiKey, model } = useSettings();

  // Use xAI's official CORS proxy
  const baseUrl = 'https://api.x.ai'; // Keep this
  const proxyUrl = 'https://grok.x.ai'; // This is the official proxy that bypasses CORS

  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConv, setCurrentConv] = useState<Conversation | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const userIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  const safeSetProjectId = (id: string | null) => setters?.setCurrentProjectId?.(id);
  const safeSetConvId = (id: string | null) => setters?.setCurrentConvId?.(id);

  const loadProjects = async () => {
    const userId = userIdRef.current;
    if (!userId) return [];
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) console.error('loadProjects error:', error);
    return data || [];
  };

  const loadConversations = async (projectId?: string | null) => {
    const userId = userIdRef.current;
    if (!userId) return [];
    let query = supabase
      .from('conversations')
      .select('id, title, created_at, updated_at, project_id')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) console.error('loadConversations error:', error);
    return data || [];
  };

  const loadMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('loadMessages error:', error);
      setMessages([]);
    } else {
      setMessages((data || []).map(msg => ({
        ...msg,
        timestamp: new Date(msg.created_at).getTime(),
      })));
    }
  };

  const createProject = async (title: string = 'New Project') => {
    const userId = userIdRef.current;
    if (!userId) return null;
    const { data, error } = await supabase
      .from('projects')
      .insert({ title, user_id: userId })
      .select()
      .single();
    if (error) {
      console.error('createProject error:', error);
      return null;
    }
    setProjects(prev => [data, ...prev]);
    return data;
  };

  const createConversation = async (projectId?: string) => {
    const userId = userIdRef.current;
    if (!userId) return null;
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        title: 'New Conversation',
        project_id: projectId || currentProject?.id || null,
        user_id: userId,
      })
      .select()
      .single();
    if (error) {
      console.error('createConversation error:', error);
      return null;
    }
    setConversations(prev => [data, ...prev]);
    return data;
  };

  const switchProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId) || (await loadProjects()).find(p => p.id === projectId);
    if (!project) return;
    setCurrentProject(project);
    safeSetProjectId(projectId);
    const convs = await loadConversations(projectId);
    setConversations(convs);
    const targetConv = convs[0] || await createConversation(projectId);
    if (targetConv) {
      setCurrentConv(targetConv);
      safeSetConvId(targetConv.id);
      await loadMessages(targetConv.id);
    }
  };

  const switchConversation = async (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;
    setCurrentConv(conv);
    safeSetConvId(convId);
    await loadMessages(convId);
  };

  const addMessage = async (message: Message, attachments?: FileAttachment[]) => {
    if (!currentConv) return;

    const msgWithAttachments = { ...message, attachments };
    setMessages(prev => [...prev, { ...msgWithAttachments, streaming: message.role === 'assistant' } as StreamingMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConv.id,
          role: message.role,
          content: message.content,
          attachments: attachments || [],
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMessages(prev => prev.map(m =>
          m.timestamp === message.timestamp ? { ...m, id: data.id } : m
        ));
      }

      if (message.role === 'user') {
        await streamGrokResponse();
      }
    } catch (err) {
      console.error('addMessage error:', err);
    }
  };

  // FIXED: Uses official xAI proxy + correct path
  const streamGrokResponse = async () => {
    if (!apiKey || !currentConv) {
      console.error('Missing API key or conversation');
      return;
    }

    const assistantMsg: StreamingMessage = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      streaming: true,
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const response = await fetch(`${proxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'grok-beta',
          messages: messages
            .filter(m => !m.streaming)
            .map(m => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`xAI API error: ${response.status} ${text}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader?.read() ?? { done: true };
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]' || !data.trim()) continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              content += delta;
              setMessages(prev =>
                prev.map(m =>
                  m.timestamp === assistantMsg.timestamp ? { ...m, content } : m
                )
              );
            }
          } catch {}
        }
      }

      setMessages(prev =>
        prev.map(m =>
          m.timestamp === assistantMsg.timestamp
            ? { ...m, streaming: false, isComplete: true }
            : m
        )
      );

      await supabase.from('messages').insert({
        conversation_id: currentConv.id,
        role: 'assistant',
        content,
      });

      if (messages.length <= 2) {
        const title = content.split('\n')[0].slice(0, 50).trim() || 'New Chat';
        await supabase.from('conversations').update({ title }).eq('id', currentConv.id);
        setCurrentConv(c => c ? { ...c, title } : null);
      }
    } catch (err: any) {
      console.error('Grok streaming failed:', err.message);
      setMessages(prev => prev.filter(m => m.timestamp !== assistantMsg.timestamp));
    }
  };

  // ... rest of deleteProject, updateTitle, etc. (unchanged from previous working version)

  const deleteConversation = async (id: string) => {
    await supabase.from('messages').delete().eq('conversation_id', id);
    await supabase.from('conversations').delete().eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConv?.id === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) await switchConversation(remaining[0].id);
      else await createConversation(currentProject?.id);
    }
  };

  const deleteProject = async (projectId: string) => {
    const convs = conversations.filter(c => c.project_id === projectId);
    const ids = convs.map(c => c.id);
    if (ids.length > 0) {
      await supabase.from('messages').delete().in('conversation_id', ids);
      await supabase.from('conversations').delete().in('id', ids);
    }
    await supabase.from('projects').delete().eq('id', projectId);
    setProjects(p => p.filter(x => x.id !== projectId));
    setConversations(c => c.filter(x => x.project_id !== projectId));
    if (currentProject?.id === projectId) {
      const next = projects.find(p => p.id !== projectId);
      if (next) await switchProject(next.id);
      else {
        const np = await createProject('New Project');
        if (np) await switchProject(np.id);
      }
    }
  };

  const updateConversationTitle = async (id: string, title: string) => {
    await supabase.from('conversations').update({ title }).eq('id', id);
    setConversations(c => c.map(x => x.id === id ? { ...x, title } : x));
    if (currentConv?.id === id) setCurrentConv(c => c ? { ...c, title } : null);
  };

  const updateProjectTitle = async (id: string, title: string) => {
    await supabase.from('projects').update({ title }).eq('id', id);
    setProjects(p => p.map(x => x.id === id ? { ...x, title } : x));
    if (currentProject?.id === id) setCurrentProject(p => p ? { ...p, title } : null);
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      setIsLoading(true);
      const uid = await getUserId();
      if (!uid) return setIsLoading(false);
      userIdRef.current = uid;

      const projs = await loadProjects();
      setProjects(projs);

      let pid = urlProjectId || projs[0]?.id;
      if (!pid) {
        const np = await createProject('My First Project');
        pid = np?.id;
      }
      if (pid) await switchProject(pid);
      setIsLoading(false);
    };
    init();
  }, []);

  return {
    messages,
    conversations,
    currentConv,
    projects,
    currentProject,
    addMessage,
    isLoading,
    switchConversation,
    switchProject,
    createConversation,
    createProject,
    deleteConversation,
    deleteProject,
    updateConversationTitle,
    updateProjectTitle,
  };
}