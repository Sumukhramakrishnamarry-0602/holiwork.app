export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      <p>{description}</p>
    </div>
  );
}
