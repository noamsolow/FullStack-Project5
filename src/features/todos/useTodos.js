import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import { normalizeImageUrl, normalizeSection, readFileAsDataUrl } from "./todoUtils.js";

const initialDrafts = { packing: "", packingCategory: "Tech", place: "", placeNote: "", placeImage: "" };
const initialTripDraft = { title: "", dates: "", image: "" };

export function useTodos({ user, params, setParams }) {
  const [todos, setTodos] = useState([]);
  const [trips, setTrips] = useState([]);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [tripDraft, setTripDraft] = useState(initialTripDraft);
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
  const activeTrips = trips;

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
        const matchesStatus = status === "all" || (status === "done" && todo.completed) || (status === "pending" && !todo.completed);
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
    setTripDraft(initialTripDraft);
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
    setDrafts((current) => (section === "bucket" ? { ...current, place: "", placeNote: "", placeImage: "" } : { ...current, packing: "" }));
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

  return {
    activeTrip,
    activeTrips,
    addTodo,
    addTrip,
    bucketTodos,
    deleteTodo,
    drafts,
    editing,
    error,
    formNotice,
    goToTrip,
    handleTripCoverUpload,
    loading,
    packingTodos,
    progress,
    q,
    saveTitle,
    setDrafts,
    setEditing,
    setFormNotice,
    setShowTools,
    setShowTripForm,
    setTripDraft,
    showTools,
    showTripForm,
    sort,
    status,
    toggleTodo,
    tripDraft,
    tripImageName,
    updateQuery
  };
}
