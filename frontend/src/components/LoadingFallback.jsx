export default function LoadingFallback({ message = 'Loading component chunk...' }) {
    return (
        <div className="lazy-fallback-container" role="status" aria-live="polite">
            <div className="lazy-fallback-card">
                <div className="lazy-fallback-spinner-wrap">
                    <div className="lazy-fallback-spinner"></div>
                    <span className="lazy-fallback-tag">Suspense Active</span>
                </div>
                <div className="lazy-fallback-text-col">
                    <div className="lazy-fallback-title">{message}</div>
                    <div className="lazy-fallback-subtitle">
                        Fetching dynamic JavaScript chunk over network on-demand
                    </div>
                </div>
                {/* Skeleton shimmer preview */}
                <div className="lazy-skeleton-group">
                    <div className="lazy-skeleton-bar short"></div>
                    <div className="lazy-skeleton-bar medium"></div>
                    <div className="lazy-skeleton-bar long"></div>
                </div>
            </div>
        </div>
    );
}
