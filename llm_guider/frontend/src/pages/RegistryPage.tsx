import { useEffect, useState } from 'react'
import { useModelStore } from '../stores/modelStore'
import { useUIStore } from '../stores/uiStore'
import SearchBar from '../components/registry/SearchBar'
import ModalityFilter from '../components/registry/ModalityFilter'
import ModelGrid from '../components/registry/ModelGrid'
import ModelDrawer from '../components/detail/ModelDrawer'

export default function RegistryPage() {
  const models = useModelStore((s) => s.models)
  const modalityFilter = useModelStore((s) => s.modalityFilter)
  const isLoading = useModelStore((s) => s.isLoading)
  const fetchModels = useModelStore((s) => s.fetchModels)
  const setSearch = useModelStore((s) => s.setSearch)
  const setModalityFilter = useModelStore((s) => s.setModalityFilter)
  const openDrawer = useUIStore((s) => s.openDrawer)

  const [localSearch, setLocalSearch] = useState('')

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(localSearch), 300)
    return () => clearTimeout(timer)
  }, [localSearch, setSearch])

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        <ModalityFilter selected={modalityFilter} onSelect={setModalityFilter} />
        <main className="flex-1 space-y-6">
          <SearchBar value={localSearch} onChange={setLocalSearch} />
          {isLoading ? (
            <div className="text-center py-24 text-slate-400">加载中...</div>
          ) : (
            <ModelGrid models={models} onSelect={openDrawer} />
          )}
        </main>
      </div>
      <ModelDrawer />
    </>
  )
}
