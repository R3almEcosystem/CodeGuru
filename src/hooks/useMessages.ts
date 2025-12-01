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
  const { apiKey, baseUrl, model } = useSettings();
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
    if (!userId) return;
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('loadProjects error:', error);
      setProjects([]);
    } else {
      setProjects(data || []);
    }
  };

  const loadConversations = async (projectId?: string | null) => {
    const userId = userIdRef.current;
    if (!userId) return;

    let query = supabase
      .from('conversations')
      .select('id, title, created_at, updated_at, project_id')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (projectId) query = query.eq('project_id', projectId);

    const { data, error } = await query;

    if (error) {
      console.error('loadConversations error:', error);
      setConversations([]);
    } else {
      setConversations(data || []);
    }
  };

  const loadMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('loadMessages error:', error);
      setMessages([]);
    } else {
      setMessages(data || []);
    }
  };

  const createProject = async (title: string = 'New Project') => {
    const userId = userIdRef.current;
    if (!userId) return;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        title,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('createProject error:', error);
    } else if (data) {
      setProjects(prev => [data, ...prev]);
      await switchProject(data.id);
      await createConversation(data.id);
    }
  };

  const createConversation = async (projectId?: string) => {
    const userId = userIdRef.current;
    if (!userId) return;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        title: 'New Conversation',
        project_id: projectId || currentProject?.id,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('createConversation error:', error);
    } else if (data) {
      setConversations(prev => [data, ...prev]);
      await switchConversation(data.id);
    }
  };

  const switchProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      safeSetProjectId(projectId);
      await loadConversations(projectId);
      const projectConvs = conversations.filter(c => c.project_id === projectId);
      if (projectConvs.length > 0) {
        await switchConversation(projectConvs[0].id);
      } else {
        await createConversation(projectId);
      }
    }
  };

  const switchConversation = async (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setCurrentConv(conv);
      safeSetConvId(convId);
      await loadMessages(convId);
    }
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
          timestamp: message.timestamp,
          attachments: attachments || [],
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages(prev => prev.map(m => m.timestamp === message.timestamp ? { ...m, id: data.id } : m));
      }

      if (message.role === 'user') {
        await streamGrokResponse();
      }
    } catch (err) {
      console.error('addMessage error:', err);
    }
  };

  const streamGrokResponse = async () => {
    if (!apiKey || !currentConv) return;

    const assistantMsg: StreamingMessage = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      streaming: true,
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.statusText}`);

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
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices[0]?.delta?.content || '';
            content += delta;
            setMessages(prev =>
              prev.map(m =>
                m.timestamp === assistantMsg.timestamp ? { ...m, content } : m
              )
            );
          } catch (err) {}
        }
      }

      setMessages(prev =>
        prev.map(m =>
          m.timestamp === assistantMsg.timestamp ? { ...m, streaming: false, isComplete: true } : m
        )
      );

      await supabase.from('messages').insert({
        conversation_id: currentConv.id,
        role: 'assistant',
        content,
        timestamp: assistantMsg.timestamp,
      });

      if (messages.length === 1) {
        const title = content.slice(0, 50).trim() + (content.length > 50 ? '...' : '');
        await supabase.from('conversations').update({ title }).eq('id', currentConv.id);
        setCurrentConv({ ...currentConv, title });
        setConversations(prev => prev.map(c => c.id === currentConv.id ? { ...c, title } : c));
      }
    } catch (err) {
      console.error('Stream error:', err);
      setMessages(prev => prev.slice(0, -1));
    }
  };

  const deleteConversation = async (id: string) => {
    await supabase.from('messages').delete().eq('conversation_id', id);
    await supabase.from('conversations').delete().eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));

    if (currentConv?.id === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) {
        await switchConversation(remaining[0].id);
      } else {
        await createConversation(currentProject?.id);
      }
    }
  };

  const deleteProject = async (projectId: string) => {
    // Get all conversation IDs in this project
    const convsInProject = conversations.filter(c => c.project_id === projectId);
    const convIds = convsInProject.map(c => c.id);

    // Delete all messages in those conversations
    if (convIds.length > 0) {
      await supabase.from('messages').delete().in('conversation_id', convIds);
      await supabase.from('conversations').delete().in('id', convIds);
    }

    // Delete the project
    await supabase.from('projects').delete().eq('id', projectId);

    // Update state
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setConversations(prev => prev.filter(c => c.project_id !== projectId));

    // If deleted project was current → switch to another or create new
    if (currentProject?.id === projectId) {
      const remainingProjects = projects.filter(p => p.id !== projectId);
      if (remainingProjects.length > 0) {
        await switchProject(remainingProjects[0].id);
      } else {
        await createProject('New Project');
      }
    }
  };

  const updateConversationTitle = async (id: string, title: string) => {
    await supabase.from('conversations').update({ title }).eq('id', id);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    if (currentConv?.id === id) setCurrentConv({ ...currentConv, title });
  };

  const updateProjectTitle = async (id: string, title: string) => {
    await supabase.from('projects').update({ title }).eq('id', id);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, title } : p));
    if (currentProject?.id === id) setCurrentProject({ ...currentProject, title });
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      setIsLoading(true);
      const uid = await getUserId();
      if (!uid) return setIsLoading(false);

      userIdRef.current = uid;
      await loadProjects();
      await loadConversations();

      let targetProjectId = urlProjectId || projects[0]?.id;
      if (!targetProjectId) {
        await createProject('Default Project');
        return;
      }

      await switchProject(targetProjectId);

      let targetConvId = urlConvId || conversations.find(c => c.project_id === targetProjectId)?.id;
      if (!targetConvId) {
        await createConversation(targetProjectId);
      } else {
        await switchConversation(targetConvId);
      }

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