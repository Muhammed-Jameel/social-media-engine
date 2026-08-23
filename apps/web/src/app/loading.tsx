export default function Loading() {
  return (
    <main id="main-content" className="loading-page" aria-busy="true" aria-label="Loading content">
      <div className="loading-line loading-line-short" />
      <div className="loading-line loading-line-title" />
      <div className="skeleton-grid">{Array.from({ length: 4 }, (_, index) => <div className="skeleton-card" key={index} />)}</div>
    </main>
  );
}
