export default function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 text-[11px] border border-slate-200">
      <div className="font-semibold text-slate-800 mb-1">Facility Status</div>
      <div className="space-y-1 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-600 ring-1 ring-slate-700" />
          <span className="text-slate-700">Operational</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-600 ring-1 ring-slate-700" />
          <span className="text-slate-700">Under Construction</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600 ring-1 ring-slate-700" />
          <span className="text-slate-700">Planned</span>
        </div>
      </div>
      <div className="font-semibold text-slate-800 mb-1">Region Score</div>
      <div className="flex items-center gap-1">
        <span className="text-slate-500">low</span>
        <div className="flex h-3 rounded overflow-hidden">
          <span className="w-4" style={{ background: "#eff6ff" }} />
          <span className="w-4" style={{ background: "#dbeafe" }} />
          <span className="w-4" style={{ background: "#93c5fd" }} />
          <span className="w-4" style={{ background: "#60a5fa" }} />
          <span className="w-4" style={{ background: "#3b82f6" }} />
          <span className="w-4" style={{ background: "#1d4ed8" }} />
        </div>
        <span className="text-slate-500">high</span>
      </div>
      <div className="text-[9px] text-slate-400 mt-1 italic">Bubble size ∝ MW</div>
    </div>
  );
}
