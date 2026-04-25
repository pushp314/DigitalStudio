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
                <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-6 font-sans antialiased text-slate-900">
                    <div className="max-w-xl w-full text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white border border-slate-200 shadow-2xl mb-12 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        </div>
                        
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Internal Server Error</p>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Something went wrong</h1>
                        
                        <p className="text-base text-slate-600 leading-relaxed mb-12 max-w-md mx-auto">
                            A runtime exception has occurred. Our engineering team has been notified and is investigating the issue.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button 
                                onClick={() => window.location.reload()}
                                className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-slate-200 hover:-translate-y-1 active:translate-y-0"
                            >
                                Reload Page
                            </button>
                            
                            <button 
                                onClick={() => window.location.href = '/'}
                                className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all hover:-translate-y-1 active:translate-y-0"
                            >
                                Go Home
                            </button>
                        </div>

                        <div className="mt-20 pt-10 border-t border-slate-200">
                             <div className="flex items-center justify-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Error 500</span>
                                </div>
                                <div className="h-4 w-px bg-slate-200"></div>
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">BizCode v4.0.2</span>
                             </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
