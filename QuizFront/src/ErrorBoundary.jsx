import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error if needed
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught an error", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: '1rem', background: '#fff3f3', borderRadius: 8 }}>
          An unexpected error occurred in this component.
        </div>
      );
    }
    return this.props.children;
  }
}
