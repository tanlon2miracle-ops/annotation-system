import { useCallback, useState, useRef } from 'react'

interface FileUploaderProps {
  onFile: (file: File) => void
  loading: boolean
}

export function FileUploader({ onFile, loading }: FileUploaderProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all glass ${
        dragging ? 'border-blue-400 !bg-blue-50/60 scale-[1.01]' : 'border-white/50 hover:border-indigo-300'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleSelect}
      />
      {loading ? (
        <p className="text-gray-500">导入中...</p>
      ) : (
        <>
          <p className="text-gray-500 text-lg">拖拽 JSON 文件到此处</p>
          <p className="text-gray-400 text-sm mt-2">或点击选择文件</p>
        </>
      )}
    </div>
  )
}
