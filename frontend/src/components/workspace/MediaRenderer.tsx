interface MediaRendererProps {
  text: string | null
  textType: string
}

export function MediaRenderer({ text, textType }: MediaRendererProps) {
  if (!text) {
    return <span className="text-gray-400 text-sm">无内容</span>
  }

  if (textType === 'image') {
    return (
      <div className="space-y-2">
        <img
          src={text}
          alt="annotation target"
          className="max-w-full max-h-96 rounded border border-gray-200 object-contain"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
            const parent = (e.target as HTMLImageElement).parentElement
            if (parent) {
              const fallback = document.createElement('div')
              fallback.className = 'text-sm text-gray-500 bg-gray-50 p-3 rounded'
              fallback.textContent = `图片加载失败: ${text}`
              parent.appendChild(fallback)
            }
          }}
        />
        <div className="text-xs text-gray-400 break-all">{text}</div>
      </div>
    )
  }

  if (textType === 'video') {
    if (text.includes('youtube.com') || text.includes('youtu.be')) {
      const videoId = extractYouTubeId(text)
      if (videoId) {
        return (
          <div className="aspect-video">
            <iframe
              className="w-full h-full rounded border border-gray-200"
              src={`https://www.youtube.com/embed/${videoId}`}
              allowFullScreen
            />
          </div>
        )
      }
    }

    return (
      <div className="space-y-2">
        <video
          src={text}
          controls
          className="max-w-full max-h-96 rounded border border-gray-200"
        />
        <div className="text-xs text-gray-400 break-all">{text}</div>
      </div>
    )
  }

  return (
    <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
      {text}
    </div>
  )
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  return match?.[1] ?? null
}
