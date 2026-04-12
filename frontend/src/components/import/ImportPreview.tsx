interface ImportPreviewProps {
  data: Record<string, unknown>[]
}

export function ImportPreview({ data }: ImportPreviewProps) {
  if (data.length === 0) return null

  const keys = Object.keys(data[0])

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">
          数据预览 (前 {data.length} 条)
        </h3>
      </div>
      <div className="overflow-x-auto max-h-64">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {keys.map((k) => (
                <th key={k} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                {keys.map((k) => (
                  <td key={k} className="px-3 py-1.5 text-gray-700 max-w-[200px] truncate">
                    {String(row[k] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
