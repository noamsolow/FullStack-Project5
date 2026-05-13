import { useMemo, useRef } from "react";
import Icon from "../../components/ui/Icon.jsx";
import { EmptyState } from "../../components/ui/Status.jsx";
import TaskRow from "./TaskRow.jsx";
import { bucketImages, categoryIcon, groupItems, packingCategories } from "./todoUtils.js";

export default function PlannerCard({
  title,
  actionIcon,
  items,
  emptyTitle,
  draft,
  packingCategory = "Tech",
  placeNote = "",
  placeImage = "",
  onDraftChange,
  onPackingCategoryChange,
  onPlaceNoteChange,
  onPlaceImageChange,
  onAdd,
  onMissingTrip,
  onToggle,
  onDelete,
  editing,
  setEditing,
  onSave,
  hasTrip,
  notice,
  clearNotice,
  grouped = false
}) {
  const groups = useMemo(() => groupItems(items), [items]);
  const inputRef = useRef(null);
  const isPlacesCard = !grouped;

  function handleHeaderAction() {
    if (!hasTrip) {
      onMissingTrip();
      return;
    }
    inputRef.current?.focus();
  }

  return (
    <article className="min-h-[520px] rounded-[32px] bg-white p-7 shadow-spatial md:p-9">
      <header className="mb-8 flex items-center justify-between">
        <h2 className="font-serif text-4xl font-medium">{title}</h2>
        <button
          className={`grid h-10 w-10 place-items-center rounded-full transition hover:scale-105 ${actionIcon === "add" ? "bg-primary text-white" : "bg-surface-high text-on-surface-variant"}`}
          onClick={handleHeaderAction}
          type="button"
          aria-label={`Add ${title.toLowerCase()} item`}
        >
          <Icon name={actionIcon} />
        </button>
      </header>

      {items.length === 0 ? (
        <EmptyState title={emptyTitle} body={hasTrip ? "Use the input below to add one for this trip." : "Create a trip first, then add planning items."} />
      ) : grouped ? (
        <div className="space-y-7">
          {groups.map(([category, group], index) => (
            <section key={category}>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.08em] text-on-surface-variant">
                <Icon name={categoryIcon(category)} size={18} />
                {category}
              </h3>
              <ul className="space-y-4">
                {group.map((todo) => (
                  <TaskRow key={todo.id} todo={todo} editing={editing} setEditing={setEditing} onSave={onSave} onToggle={onToggle} onDelete={onDelete} />
                ))}
              </ul>
              {index < groups.length - 1 && <div className="mt-7 h-px bg-surface-high" />}
            </section>
          ))}
        </div>
      ) : (
        <ul className="space-y-5">
          {items.map((todo, index) => (
            <TaskRow
              key={todo.id}
              todo={todo}
              editing={editing}
              setEditing={setEditing}
              onSave={onSave}
              onToggle={onToggle}
              onDelete={onDelete}
              image={todo.image || bucketImages[index % bucketImages.length]}
            />
          ))}
        </ul>
      )}

      <form className="mt-7 border-t border-surface-high pt-5" onSubmit={onAdd}>
        <div className="flex items-center gap-3">
          <Icon name={grouped ? "add" : "location_on"} className="text-outline-variant" size={22} />
          {grouped && (
            <select
              className="rounded-xl border border-outline-variant/70 bg-white px-3 py-2 text-sm font-bold text-on-surface-variant outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              value={packingCategory}
              onChange={(event) => {
                clearNotice();
                onPackingCategoryChange(event.target.value);
              }}
              disabled={!hasTrip}
              aria-label="Packing category"
            >
              {packingCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}
          <input
            ref={inputRef}
            className="w-full border-none bg-transparent p-0 text-base font-semibold text-on-surface outline-none placeholder:text-outline-variant focus:ring-0"
            value={draft}
            onChange={(event) => {
              clearNotice();
              onDraftChange(event.target.value);
            }}
            disabled={!hasTrip}
            placeholder={hasTrip ? (isPlacesCard ? "+ Add place to go..." : "+ Add new item...") : "Create a trip first..."}
          />
        </div>
        {isPlacesCard && (
          <div className="mt-4 grid gap-3 md:grid-cols-[0.8fr_1.2fr_auto]">
            <input
              className="field !rounded-xl !py-2"
              value={placeNote}
              onChange={(event) => {
                clearNotice();
                onPlaceNoteChange(event.target.value);
              }}
              disabled={!hasTrip}
              placeholder="Short note, e.g. sunrise view"
            />
            <input
              className="field !rounded-xl !py-2"
              value={placeImage}
              onChange={(event) => {
                clearNotice();
                onPlaceImageChange(event.target.value);
              }}
              disabled={!hasTrip}
              placeholder="Place image URL"
            />
            <button className="btn-primary !rounded-xl !px-4 !py-2">Add place</button>
          </div>
        )}
        {notice && (!grouped || notice.includes("item")) && <p className="mt-3 rounded-2xl bg-error-soft px-4 py-3 text-sm font-bold text-error">{notice}</p>}
      </form>
    </article>
  );
}
