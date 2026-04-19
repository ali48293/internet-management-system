import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Component Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem', textAlign: 'center' }}>
          <AlertTriangle color="var(--danger)" size={64} style={{ marginBottom: '1rem' }} />
          <h1>Something went wrong.</h1>
          <p className="text-sub" style={{ marginBottom: '2rem' }}>An unexpected UI error occurred. Please refresh the page.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Refresh Page</button>
          
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '2rem', whiteSpace: 'pre-wrap', textAlign: 'left', background: 'var(--surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
