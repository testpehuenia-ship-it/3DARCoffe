import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.handleReset);
      }

      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '1.75rem',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>☕</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2C3E2D', margin: '0 0 0.5rem 0' }}>
              No se pudo abrir la vista 3D
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 1.25rem 0', lineHeight: 1.4 }}>
              Ocurrió un inconveniente al cargar el visor en este dispositivo. Puedes seguir explorando el menú con normalidad.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#2C3E2D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '999px',
                padding: '0.65rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Volver al Menú
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
