"use client";

export function DailyBriefCard({ brief, loading, error, onRefresh }: { brief: string; loading: boolean; error: string | null; onRefresh: () => Promise<void>; }) {
  return (
    <section className="card">
      <div className="row space-between">
        <h2>Your day at a glance</h2>
        <button className="secondary-btn" onClick={onRefresh} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh brief"}
        </button>
      </div>
      {error ? <p className="status error">{error}</p> : <p>{brief}</p>}
    </section>
  );
}
