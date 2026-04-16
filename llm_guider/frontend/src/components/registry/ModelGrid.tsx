import ModelCard from './ModelCard'
import EmptyState from '../common/EmptyState'
import type { ModelData } from '../../types'

interface Props {
  models: ModelData[]
  onSelect: (m: ModelData) => void
}

export default function ModelGrid({ models, onSelect }: Props) {
  if (models.length === 0) return <EmptyState />

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {models.map((model) => (
        <ModelCard key={model.id} model={model} onClick={() => onSelect(model)} />
      ))}
    </div>
  )
}
