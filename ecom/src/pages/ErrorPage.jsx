import React from 'react';
import { Link, useRouteError } from 'react-router-dom';
import Meta from '../components/common/Meta';

const ErrorPage = () => {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-6 font-sans antialiased">
      <Meta 
        title="500 Internal Server Error - BizCode" 
        description="Something went wrong on our end. We are looking into it."
      />
      
      <div className="max-w-xl w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 mb-10 border border-rose-100 shadow-sm animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">System Anomaly Detected</p>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">Internal Server Error</h1>
        
        <p className="text-base text-slate-600 leading-relaxed mb-10 max-w-md mx-auto">
          Our core engine encountered an unexpected exception while processing your request. The engineering team has been notified and is investigating the stack trace.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-xl shadow-slate-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            Retry Connection
          </button>
          
          <Link 
            to="/support" 
            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Report Incident
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Service Status</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
            <span className="text-[10px] text-slate-500 font-bold">DEGRADED PERFORMANCE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
