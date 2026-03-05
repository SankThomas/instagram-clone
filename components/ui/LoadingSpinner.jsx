export default function LoadingSpinner({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-8",
    lg: "size-12",
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-border border-t-primary ${sizeClasses[size]} ${className}`}
    />
  );
}
