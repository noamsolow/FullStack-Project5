export function LoadingState({ label = "Loading..." }) {
  return <div className="card p-8 text-center font-bold text-on-surface-variant">{label}</div>;
}

export function EmptyState({ title, body }) {
  return (
    <div className="card p-10 text-center">
      <h2 className="font-serif text-3xl">{title}</h2>
      <p className="mt-2 text-on-surface-variant">{body}</p>
    </div>
  );
}

export function ErrorState({ message }) {
  return <div className="rounded-[24px] bg-error-soft p-5 font-bold text-error">{message}</div>;
}
