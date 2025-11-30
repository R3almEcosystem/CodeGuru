// src/hooks/useMessages.ts
import { useState, useEffect, useRef } from 'react'
import { supabase, getUserId } from '../lib/supabase'
import { Message, FileAttachment, Conversation, Project } from '../types'

type Setters = {
  setCurrentProjectId: (id: string | null) => void
  setCurrentConvId: (id: string | null) => void
}

export function useMessages(
  currentConvId?: string,
  currentProjectId?: string,
  setters?: Setters
) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConv, setCurrentConv] = useState<Conversation | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const userIdRef = useRef<string | null>(null)
  const initializedRef = useRef(false)

  const safeSetProjectId = (id: string | null) => setters?.setCurrentProjectId?.(id)
  const safeSetConvId = (id: string | null) => setters?.setCurrentConvId?.(id)

  const loadProjects = async () => {
    const userId = userIdRef.current
    if (!userId) return
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('loadProjects error:', error)
      setProjects([])
    } else {
      setProjects(data || [])
    }
  }

  const loadConversations = async (projectId?: string | null) => {
    const userId = userIdRef.current
    if (!userId) return

    let query = supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (projectId) query = query.eq('project_id', projectId)

    const { data, error } = await query
    if (error) {
      console.error('loadConversations error:', error)
      setConversations([])
    } else {
      setConversations(data || [])
    }
  }

  const switchProject = async (projectId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, created_at, updated_at')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('switchProject error:', error)
      return
    }

    setCurrentProject(data)
    safeSetProjectId(projectId)
    await loadConversations(projectId)
    setCurrentConv(null)
    safeSetConvId(null)
  }

  const switchConversation = async (convId: string) => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('id', convId)
      .single()

    if (error) {
      console.error('switchConversation error:', error)
      return
    }

    setCurrentConv(data)
    safeSetConvId(convId)
    await loadMessages(convId)
    setIsLoading(false)
  }

  const loadMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('loadMessages error:', error)
      setMessages([])
    } else {
      const parsed: Message[] = (data || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp).getTime(),
        attachments: JSON.parse(m.attachments || '[]') as FileAttachment[],
      }))
      setMessages(parsed)
    }
  }

  // FIXED: No more reverseProject typo + no duplicate "Default Project"
  const createProject = async (title = 'New Project') => {
    const userId = userIdRef.current
    if (!userId) return

    // Check if project already exists
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('title', title)
      .maybeSingle()

    if (existing) {
      await switchProject(existing.id)
      return
    }

    const { data: newProj, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, title })
      .select()
      .single()

    if (error) {
      console.error('createProject error:', error)
      return
    }

    setProjects(p => [newProj, ...p])
    await switchProject(newProj.id)  // ← Fixed: was reverseProject
  }

  const createConversation = async (title = 'New Conversation') => {
    const userId = userIdRef.current
    if (!userId) return

    const projectId = currentProject?.id || null

    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title, project_id: projectId })
      .select()
      .single()

    if (error) {
      console.error('createConversation error:', error)
      return
    }

    setConversations(c => [newConv, ...c])
    await switchConversation(newConv.id)
  }

  const deleteConversation = async (convId: string) => {
    await supabase.from('conversations').delete().eq('id', convId)
    setConversations(c => c.filter(x => x.id !== convId))
    if (currentConv?.id === convId) {
      const next = conversations[0]
      next ? await switchConversation(next.id) : await createConversation()
    }
  }

  const updateConversationTitle = async (convId: string, newTitle: string) => {
    await supabase.from('conversations').update({ title: newTitle }).eq('id', convId)
    setConversations(c => c.map(x => (x.id === convId ? { ...x, title: newTitle } : x)))
    if (currentConv?.id === convId) setCurrentConv({ ...currentConv, title: newTitle })
  }

  const addMessage = async (msg: Omit<Message, 'id'>) => {
    if (!currentConv) throw new Error('No active conversation')

    const dbMsg = {
      conversation_id: currentConv.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      attachments: JSON.stringify(msg.attachments || []),
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(dbMsg)
      .select()
      .single()

    if (error) throw error

    const fullMsg: Message = { ...msg, id: data.id }
    setMessages(m => [...m, fullMsg])

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentConv.id)

    await loadConversations(currentProject?.id || null)
  }

  useEffect(() => {
    if (initializedRef.current) return

    const init = async () => {
      setIsLoading(true)
      const uid = await getUserId()
      if (!uid) {
        setIsLoading(false)
        return
      }
      userIdRef.current = uid

      await loadProjects()

      if (currentProjectId) {
        await switchProject(currentProjectId)
      } else if (projects.length > 0) {
        await switchProject(projects[0].id)
      } else {
        await createProject('Default Project')  // ← Only creates if not exists
      }

      if (currentConvId) {
        await switchConversation(currentConvId)
      } else if (conversations.length > 0) {
        await switchConversation(conversations[0].id)
      } else {
        await createConversation()
      }

      setIsLoading(false)
      initializedRef.current = true
    }

    init()
  }, [])

  useEffect(() => {
    if (!initializedRef.current || !currentProjectId) return
    switchProject(currentProjectId)
  }, [currentProjectId])

  useEffect(() => {
    if (!initializedRef.current || !currentConvId) return
    switchConversation(currentConvId)
  }, [currentConvId])

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
    updateConversationTitle,
    setProjects,
    setCurrentProject,
  }
}