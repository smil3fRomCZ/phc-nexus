import { Component, type ErrorInfo, type ReactNode } from 'react';
import { router } from '@inertiajs/react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    handleGoHome = (): void => {
        this.setState({ hasError: false, error: null });
        router.visit('/');
    };

    render(): ReactNode {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div className="flex min-h-screen items-center justify-center bg-surface-canvas px-4">
                <div className="max-w-md text-center">
                    <div className="mb-4 text-4xl font-bold text-text-subtle">Chyba</div>
                    <h1 className="mb-2 text-xl font-semibold text-text-strong">
                        Něco se pokazilo
                    </h1>
                    <p className="mb-6 text-sm text-text-muted">
                        Na stránce došlo k neočekávané chybě. Zkuste to znovu nebo se vraťte na
                        hlavní stránku.
                    </p>
                    {import.meta.env.DEV && this.state.error && (
                        <pre className="mb-6 max-h-40 overflow-auto rounded-md border border-border-subtle bg-surface-secondary p-3 text-left text-xs text-status-danger">
                            {this.state.error.message}
                        </pre>
                    )}
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={this.handleReset}
                            className="rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-default transition-colors hover:bg-surface-hover"
                        >
                            Zkusit znovu
                        </button>
                        <button
                            onClick={this.handleGoHome}
                            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover"
                        >
                            Hlavní stránka
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
