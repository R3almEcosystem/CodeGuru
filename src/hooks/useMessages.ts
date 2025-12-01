// src/hooks/useMessages.ts
import { useState, useEffect, useRef } from 'react'
import { supabase, getUserId } from '../lib/supabase'
import { Message, FileAttachment, Conversation, Project } from '../types'

type Setters = {
  setCurrentProjectId: (id: string | null) => void
  setCurrentConvId: (id: string | null) => void
}

export function useMessages(
  urlProjectId?: string | null,
  urlConvId?: string | null,
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

    if (error) console.error('loadProjects error:', error)
    else setProjects(data || [])
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
    if (error) console.error('loadConversations error:', error)
    else setConversations(data || [])
  }

  const switchProject = async (projectId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error || !data) return console.error('switchProject error:', error)

    setCurrentProject(data)
    safeSetProjectId(projectId)
    setCurrentConv(null)
    safeSetConvId(null)
    await loadConversations(projectId)
  }

  const switchConversation = async (convId: string) => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', convId)
      .single()

    if (error || !data) {
      console.error('switchConversation error:', error)
      setIsLoading(false)
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
        attachments: m.attachments ? JSON.parse(m.attachments) : [],
      }))
      setMessages(parsed)
    }
  }

  const createProject = async (title = 'New Project') => {
    const userId = userIdRef.current
    if (!userId) return

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

    if (error || !newProj) return console.error('createProject error:', error)

    setProjects(p => [newProj, ...p])
    await switchProject(newProj.id)
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

    if (error || !newConv) return console.error('createConversation error:', error)

    setConversations(c => [newConv, ...c])
    await switchConversation(newConv.id)
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

  // ONE-TIME INIT ONLY
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const init = async () => {
      setIsLoading(true)
      const uid = await getUserId()
      if (!uid) return setIsLoading(false)

      userIdRef.current = uid
      await loadProjects()

      let targetProjectId = urlProjectId
      if (!targetProjectId && projects.length > 0) {
        targetProjectId = projects[0].id
      }
      if (!targetProjectId) {
        await createProject('Default Project')
      } else {
        await switchProject(targetProjectId)
      }

      let targetConvId = urlConvId
      if (!targetConvId && conversations.length > 0) {
        targetConvId = conversations[0].id
      }
      if (!targetConvId) {
        await createConversation()
      } else {
        await switchConversation(targetConvId)
      }

      setIsLoading(false)
    }

    init()
  }, []) // Run once

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
    deleteConversation: async (id: string) => {
      await supabase.from('conversations').delete().eq('id', id)
      setConversations(c => c.filter(x => x.id !== id))
      if (currentConv?.id === id) {
        conversations.length > 1
          ? await switchConversation(conversations[0].id)
          : await createConversation()
      }
    },
    updateConversationTitle: async (id: string, title: string) => {
      await supabase.from('conversations').update({ title }).eq('id', id)
      setConversations(c => c.map(x => (x.id === id ? { ...x, title } : x)))
      if (currentConv?.id === id) setCurrentConv({ ...currentConv, title })
    },
  }
}