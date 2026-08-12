import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', background: '#0b0f19', color: '#f9fafb', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={52} color="#f59e0b" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Корпоративний сервіс «Їдемо Разом»</h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '24px', maxWidth: '400px', lineHeight: '1.4' }}>
            Натисніть кнопку нижче для очищення кешу та завантаження стрічки.
          </p>
          <button
            onClick={() => {
              try {
                localStorage.removeItem('otp_carpool_trips');
                localStorage.removeItem('otp_carpool_requests');
              } catch (e) {}
              window.location.reload();
            }}
            style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={18} /> Перезавантажити додаток
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
