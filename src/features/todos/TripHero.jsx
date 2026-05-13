import Icon from "../../components/ui/Icon.jsx";
import { travelImages } from "../../data/travelImages.js";

const circumference = 251.2;

export default function TripHero({ activeTrip, activeTrips, progress, onAddTrip, onGoToTrip }) {
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
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
            onClick={() => onGoToTrip(-1)}
            aria-label="Previous trip"
          >
            <Icon name="chevron_left" />
          </button>
          <button
            className="absolute right-5 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-white/35"
            onClick={() => onGoToTrip(1)}
            aria-label="Next trip"
          >
            <Icon name="chevron_right" />
          </button>
        </>
      )}

      <button
        className="absolute right-6 top-6 z-20 grid h-11 w-11 place-items-center rounded-full bg-primary text-white shadow-[0_14px_32px_rgba(0,88,188,0.32)] transition hover:scale-105"
        onClick={onAddTrip}
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
  );
}
