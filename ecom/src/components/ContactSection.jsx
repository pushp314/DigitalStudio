import React, { useContext, useState } from 'react';
import ConfigContext from '../context/ConfigContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const ContactSection = () => {
  const { config } = useContext(ConfigContext);
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  
  const contact = config?.contact ?? {};
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toastError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/contact', {
        name: form.name,
        email: form.email,
        subject: form.subject || 'New Marketplace Enquiry',
        message: form.message
      });
      success("Inquiry sent! We'll stay in touch.");
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toastError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans">
      <div className="max-w-[1400px] mx-auto bg-white rounded-[3rem] p-8 md:p-16 flex flex-col lg:flex-row gap-16 lg:gap-24 shadow-sm">
        <div className="w-full lg:w-1/2 flex flex-col gap-10">
          <div>
            <h2 className="text-5xl md:text-7xl font-black text-black tracking-tight mb-6">
              {contact.heading || 'Contact us'}
            </h2>
            <p className="text-gray-500 text-lg font-medium">
              {contact.subheading || 'Send us a message and we will get back to you.'}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <InfoCard label="Email" value={contact.email || config?.supportEmail} />
            <InfoCard label="Address" value={contact.address} />
            <InfoCard label="Phone" value={contact.phone} />
          </div>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="border border-gray-100 rounded-[2.5rem] p-8 md:p-10 h-full flex flex-col justify-between">
            <h3 className="text-3xl md:text-4xl font-bold text-black tracking-tight mb-8">
              Send an enquiry
            </h3>

            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <Field label="Full Name">
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700 placeholder-gray-400"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700 placeholder-gray-400"
                />
              </Field>

              <Field label="Subject">
                <input
                  type="text"
                  placeholder="What is this regarding?"
                  value={form.subject}
                  onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700 placeholder-gray-400"
                />
              </Field>

              <Field label="Message">
                <textarea
                  placeholder="Type your message here..."
                  rows="4"
                  value={form.message}
                  onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700 placeholder-gray-400 resize-none"
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full bg-[#86A1FF] hover:bg-blue-600 text-white font-bold text-lg py-4 rounded-full transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-2">
    <label className="text-gray-900 font-medium">{label}</label>
    {children}
  </div>
);

const InfoCard = ({ label, value }) => {
  if (!value) {
    return null;
  }

  return (
    <div className="bg-[#F9FAFB] rounded-2xl p-6 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
        </div>
        <span className="font-bold text-black">{label}</span>
      </div>
      <p className="text-gray-600 pl-9 font-medium">{value}</p>
    </div>
  );
};

export default ContactSection;
