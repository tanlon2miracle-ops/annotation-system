import { MessageSquare, Image as ImageIcon, Cpu, Layers } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface ModalityConfig {
  icon: LucideIcon
  color: string
  bg: string
  border: string
  label: string
}

const CONFIGS: Record<string, ModalityConfig> = {
  text: { icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', label: '文本 (Text)' },
  image: { icon: ImageIcon, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', label: '图像 (Image)' },
  llm: { icon: Cpu, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', label: '大模型 (LLM)' },
  multimodal: { icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: '多模态 (VLM)' },
}

export function getModalityConfig(modality: string): ModalityConfig {
  return CONFIGS[modality] ?? CONFIGS.text
}

export const MODALITIES = ['all', 'text', 'image', 'llm', 'multimodal'] as const
