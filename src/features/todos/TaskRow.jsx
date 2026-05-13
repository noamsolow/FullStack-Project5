import Icon from "../../components/ui/Icon.jsx";

export default function TaskRow({ todo, editing, setEditing, onSave, onToggle, onDelete, image }) {
  const isEditing = editing?.id === todo.id;

  return (
    <li className="group flex items-center gap-4 rounded-2xl p-1 transition hover:bg-surface-low md:p-2">
      <button
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition ${
          todo.completed ? "border-primary bg-primary text-white" : "border-outline-variant text-transparent group-hover:border-primary"
        }`}
        onClick={() => onToggle(todo)}
        aria-label={`Mark ${todo.title} ${todo.completed ? "pending" : "done"}`}
      >
        {todo.completed && <Icon name="check" size={16} strokeWidth={3} />}
      </button>

      {image && <img src={image} alt={todo.title} className="h-16 w-16 shrink-0 rounded-xl object-cover shadow-sm" />}

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <div className="space-y-2">
            <input className="field !rounded-xl !py-2" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} />
            {image && (
              <input
                className="field !rounded-xl !py-2"
                value={editing.subtitle || ""}
                onChange={(event) => setEditing({ ...editing, subtitle: event.target.value })}
                placeholder="Subtitle"
              />
            )}
          </div>
        ) : (
          <>
            <p className={`truncate text-xl font-medium ${todo.completed ? "text-on-surface-variant line-through" : "text-on-surface"}`}>{todo.title}</p>
            {todo.subtitle && <p className="truncate text-base text-on-surface-variant">{todo.subtitle}</p>}
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
        {isEditing ? (
          <button className="btn-secondary !px-3 !py-2" onClick={() => onSave(todo)}>
            Save
          </button>
        ) : (
          <button className="icon-btn !h-9 !w-9" onClick={() => setEditing({ id: todo.id, title: todo.title, subtitle: todo.subtitle || "" })} aria-label="Edit item">
            <Icon name="edit" size={18} />
          </button>
        )}
        <button className="icon-btn !h-9 !w-9 hover:!text-error" onClick={() => onDelete(todo.id)} aria-label="Delete item">
          <Icon name="delete" size={18} />
        </button>
      </div>
    </li>
  );
}
