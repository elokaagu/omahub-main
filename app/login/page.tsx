import ErrorBoundary from "@/components/ErrorBoundary";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-oma-beige/50 to-white py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center font-canela text-3xl text-oma-plum">
          Welcome Back
        </h1>
        <p className="mt-2 text-center text-sm text-oma-cocoa">
          Sign in to your OmaHub account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <ErrorBoundary>
            <LoginForm />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
