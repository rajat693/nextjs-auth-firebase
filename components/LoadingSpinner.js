export default function LoadingSpinner({ message = null }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      {message && (
        <p className="text-gray-700 font-medium">{message}</p>
      )}
    </div>
  );
}