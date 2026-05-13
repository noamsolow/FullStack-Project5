import { avatarImages } from "../../data/travelImages.js";
import Icon from "../ui/Icon.jsx";

export default function InfoDrawer({ open, onClose, user }) {
  if (!open) return null;

  const address = user.address || {};
  const company = user.company || {};
  const avatar = user.avatar || avatarImages[(Number(user.id) - 1) % avatarImages.length];

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xl">
      <aside className="fixed bottom-4 right-4 top-4 flex w-[calc(100%-32px)] max-w-[520px] flex-col rounded-[32px] bg-white shadow-floating md:bottom-8 md:right-8 md:top-8">
        <div className="flex justify-end p-6 pb-0">
          <button className="icon-btn" onClick={onClose} aria-label="Close info">
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <section className="flex flex-col items-center pt-4 text-center">
            <img src={avatar} alt={user.name} className="mb-6 h-32 w-32 rounded-full border-4 border-white object-cover shadow-spatial" />
            <h1 className="font-serif text-5xl font-medium">{user.name}</h1>
            <p className="mt-2 text-on-surface-variant">@{user.username}</p>
          </section>

          <section className="mt-8 rounded-[24px] bg-surface-low p-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Travel Style</p>
            <p className="font-serif text-3xl italic leading-tight">"{company.catchPhrase || "Documenting quiet places and memorable routes."}"</p>
          </section>

          <section className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="rounded-[24px] bg-surface-low p-6">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                <Icon name="location_on" className="text-primary" />
                Basecamp
              </p>
              <p className="font-semibold">{address.city || "Unknown City"}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{[address.street, address.suite].filter(Boolean).join(", ")}</p>
            </div>
            <div className="rounded-[24px] bg-surface-low p-6">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                <Icon name="language" className="text-primary" />
                Web
              </p>
              <p className="truncate font-semibold">{user.website}</p>
            </div>
          </section>

          <section className="mt-5 rounded-[24px] bg-surface-low p-6">
            <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
              <Icon name="mail" />
              Contact
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-on-surface-variant">Email</p>
                <p className="font-semibold">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-on-surface-variant">Phone</p>
                <p className="font-semibold">{user.phone}</p>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
