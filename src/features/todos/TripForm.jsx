import Icon from "../../components/ui/Icon.jsx";

export default function TripForm({ tripDraft, tripImageName, onAddTrip, onCoverUpload, onTripDraftChange }) {
  return (
    <form className="grid gap-3 rounded-[28px] bg-white p-5 shadow-spatial md:grid-cols-[1fr_180px_1fr_auto]" onSubmit={onAddTrip}>
      <input
        className="field"
        value={tripDraft.title}
        onChange={(event) => onTripDraftChange((current) => ({ ...current, title: event.target.value }))}
        placeholder="New trip destination"
      />
      <input
        className="field"
        value={tripDraft.dates}
        onChange={(event) => onTripDraftChange((current) => ({ ...current, dates: event.target.value }))}
        placeholder="Dates"
      />
      <input
        className="field md:col-span-2"
        value={tripDraft.image.startsWith("data:") ? tripImageName : tripDraft.image}
        onChange={(event) => onTripDraftChange((current) => ({ ...current, image: event.target.value }))}
        placeholder="Cover image URL"
      />
      <label className="btn-secondary cursor-pointer">
        <Icon name="image" size={18} />
        Upload cover
        <input className="sr-only" type="file" accept="image/*" onChange={onCoverUpload} />
      </label>
      <button className="btn-primary">Add Trip</button>
    </form>
  );
}
