import React, { useState, useRef, useEffect, useCallback } from 'react'
import mermaid from 'mermaid'

// Removed top-level ref; will be defined inside component
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, buildApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Paperclip, Send, X, Copy, Check, Sparkles, Pencil, ChevronUp, ChevronDown } from 'lucide-react'
import type { Conversation } from '../types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

interface FallbackEntry {
  modelDbId: string
  priority: number
  enabled: boolean
  platform: string
  modelId: string
  displayName: string
  sizeLabel: string
  keyCount: number
}

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  data?: string // base64 pour les images
  text?: string // texte pour les fichiers texte
  url?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string | any[]
  files?: UploadedFile[]
  meta?: {
    platform?: string
    model?: string
    latency?: number
    fallbackAttempts?: number
  }
}

// Corrige les titres Markdown sans espace (ex: ##Titre → ## Titre)
function preprocessMarkdown(content: string): string {
  return content
    .replace(/^(#{1,6})([^\s#])/gm, '$1 $2')
    .replace(/\*\*\s*([^*]+)\s*\*\*/g, '**$1**')
}

const CodeBlock = React.memo(({ className, children }: { className?: string; children: React.ReactNode }) => {
  const [copied, setCopied] = useState(false);
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  const [showDiagram, setShowDiagram] = useState(true);
  const codeString = String(children).replace(/\n$/, '');
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mermaid handling
  const mermaidRef = useRef<HTMLDivElement>(null);
  
  // Initialize mermaid once with dark theme support
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    mermaid.initialize({
      startOnLoad: false,
      suppressErrorRendering: true,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose'
    });
  }, []);

  // Render mermaid diagram when codeString or showDiagram changes
  useEffect(() => {
    let isMounted = true;
    setMermaidError(null);
    
    if (lang === 'mermaid' && mermaidRef.current && showDiagram) {
      const diagram = codeString.trim();
      console.log('Rendering Mermaid diagram:', diagram);
      
      mermaid.render('mermaid-' + Math.random().toString(36).substr(2, 9), diagram)
        .then((result: { svg: string }) => {
          console.log('Mermaid SVG generated:', result.svg.length);
          if (isMounted && mermaidRef.current) {
            mermaidRef.current.innerHTML = result.svg;
          }
        })
        .catch((err: any) => {
          console.error('Mermaid rendering error:', err);
          if (isMounted) {
            setMermaidError(err?.message || 'Erreur de syntaxe Mermaid');
          }
        });
    }
    
    return () => { isMounted = false; };
  }, [codeString, lang, showDiagram]);

  if (lang === 'mermaid') {
    return (
      <div className="relative group my-3 rounded-lg overflow-hidden border border-border/40 shadow-sm">
        <div className="flex items-center justify-between px-4 py-1.5 bg-[#161b22] border-b border-border/20 text-xs text-muted-foreground font-mono">
          <span className="uppercase tracking-wider font-semibold text-[10px] text-primary">mermaid</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDiagram(!showDiagram)}
              className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer text-[10px] px-2 py-0.5 rounded bg-accent/50 hover:bg-accent"
            >
              {showDiagram ? 'Code' : 'Diagramme'}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              <span>{copied ? 'Copié' : 'Copier'}</span>
            </button>
          </div>
        </div>
        {showDiagram ? (
          mermaidError ? (
            <div className="p-4 text-destructive bg-destructive/10 text-sm">
              <p className="font-semibold mb-2">Erreur de syntaxe Mermaid</p>
              <pre className="text-xs whitespace-pre-wrap mb-2">{mermaidError}</pre>
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer">Voir le code</summary>
                <pre className="mt-2 p-3 bg-[#0d1117] rounded text-xs whitespace-pre-wrap text-muted-foreground">{codeString}</pre>
              </details>
            </div>
          ) : (
            <div ref={mermaidRef} className="mermaid p-4 flex justify-center" />
          )
        ) : (
          <pre className="overflow-x-auto p-4 bg-[#0d1117] text-sm leading-relaxed font-mono">
            <code className="hljs">{codeString}</code>
          </pre>
        )}
      </div>
    );
  }

  let highlightedHtml = codeString;
  if (lang && hljs.getLanguage(lang)) {
    try {
      highlightedHtml = hljs.highlight(codeString, { language: lang }).value;
    } catch (e) {
      try {
        highlightedHtml = hljs.highlightAuto(codeString).value;
      } catch (err) { }
    }
  } else {
    try {
      highlightedHtml = hljs.highlightAuto(codeString).value;
    } catch (err) { }
  }

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-border/40 shadow-sm">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#161b22] border-b border-border/20 text-xs text-muted-foreground font-mono">
        <span className="uppercase tracking-wider font-semibold text-[10px] text-primary">{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          <span>{copied ? 'Copié' : 'Copier'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-4 bg-[#0d1117] text-sm leading-relaxed font-mono">
        <code className="hljs" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </pre>
    </div>
  );
});

const MessageContent = React.memo(({ msg }: { msg: ChatMessage }) => {
  const renderPart = (part: any, idx: number) => {
    if (part.type === 'text') {
      return (
        <div key={idx}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              pre: ({ children }) => <div className="markdown-pre-wrapper">{children}</div>,
              code(props) {
                const { children, className } = props
                const match = /language-(\w+)/.exec(className || '')
                const isInline = !match && !String(children).includes('\n')
                if (isInline) {
                  return (
                    <code className="bg-muted/50 px-1.5 py-0.5 rounded text-xs text-primary font-mono border border-border/20">
                      {children}
                    </code>
                  )
                }
                return <CodeBlock className={className}>{children}</CodeBlock>
              }
            }}
          >
            {part.text}
          </ReactMarkdown>
        </div>
      )
    }
    if (part.type === 'image_url') {
      return (
        <div key={idx} className="mt-2 max-w-sm overflow-hidden rounded-lg border shadow-sm">
          <img src={part.image_url.url} alt="Image jointe" className="max-h-64 w-auto object-contain" />
        </div>
      )
    }
    return null
  }

  if (Array.isArray(msg.content)) {
    return (
      <div className="space-y-2">
        {msg.content.map((part, idx) => renderPart(part, idx))}
      </div>
    )
  }

  const rawContent = typeof msg.content === 'string' ? msg.content : ''
  const processedContent = preprocessMarkdown(rawContent)

  return (
    <div className="space-y-2">
      {msg.files && msg.files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {msg.files.map(file => (
            file.type.startsWith('image/') && 'data' in file && file.data ? (
              <img
                key={file.id}
                src={file.data}
                alt={file.name}
                className="max-w-xs rounded-lg shadow-sm border"
              />
            ) : (
              <div key={file.id} className="text-xs opacity-70 flex items-center gap-1 bg-muted px-2 py-1 rounded">
                📎 {file.name}
              </div>
            )
          ))}
        </div>
      )}
      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            pre: ({ children }) => <div className="markdown-pre-wrapper">{children}</div>,
            code(props) {
              const { children, className } = props
              const match = /language-(\w+)/.exec(className || '')
              const isInline = !match && !String(children).includes('\n')
              if (isInline) {
                return (
                  <code className="bg-muted/50 px-1.5 py-0.5 rounded text-xs text-primary font-mono border border-border/20">
                    {children}
                  </code>
                )
              }
              return <CodeBlock className={className}>{children}</CodeBlock>
            }
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  )
});

const UserMessageBubble = React.memo(({
  msg,
  onEdit,
}: {
  msg: ChatMessage
  onEdit: (text: string) => void
}) => {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const editRef = useRef<HTMLTextAreaElement>(null)

  const textContent = typeof msg.content === 'string'
    ? msg.content
    : Array.isArray(msg.content)
      ? (msg.content.find((p: any) => p.type === 'text')?.text ?? '')
      : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startEdit = () => {
    setEditText(textContent)
    setEditing(true)
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.focus()
        editRef.current.style.height = 'auto'
        editRef.current.style.height = editRef.current.scrollHeight + 'px'
      }
    }, 0)
  }

  const submitEdit = () => {
    if (editText.trim()) {
      onEdit(editText.trim())
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="w-full flex flex-col items-end gap-2">
        <textarea
          ref={editRef}
          value={editText}
          onChange={e => {
            setEditText(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px'
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit() }
            if (e.key === 'Escape') setEditing(false)
          }}
          className="w-full max-w-[85%] sm:max-w-[75%] rounded-[1.25rem] px-5 py-3.5 text-[15px] leading-relaxed bg-primary text-primary-foreground font-medium resize-none border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
          style={{ minHeight: '48px', overflow: 'hidden' }}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-xs h-7 px-3">Annuler</Button>
          <Button size="sm" onClick={submitEdit} className="text-xs h-7 px-3">Envoyer</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative flex flex-col items-end gap-1">
      <div className="max-w-[85%] sm:max-w-[75%] rounded-[1.25rem] rounded-tr-sm px-5 py-3.5 text-[15px] leading-relaxed bg-primary text-primary-foreground font-medium">
        <MessageContent msg={msg} />
      </div>
      {/* Action buttons shown on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pr-1">
        <button
          onClick={handleCopy}
          title="Copier"
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-accent/60"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          <span>{copied ? 'Copié' : 'Copier'}</span>
        </button>
        <button
          onClick={startEdit}
          title="Modifier"
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-accent/60"
        >
          <Pencil className="size-3.5" />
          <span>Modifier</span>
        </button>
      </div>
    </div>
  )
});

const MIN_TEXTAREA_HEIGHT = 44
const MAX_TEXTAREA_HEIGHT = 200

export default function PlaygroundPage() {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null); // New ref for scroll container


  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>('auto')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => apiFetch('/api/conversations').then(data => Array.isArray(data) ? data : []),
  })

  const resizeTextarea = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)
    el.style.height = newHeight + 'px'
    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden'
  }, [])

  const resetTextarea = useCallback(() => {
    if (!inputRef.current) return
    inputRef.current.style.height = MIN_TEXTAREA_HEIGHT + 'px'
    inputRef.current.style.overflowY = 'hidden'
  }, [])

  const { data: keyData } = useQuery<{ apiKey: string }>({
    queryKey: ['unified-key'],
    queryFn: () => apiFetch('/api/settings/api-key'),
  })

  const { data: fallbackEntries = [] } = useQuery<FallbackEntry[]>({
    queryKey: ['fallback'],
    queryFn: () => apiFetch('/api/fallback').then(data => Array.isArray(data) ? data : []),
  })

  const loadMessages = async (convId: string) => {
    try {
      const msgs = await apiFetch<ChatMessage[]>(`/api/conversations/${convId}/messages`)
      setMessages(Array.isArray(msgs) ? msgs : [])
    } catch (e) {
      console.error(e)
      setMessages([])
    }
    setUploadedFiles([])
  }

  useEffect(() => {
    setMessages([])
    if (!id || id === 'new') {
      setUploadedFiles([])
      setInput('')
    } else {
      loadMessages(id)
    }
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const availableModels = fallbackEntries.filter(e => e.keyCount > 0 && e.enabled)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const fileId = Date.now().toString() + Math.random().toString(36).substring(2, 9)
      const textTypes = ['text/plain', 'text/javascript', 'application/javascript', 'text/html', 'text/css', 'application/json', 'text/markdown', 'text/x-python', 'application/x-python', 'text/x-typescript', 'application/x-typescript']
      const isTextFile = textTypes.includes(file.type) || /\.(txt|js|ts|jsx|tsx|py|html|css|json|md|csv|xml|yaml|yml)$/i.test(file.name)

      if (isTextFile) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setUploadedFiles(prev => [...prev, {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            text: event.target?.result as string
          }])
        }
        reader.readAsText(file)
      } else {
        const reader = new FileReader()
        reader.onload = (event) => {
          setUploadedFiles(prev => [...prev, {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            data: event.target?.result as string
          }])
        }
        reader.readAsDataURL(file)
      }
    })
    e.target.value = ''
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  // Core send function — can be called with overrides for the edit-message flow
  const sendMessage = async (overrideText?: string, overrideHistory?: ChatMessage[]) => {
    const text = (overrideText ?? input).trim()
    const currentHistory = overrideHistory ?? messages
    if (!text && uploadedFiles.length === 0) return
    if (loading) return

    let fullText = text
    for (const file of uploadedFiles) {
      if ('text' in file && file.text) {
        fullText += `\n\n--- File: ${file.name} ---\n${file.text}`
      }
    }

    let uiContent: string | any[]
    let apiContent: string | any[]
    let hasImages = false

    if (uploadedFiles.length === 0) {
      uiContent = fullText
      apiContent = fullText
    } else {
      uiContent = fullText
      apiContent = []
      if (fullText) {
        apiContent.push({ type: 'text', text: fullText })
      }
      for (const file of uploadedFiles) {
        if (file.type.startsWith('image/') && 'data' in file && file.data) {
          hasImages = true
          apiContent.push({
            type: 'image_url',
            image_url: { url: file.data }
          })
        }
      }
      if (!hasImages) {
        apiContent = fullText
      }
    }

    const userMsg: ChatMessage = {
      role: 'user',
      content: uploadedFiles.length > 0 ? apiContent : uiContent,
      files: [...uploadedFiles]
    }

    // Add instantly to UI to feel fast
    const currentMessages = [...currentHistory, userMsg]
    setMessages(currentMessages)
    setInput('')
    setUploadedFiles([])
    setLoading(true)
    resetTextarea()
    inputRef.current?.focus()

    try {
      let currentConvId = id === 'new' ? null : id

      if (!currentConvId) {
        // Create new conversation
        let title = `Conversation ${new Date().toLocaleString()}`
        if (typeof apiContent === 'string') {
          title = apiContent.slice(0, 50) + (apiContent.length > 50 ? '…' : '')
        } else if (Array.isArray(apiContent)) {
          const textPart = apiContent.find(p => p.type === 'text')
          if (textPart) {
            title = textPart.text.slice(0, 50) + (textPart.text.length > 50 ? '…' : '')
          }
        }

        const newConv = await apiFetch<Conversation>('/api/conversations', {
          method: 'POST',
          body: JSON.stringify({ title })
        })
        currentConvId = newConv.id as unknown as string
        navigate(`/c/${currentConvId}`, { replace: true })
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
      }
      
      // Check if conversation has a generic title and update it
      const currentConv = conversations.find(c => (c.id as unknown as string) === (currentConvId as unknown as string))
      if (currentConv) {
        const isGenericTitle = 
          currentConv.title.startsWith('Conversation') || 
          currentConv.title === 'Nouvelle conversation'
        
        if (isGenericTitle) {
          // Generate new title from user's message
          let newTitle = 'Nouvelle conversation'
          if (typeof apiContent === 'string') {
            newTitle = apiContent.slice(0, 50) + (apiContent.length > 50 ? '…' : '')
          } else if (Array.isArray(apiContent)) {
            const textPart = apiContent.find(p => p.type === 'text')
            if (textPart) {
              newTitle = textPart.text.slice(0, 50) + (textPart.text.length > 50 ? '…' : '')
            }
          }
          
          // Update the conversation title
          await apiFetch(`/api/conversations/${currentConvId}`, {
            method: 'PUT',
            body: JSON.stringify({ title: newTitle })
          })
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      }

      // Save user message to database
      await apiFetch(`/api/conversations/${currentConvId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          role: 'user',
          content: apiContent,
          files: uploadedFiles
        })
      })

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (keyData?.apiKey) headers['Authorization'] = `Bearer ${keyData.apiKey}`

      const apiMessages: any[] = []
      apiMessages.push({
        role: 'system',
        content: 'Tu es un assistant IA. Réponds obligatoirement en français. Formate tes réponses en Markdown valide : toujours un espace après les dièses de titre (ex: ## Titre), utilise **gras** pour les points importants, des listes à puces, des tableaux et des blocs de code avec le langage spécifié quand approprié. Ne mets jamais de ## sans espace après.'
      })

      for (let i = 0; i < currentMessages.length; i++) {
        const m = currentMessages[i]
        if (i === currentMessages.length - 1 && m.role === 'user') {
          apiMessages.push({ role: m.role, content: apiContent })
        } else {
          apiMessages.push({ role: m.role, content: m.content })
        }
      }

      const body: any = { messages: apiMessages }
      if (selectedModel !== 'auto') body.model = selectedModel

      const start = Date.now()
      const res = await fetch(buildApiUrl('/v1/chat/completions'), {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      const latency = Date.now() - start
      const routedVia = res.headers.get('X-Routed-Via')
      const fallbackAttempts = res.headers.get('X-Fallback-Attempts')

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }))
        const errorMsg: ChatMessage = { role: 'assistant', content: `Erreur: ${err.error?.message ?? 'Erreur inconnue'}` }
        setMessages(prev => [...prev, errorMsg])
        await apiFetch(`/api/conversations/${currentConvId}/messages`, {
          method: 'POST', body: JSON.stringify({ role: 'assistant', content: errorMsg.content })
        })
        return
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content ?? JSON.stringify(data, null, 2)
      const via = data._routed_via ?? (routedVia ? { platform: routedVia.split('/')[0], model: routedVia.split('/').slice(1).join('/') } : undefined)

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content,
        meta: {
          platform: via?.platform,
          model: via?.model,
          latency,
          fallbackAttempts: fallbackAttempts ? parseInt(fallbackAttempts) : undefined,
        },
      }
      setMessages(prev => [...prev, assistantMsg])

      // Save assistant message
      await apiFetch(`/api/conversations/${currentConvId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          role: 'assistant',
          content: assistantMsg.content,
          meta: assistantMsg.meta
        })
      })

    } catch (err: any) {
      const errorMsg: ChatMessage = { role: 'assistant', content: `Erreur: ${err.message}` }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  const handleSend = () => sendMessage()


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          const fileId = Date.now().toString() + Math.random().toString(36).substring(2, 9)
          const reader = new FileReader()
          reader.onload = (event) => {
            setUploadedFiles(prev => [...prev, {
              id: fileId,
              name: file.name || `image-${Date.now()}.png`,
              type: file.type,
              size: file.size,
              data: event.target?.result as string
            }])
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('paste', handlePaste)
    return () => {
      window.removeEventListener('paste', handlePaste)
    }
  }, [handlePaste])

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-background relative overflow-hidden">
      {/* Header — Model Selector */}
      <div className="flex items-center pl-14 pr-4 md:pr-6 py-2.5 bg-background/80 backdrop-blur-md border-b border-border/30 z-10 sticky top-0">
        <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v ?? 'auto')}>
          <SelectTrigger className="w-[200px] md:w-[260px] bg-transparent border-0 shadow-none hover:bg-accent/40 transition-colors font-semibold text-sm rounded-xl h-9 px-3 gap-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover/95 backdrop-blur rounded-xl border-border/60 shadow-xl">
            <SelectItem value="auto">Automatique (secours)</SelectItem>
            {availableModels.map(m => (
              <SelectItem key={m.modelDbId} value={m.modelId}>
                <span className="flex items-center justify-between w-full gap-4">
                  <span className="font-semibold text-sm">{m.displayName}</span>
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted uppercase tracking-wider">{m.platform}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-thin scroll-smooth pb-[160px]">
        <div ref={messagesStartRef} className="sr-only" />
        {messages.length === 0 ? (
          <div key="empty-state" className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl scale-150" />
              <Sparkles className="size-10 text-primary/30 relative" />
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight">Comment puis-je vous aider ?</h2>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              Commencez une nouvelle conversation.
            </p>
          </div>
        ) : (
          <div key="messages-list" className="max-w-3xl mx-auto w-full pt-6 px-4 md:px-6 flex flex-col gap-6 pb-8">
            {messages.map((msg, i) => (
              <div key={`${id}-${i}`} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                {msg.role === 'user' ? (
                  <UserMessageBubble
                    msg={msg}
                    onEdit={(newText) => {
                      // Trim the conversation up to (not including) this user message, then resend
                      const historyBeforeEdit = messages.slice(0, i)
                      sendMessage(newText, historyBeforeEdit)
                    }}
                  />
                ) : (
                  <div className="w-full text-[15px] leading-relaxed text-foreground">
                    <MessageContent msg={msg} />
                    {msg.meta && (
                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border/30 flex-wrap text-[11px] text-muted-foreground/70 font-medium tabular-nums tracking-wide">
                        {msg.meta.platform && (
                          <span className="px-1.5 py-0.5 rounded bg-muted/60 uppercase font-bold text-[10px]">
                            {msg.meta.platform}
                          </span>
                        )}
                        {msg.meta.model && <span className="font-mono">· {msg.meta.model}</span>}
                        {msg.meta.latency != null && <span>· {msg.meta.latency} ms</span>}
                        {msg.meta.fallbackAttempts != null && msg.meta.fallbackAttempts > 0 && (
                          <span className="text-amber-500 font-bold">
                            · {msg.meta.fallbackAttempts} secours
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-fade-in w-full">
                <div className="flex gap-1.5 items-center h-5 px-1">
                  <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        )}
        {/* Ancre de scroll — en dehors du container de messages pour un scroll fiable */}
        <div ref={messagesEndRef} className="h-px" />
      </div>

      {/* Boutons d'ascenseur */}
      {messages.length > 0 && (
        <div className="fixed bottom-24 right-4 flex flex-col gap-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Aller en haut"
          >
            <ChevronUp className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
            aria-label="Aller en bas"
          >
            <ChevronDown className="size-5" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-5 px-4 md:px-6">
        <div className="max-w-3xl mx-auto relative">
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 animate-fade-in px-1">
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border/60 shadow-sm"
                >
                  {file.type.startsWith('image/') && 'data' in file && file.data ? (
                    <img
                      src={file.data}
                      alt={file.name}
                      className="w-8 h-8 object-cover rounded-lg border border-border/30"
                    />
                  ) : (
                    <Paperclip className="size-4 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium truncate max-w-[120px]">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted w-5 h-5 rounded-full"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="relative flex items-end bg-card/60 backdrop-blur-xl rounded-[24px] border border-border/50 shadow-lg p-2 transition-all focus-within:ring-2 focus-within:ring-primary/15 focus-within:border-primary/30 focus-within:bg-card">
            <input
              type="file"
              className="hidden"
              id="file-upload"
              multiple
              onChange={handleFileUpload}
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-[16px] w-10 h-10 flex-shrink-0 mb-0.5 ml-0.5"
              onClick={() => document.getElementById('file-upload')?.click()}
              title="Ajouter un fichier"
            >
              <Paperclip className="size-5" />
            </Button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                resizeTextarea(e.target)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Envoyer un message..."
              rows={1}
              className="flex-1 resize-none bg-transparent border-0 px-3 py-3 mx-1 text-[15px] focus:outline-none focus:ring-0 leading-relaxed placeholder:text-muted-foreground/50"
              style={{ height: MIN_TEXTAREA_HEIGHT + 'px', overflowY: 'hidden', minHeight: MIN_TEXTAREA_HEIGHT + 'px', maxHeight: MAX_TEXTAREA_HEIGHT + 'px' }}
            />

            <Button
              onClick={handleSend}
              disabled={loading || (!input.trim() && uploadedFiles.length === 0)}
              size="icon"
              className="rounded-[16px] w-10 h-10 flex-shrink-0 mb-0.5 mr-0.5 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
            >
              <Send className="size-4.5 ml-0.5" />
            </Button>
          </div>
          <div className="text-center mt-2.5 text-[11px] text-muted-foreground/50 font-medium">
            L'IA peut faire des erreurs. Vérifiez toujours les informations importantes.
          </div>
        </div>
      </div>
    </div>
  )
}
