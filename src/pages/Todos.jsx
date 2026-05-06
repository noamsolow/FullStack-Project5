import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/Status.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { travelImages } from "../data/travelImages.js";
import { api } from "../lib/api.js";

const bucketImages = [
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=300&q=80",
  travelImages[7]
];

const packingCategories = ["Tech", "Documents", "Clothing", "Toiletries", "Health", "Money", "Other"];

export default function Todos() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [todos, setTodos] = useState([]);
  const [trips, setTrips] = useState([]);
  const [drafts, setDrafts] = useState({ packing: "", packingCategory: "Tech", place: "", placeNote: "", placeImage: "" });
  const [tripDraft, setTripDraft] = useState({ title: "", dates: "", image: "" });
  const [tripImageName, setTripImageName] = useState("");
  const [showTripForm, setShowTripForm] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formNotice, setFormNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sort = params.get("sort") || "id";
  const q = params.get("q") || "";
  const status = params.get("status") || "all";
  const tripParam = params.get("trip");

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/todos?userId=${user.id}`, { cache: false }), api.get(`/trips?userId=${user.id}`, { cache: false })])
      .then(([todoData, tripData]) => {
        setTodos(todoData);
        setTrips(tripData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user.id]);

  const activeTrips = trips;

  const activeTripIndex = useMemo(() => {
    const index = activeTrips.findIndex((trip) => String(trip.id) === String(tripParam));
    return index >= 0 ? index : 0;
  }, [activeTrips, tripParam]);

  const activeTrip = activeTrips[activeTripIndex] || null;

  const tripTodos = useMemo(() => {
    if (!activeTrip) return [];
    return todos.filter((todo) => String(todo.tripId || activeTrip.id) === String(activeTrip.id));
  }, [activeTrip, todos]);

  const visibleTodos = useMemo(() => {
    return tripTodos
      .filter((todo) => {
        const matchesSearch = !q || String(todo.id) === q || todo.title.toLowerCase().includes(q.toLowerCase());
        const matchesStatus =
          status === "all" || (status === "done" && todo.completed) || (status === "pending" && !todo.completed);
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sort === "title") return a.title.localeCompare(b.title);
        if (sort === "completed") return Number(a.completed) - Number(b.completed);
        return Number(a.id) - Number(b.id);
      });
  }, [q, sort, status, tripTodos]);

  const packingTodos = visibleTodos.filter((todo) => normalizeSection(todo) === "packing");
  const bucketTodos = visibleTodos.filter((todo) => normalizeSection(todo) === "bucket");
  const completedCount = tripTodos.filter((todo) => todo.completed).length;
  const progress = tripTodos.length ? Math.round((completedCount / tripTodos.length) * 100) : 0;
  const circumference = 251.2;
  const progressOffset = circumference - (progress / 100) * circumference;

  function updateQuery(next) {
    setParams({ sort, q, status, ...(activeTrip ? { trip: activeTrip.id } : {}), ...next });
  }

  function goToTrip(direction) {
    if (activeTrips.length < 2) return;
    const nextTrip = activeTrips[(activeTripIndex + direction + activeTrips.length) % activeTrips.length];
    updateQuery({ trip: nextTrip.id });
    setShowTripForm(false);
  }

  async function addTrip(event) {
    event.preventDefault();
    if (!tripDraft.title.trim()) return;

    const created = await api.post("/trips", {
      userId: user.id,
      title: tripDraft.title.trim(),
      dates: tripDraft.dates.trim() || "Dates TBD",
      image: normalizeImageUrl(tripDraft.image.trim(), trips.length, 1400)
    });

    setTrips((current) => [...current, created]);
    setTripDraft({ title: "", dates: "", image: "" });
    setTripImageName("");
    setShowTripForm(false);
    updateQuery({ trip: created.id });
  }

  async function handleTripCoverUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setTripImageName(file.name);
    setTripDraft((current) => ({ ...current, image: dataUrl }));
  }

  async function addTodo(event, section) {
    event.preventDefault();
    const title = section === "bucket" ? drafts.place.trim() : drafts.packing.trim();
    if (!activeTrip) {
      setShowTripForm(true);
      setFormNotice("Create a trip before adding planning items.");
      return;
    }
    if (!title) {
      setFormNotice(section === "bucket" ? "Add a place name first." : "Add an item title first.");
      return;
    }
    setFormNotice("");

    const created = await api.post("/todos", {
      userId: user.id,
      tripId: activeTrip.id,
      title,
      completed: false,
      section,
      category: section === "packing" ? drafts.packingCategory : "Experience",
      subtitle: section === "bucket" ? drafts.placeNote.trim() || activeTrip.title : "",
      image: section === "bucket" ? normalizeImageUrl(drafts.placeImage.trim(), todos.length, 300) : undefined
    });

    setTodos((current) => [...current, created]);
    setDrafts((current) =>
      section === "bucket" ? { ...current, place: "", placeNote: "", placeImage: "" } : { ...current, packing: "" }
    );
  }

  async function toggleTodo(todo) {
    const updated = await api.patch(`/todos/${todo.id}`, { completed: !todo.completed });
    setTodos((current) => current.map((item) => (item.id === todo.id ? updated : item)));
  }

  async function saveTitle(todo) {
    if (!editing?.title.trim()) return;
    const updated = await api.patch(`/todos/${todo.id}`, {
      title: editing.title.trim(),
      subtitle: editing.subtitle?.trim() || todo.subtitle
    });
    setTodos((current) => current.map((item) => (item.id === todo.id ? updated : item)));
    setEditing(null);
  }

  async function deleteTodo(id) {
    await api.delete(`/todos/${id}`);
    setTodos((current) => current.filter((item) => item.id !== id));
  }

  if (loading) {
    return (
      <div className="mx-auto w-[min(1400px,calc(100%-40px))] pt-36">
        <LoadingState label="Loading trips..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-[min(1400px,calc(100%-40px))] pt-36">
        <ErrorState message={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 pb-24 pt-36 text-[#101727] md:px-10 md:pb-14">
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-8">
        <section className="relative min-h-[300px] overflow-hidden rounded-[32px] bg-white shadow-floating md:min-h-[340px]">
          {activeTrip ? (
            <img
              src={activeTrip.image || travelImages[0]}
              alt={activeTrip.title}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.src = travelImages[0];
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,88,188,0.18),transparent_34%),linear-gradient(135deg,#ffffff,#eae7ea)]" />
          )}
          <div className={`absolute inset-0 ${activeTrip ? "bg-gradient-to-r from-black/70 via-black/20 to-black/10" : "bg-white/15"}`} />

          {activeTrips.length > 1 && (
            <>
              <button
                className="absolute left-5 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-white/35"
                onClick={() => goToTrip(-1)}
                aria-label="Previous trip"
              >
                <Icon name="chevron_left" />
              </button>
              <button
                className="absolute right-5 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-white/35"
                onClick={() => goToTrip(1)}
                aria-label="Next trip"
              >
                <Icon name="chevron_right" />
              </button>
            </>
          )}
          <button
            className="absolute right-6 top-6 z-20 grid h-11 w-11 place-items-center rounded-full bg-primary text-white shadow-[0_14px_32px_rgba(0,88,188,0.32)] transition hover:scale-105"
            onClick={() => setShowTripForm((current) => !current)}
            aria-label="Add trip"
          >
            <Icon name="add" />
          </button>

          <div className={`relative z-10 flex min-h-[300px] flex-col justify-end gap-6 p-8 md:min-h-[340px] md:flex-row md:items-end md:justify-between md:p-10 ${activeTrip ? "text-white" : "text-on-surface"}`}>
            <div>
              <h1 className="font-serif text-5xl font-medium leading-tight md:text-6xl">{activeTrip?.title || "No trips yet"}</h1>
              <p className={`mt-3 text-xl font-medium ${activeTrip ? "text-white/90" : "text-on-surface-variant"}`}>
                {activeTrip?.dates || "Create your first trip to start planning."}
              </p>
            </div>
            <div className="flex w-fit items-center gap-4 rounded-full border border-white/20 bg-[#4c2a18]/65 px-6 py-4 shadow-lg backdrop-blur-md">
              <div className="text-right">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em]">Trip Prep</p>
                <p className="text-lg font-extrabold">{progress}% Complete</p>
              </div>
              <svg className="h-14 w-14" viewBox="0 0 100 100" aria-hidden="true">
                <circle className="stroke-white/20" cx="50" cy="50" fill="transparent" r="40" strokeWidth="8" />
                <circle
                  className="origin-center -rotate-90 stroke-[#d8e2ff] transition-all"
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="40"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                  strokeWidth="8"
                />
              </svg>
            </div>
          </div>
        </section>

        {showTripForm && (
          <form className="grid gap-3 rounded-[28px] bg-white p-5 shadow-spatial md:grid-cols-[1fr_180px_1fr_auto]" onSubmit={addTrip}>
            <input
              className="field"
              value={tripDraft.title}
              onChange={(event) => setTripDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="New trip destination"
            />
            <input
              className="field"
              value={tripDraft.dates}
              onChange={(event) => setTripDraft((current) => ({ ...current, dates: event.target.value }))}
              placeholder="Dates"
            />
            <input
              className="field md:col-span-2"
              value={tripDraft.image.startsWith("data:") ? tripImageName : tripDraft.image}
              onChange={(event) => setTripDraft((current) => ({ ...current, image: event.target.value }))}
              placeholder="Cover image URL"
            />
            <label className="btn-secondary cursor-pointer">
              <Icon name="image" size={18} />
              Upload cover
              <input className="sr-only" type="file" accept="image/*" onChange={handleTripCoverUpload} />
            </label>
            <button className="btn-primary">Add Trip</button>
          </form>
        )}

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
                onClick={() => updateQuery({ status: value })}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="btn-secondary w-full md:w-auto" onClick={() => setShowTools((current) => !current)}>
            <Icon name="search" size={18} />
            Tools
          </button>
        </div>

        {showTools && (
          <section className="grid gap-4 rounded-[28px] bg-white p-5 shadow-spatial md:grid-cols-[1fr_220px]">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-on-surface-variant">Search by id or title</span>
              <input
                className="field"
                value={q}
                onChange={(event) => updateQuery({ q: event.target.value })}
                placeholder="camera, 3, adapter..."
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-on-surface-variant">Sort by</span>
              <select className="field" value={sort} onChange={(event) => updateQuery({ sort: event.target.value })}>
                <option value="id">ID</option>
                <option value="title">Title</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </section>
        )}

        <section className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <PlannerCard
            title="Packing List"
            actionIcon="add"
            items={packingTodos}
            emptyTitle="No packing tasks"
            draft={drafts.packing}
            packingCategory={drafts.packingCategory}
            onDraftChange={(value) => setDrafts((current) => ({ ...current, packing: value }))}
            onPackingCategoryChange={(value) => setDrafts((current) => ({ ...current, packingCategory: value }))}
            onAdd={(event) => addTodo(event, "packing")}
            onMissingTrip={() => setShowTripForm(true)}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            editing={editing}
            setEditing={setEditing}
            onSave={saveTitle}
            hasTrip={Boolean(activeTrip)}
            notice={formNotice}
            clearNotice={() => setFormNotice("")}
            grouped
          />

          <PlannerCard
            title="Places to go"
            actionIcon="more_horiz"
            items={bucketTodos}
            emptyTitle="No places yet"
            draft={drafts.place}
            placeNote={drafts.placeNote}
            placeImage={drafts.placeImage}
            onDraftChange={(value) => setDrafts((current) => ({ ...current, place: value }))}
            onPlaceNoteChange={(value) => setDrafts((current) => ({ ...current, placeNote: value }))}
            onPlaceImageChange={(value) => setDrafts((current) => ({ ...current, placeImage: value }))}
            onAdd={(event) => addTodo(event, "bucket")}
            onMissingTrip={() => setShowTripForm(true)}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            editing={editing}
            setEditing={setEditing}
            onSave={saveTitle}
            hasTrip={Boolean(activeTrip)}
            notice={formNotice}
            clearNotice={() => setFormNotice("")}
          />
        </section>
      </main>
    </div>
  );
}

function PlannerCard({
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
            <button className="btn-primary !rounded-xl !px-4 !py-2">
              Add place
            </button>
          </div>
        )}
        {notice && (!grouped || notice.includes("item")) && (
          <p className="mt-3 rounded-2xl bg-error-soft px-4 py-3 text-sm font-bold text-error">{notice}</p>
        )}
      </form>
    </article>
  );
}

function TaskRow({ todo, editing, setEditing, onSave, onToggle, onDelete, image }) {
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
            <input
              className="field !rounded-xl !py-2"
              value={editing.title}
              onChange={(event) => setEditing({ ...editing, title: event.target.value })}
            />
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
            <p className={`truncate text-xl font-medium ${todo.completed ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
              {todo.title}
            </p>
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

function groupItems(items) {
  const groups = items.reduce((acc, item) => {
    const category = item.category || "Essentials";
    acc[category] = [...(acc[category] || []), item];
    return acc;
  }, {});

  return Object.entries(groups);
}

function normalizeSection(todo) {
  if (todo.section) return todo.section;
  return /book|visit|reserve|tour|ticket/i.test(todo.title) ? "bucket" : "packing";
}

function categoryIcon(category) {
  const normalized = category.toLowerCase();
  if (normalized.includes("tech")) return "plug";
  if (normalized.includes("cloth")) return "shirt";
  if (normalized.includes("document")) return "file";
  if (normalized.includes("toiletr")) return "person";
  if (normalized.includes("health")) return "heart";
  if (normalized.includes("money")) return "language";
  return "plus";
}

function normalizeImageUrl(value, fallbackIndex, width = 1400) {
  if (!value) return travelImages[fallbackIndex % travelImages.length];
  if (value.includes("images.unsplash.com") || value.startsWith("data:image/")) return value;

  const unsplashPhotoId = value.match(/unsplash\.com\/photos\/(?:[^/]*-)?([A-Za-z0-9_-]+)(?:[/?#]|$)/)?.[1];
  if (unsplashPhotoId) {
    return `https://source.unsplash.com/${unsplashPhotoId}/${width}x${Math.round(width * 0.66)}`;
  }

  return value;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
