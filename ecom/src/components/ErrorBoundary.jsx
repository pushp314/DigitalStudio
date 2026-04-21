import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4 font-sans text-slate-900 antialiased">
                    <div className="max-w-md w-full bg-white rounded-[2.5rem] p-12 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-10 shadow-sm">
                            <svg className="w-10 h-10 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4">Runtime Error</h4>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase mb-4">System Exception</h2>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-12">
                            A protocol mismatch or runtime exception has occurred. Our registry has been notified of the instance.
                        </p>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-slate-900 text-white px-8 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10"
                            >
                                Re-verify Registry [Reload]
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full bg-slate-50 text-slate-500 px-8 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                            >
                                Return to Central Hub
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
