import { Link } from "react-router-dom";


export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-gray-500 mt-2">Page not found.</p>

      <div className="mt-6 flex gap-4">
        <Link className="text-blue-500 underline" to="/">
          Home
        </Link>

        <Link className="text-blue-500 underline" to="/dashboard">
          Dashboard
        </Link>
      </div>
    </div>
  );
}