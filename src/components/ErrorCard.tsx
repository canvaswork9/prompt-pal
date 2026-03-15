const ErrorCard = ({ message = 'Something went wrong. Please refresh.' }: { message?: string }) => (
  <div className="bg-card rounded-xl p-6 card-shadow text-center text-muted-foreground text-sm">
    ⚠️ {message}
  </div>
);

export default ErrorCard;
