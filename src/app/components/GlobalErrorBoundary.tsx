import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error("🌍 Global Error:", error);
    console.error("Stack:", info.componentStack);
  }

  handleReset = () => {
    // resets entire app state
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white text-center p-6">
          <h1 className="text-3xl font-bold mb-2">
            Something went wrong 💥
          </h1>

          <p className="text-gray-300 mb-6">
            The application encountered an unexpected error.
          </p>

          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            Restart App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}