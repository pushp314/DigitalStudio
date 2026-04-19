import React, { useState, useContext } from 'react';
import testimonialService from '../../services/testimonialService';
import AuthContext from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Star, Send } from 'lucide-react';

const TestimonialForm = ({ onSuccess }) => {
    const { user } = useContext(AuthContext);
    const { addToast } = useToast();
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);

    if (!user) {
        return (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-3xl p-8 text-center">
                <p className="text-gray-600 mb-4">Please log in to share your testimonial.</p>
                <a href="/login" className="inline-block bg-black text-white px-6 py-2 rounded-full font-bold">Login</a>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) {
            addToast('Please enter your feedback', 'error');
            return;
        }

        try {
            setSubmitting(true);
            await testimonialService.create({ content, rating });
            addToast('Testimonial submitted! It will appear after admin approval.', 'success');
            setContent('');
            setRating(5);
            if (onSuccess) onSuccess();
        } catch (err) {
            addToast(err.message || 'Failed to submit testimonial', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 max-w-2xl mx-auto my-12">
            <h3 className="text-2xl font-black text-black mb-2">Share your experience</h3>
            <p className="text-gray-500 mb-6 text-sm">Your feedback helps us grow and improve for everyone.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">How would you rate us?</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setRating(num)}
                                className={`p-2 transition-all ${rating >= num ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            >
                                <Star size={32} fill={rating >= num ? "currentColor" : "none"} />
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Your Testimonial</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What did you like about our templates? How was your experience?"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 min-h-[120px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <Send size={18} />
                            Submit Testimonial
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default TestimonialForm;
