interface ChatContextProps {
  content: string
}

export function ChatContext({ content }: ChatContextProps) {
  const parts = parseChatContent(content)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-xs text-gray-400 mb-3">上下文</div>
      <div className="space-y-2">
        {parts.map((part, i) => (
          <div key={i} className="text-sm">
            {part.type === 'product' && (
              <div className="bg-gray-50 rounded-md p-3 text-gray-700">
                <span className="text-xs text-gray-400 block mb-1">商品描述</span>
                {part.content}
              </div>
            )}
            {part.type === 'chat' && (
              <div className="bg-blue-50 rounded-md p-3 text-gray-700">
                <span className="text-xs text-blue-400 block mb-1">聊天内容</span>
                {part.content}
              </div>
            )}
            {part.type === 'raw' && (
              <div className="text-gray-600 whitespace-pre-wrap">{part.content}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface ChatPart {
  type: 'product' | 'chat' | 'raw'
  content: string
}

function parseChatContent(content: string): ChatPart[] {
  const parts: ChatPart[] = []

  const productMatch = content.match(/商品描述信息为：\[([^\]]*)\]/)
  if (productMatch) {
    parts.push({ type: 'product', content: productMatch[1] })
  }

  const chatMatch = content.match(/聊天内容为：\[([^\]]*)\]/)
  if (chatMatch) {
    parts.push({ type: 'chat', content: chatMatch[1] })
  }

  if (parts.length === 0) {
    parts.push({ type: 'raw', content })
  }

  return parts
}
