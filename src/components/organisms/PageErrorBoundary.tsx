import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class PageErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.log("🚨 Page Error:", error);
    console.log("📍 Stack:", info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload(); // full reset of page state
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: 20
        }}>
          <h1 style={{ fontSize: 24, marginBottom: 10 }}>
            Something went wrong on this page 💥
          </h1>

          <p style={{ color: "#666", marginBottom: 20 }}>
            The page crashed, but don’t worry — your app is safe.
          </p>

          <button
            onClick={this.handleReload}
            style={{
              padding: "10px 20px",
              background: "#3b82f6",
              color: "white",
              borderRadius: 8
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
