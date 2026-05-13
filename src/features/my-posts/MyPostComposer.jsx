import Icon from "../../components/ui/Icon.jsx";

export default function MyPostComposer({
  avatar,
  draft,
  expanded,
  selectedFileName,
  submitting,
  user,
  onDraftChange,
  onFileChange,
  onPublish,
  onSetDraft,
  onSetExpanded
}) {
  return (
    <form className="rounded-[32px] bg-white p-6 shadow-spatial md:p-8" onSubmit={onPublish}>
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <img src={avatar} alt={user.name} className="h-16 w-16 shrink-0 rounded-full object-cover" />
        <input
          className="min-h-12 flex-1 border-none bg-transparent p-0 text-xl text-on-surface outline-none placeholder:text-outline focus:ring-0"
          value={draft.title}
          onChange={(event) => onDraftChange("title", event.target.value)}
          onFocus={() => onSetExpanded(true)}
          placeholder="Write a new travel log..."
        />
        <div className="flex gap-3">
          <label className="btn-secondary cursor-pointer">
            <Icon name="image" size={18} />
            Photos
            <input className="sr-only" type="file" accept="image/*" multiple onChange={onFileChange} />
          </label>
          <button className="btn-primary !rounded-xl !px-7" disabled={submitting}>
            {submitting ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-6 grid gap-4 border-t border-surface-high pt-6 md:grid-cols-[1fr_190px_1fr]">
          <textarea
            className="field min-h-32 md:col-span-3"
            value={draft.body}
            onChange={(event) => onDraftChange("body", event.target.value)}
            placeholder="Tell the story..."
          />
          <input className="field" value={draft.location} onChange={(event) => onDraftChange("location", event.target.value)} placeholder="Location" />
          <input className="field" value={draft.date} onChange={(event) => onDraftChange("date", event.target.value)} placeholder="Date" />
          <input className="field" value={draft.tags} onChange={(event) => onDraftChange("tags", event.target.value)} placeholder="Tags, comma separated" />
          <textarea
            className="field min-h-24 md:col-span-3"
            value={draft.images.length ? selectedFileName : draft.image}
            onChange={(event) =>
              onSetDraft((current) => ({
                ...current,
                image: event.target.value,
                images: []
              }))
            }
            placeholder="Image URLs separated by commas or new lines, or upload photos"
          />
          {draft.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto md:col-span-3">
              {draft.images.map((image) => (
                <img key={image} src={image} alt="Uploaded preview" className="h-20 w-28 rounded-2xl object-cover" />
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
