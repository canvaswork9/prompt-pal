const DisabledFeaturePlaceholder = ({ name }: { name: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center p-6">
    <div className="text-4xl">🔒</div>
    <h2 className="text-xl font-semibold">{name} is currently disabled</h2>
    <p className="text-muted-foreground text-sm">This feature has been turned off by the admin.</p>
  </div>
);

export default DisabledFeaturePlaceholder;
