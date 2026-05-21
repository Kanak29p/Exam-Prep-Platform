import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: any;
  errorInfo: any;
};

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("🌍 Global Error:", error);
    console.error("Stack:", info.componentStack);
    this.setState({ error, errorInfo: info });
  }

  handleReset = () => {
    // resets entire app state
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white text-center p-6 overflow-auto">
          <h1 className="text-3xl font-bold mb-2">
            Something went wrong 💥
          </h1>

          <p className="text-gray-300 mb-4">
            The application encountered an unexpected error.
          </p>

          {this.state.error && (
            <div className="w-full max-w-2xl bg-gray-800 text-left p-4 rounded-lg mb-6 border border-red-500 overflow-auto max-h-60 text-xs font-mono">
              <div className="font-bold text-red-400 mb-1">{this.state.error.toString()}</div>
              {this.state.errorInfo && (
                <pre className="text-gray-400 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
              )}
            </div>
          )}

          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 cursor-pointer"
          >
            Restart App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}