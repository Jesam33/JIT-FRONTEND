export default function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-10 w-10" : "h-7 w-7";
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`${dims} animate-spin rounded-full border-2 border-site-text/20 border-t-site-text`} />
    </div>
  );
}
