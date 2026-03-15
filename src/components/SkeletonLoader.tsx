const SkeletonLoader = () => (
  <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
    <div className="h-8 bg-muted rounded-lg animate-pulse w-48" />
    <div className="h-32 bg-muted rounded-xl animate-pulse" />
    <div className="h-32 bg-muted rounded-xl animate-pulse" />
    <div className="h-32 bg-muted rounded-xl animate-pulse" />
  </div>
);

export default SkeletonLoader;
