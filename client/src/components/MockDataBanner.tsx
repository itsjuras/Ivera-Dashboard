import { X } from 'lucide-react'

export default function MockDataPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xl max-w-sm w-full mx-4 p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-900 tracking-wider uppercase">Heads up</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 transition-colors">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-neutral-500 tracking-wider leading-relaxed uppercase">
          Could not connect to the server. The data you see is sample data for demonstration purposes.
        </p>
        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-neutral-900 text-white text-xs font-medium tracking-widest rounded-lg uppercase hover:bg-neutral-800 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
