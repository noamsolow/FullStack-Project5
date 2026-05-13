import Icon from "../../components/ui/Icon.jsx";

export default function TodoFilters({ q, sort, status, showTools, onToggleTools, onUpdateQuery }) {
  return (
    <>
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="hidden md:block w-[110px]" />
        <div className="inline-flex rounded-full border border-outline-variant/40 bg-surface-high p-1">
          {[
            ["all", "All"],
            ["pending", "Pending"],
            ["done", "Done"]
          ].map(([value, label]) => (
            <button
              key={value}
              className={`min-w-[84px] rounded-full px-6 py-2 text-sm font-bold transition ${
                status === value ? "bg-white text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
              }`}
              onClick={() => onUpdateQuery({ status: value })}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="btn-secondary w-full md:w-auto" onClick={onToggleTools}>
          <Icon name="search" size={18} />
          Tools
        </button>
      </div>

      {showTools && (
        <section className="grid gap-4 rounded-[28px] bg-white p-5 shadow-spatial md:grid-cols-[1fr_220px]">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-on-surface-variant">Search by id or title</span>
            <input className="field" value={q} onChange={(event) => onUpdateQuery({ q: event.target.value })} placeholder="camera, 3, adapter..." />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-on-surface-variant">Sort by</span>
            <select className="field" value={sort} onChange={(event) => onUpdateQuery({ sort: event.target.value })}>
              <option value="id">ID</option>
              <option value="title">Title</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </section>
      )}
    </>
  );
}
