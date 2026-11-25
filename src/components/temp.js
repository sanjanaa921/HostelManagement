import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import noteContext from '../context/noteContext';
import { Send, ThumbsUp, Sparkles, Building2, Utensils } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { PageHeader } from './ui/PageHeader';
import { Badge } from './ui/Badge';
import { Alert } from './ui/Alert';

export const Temp = () => {
  const { state, dispatch } = useContext(noteContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (localStorage.getItem('token')) {
      if (localStorage.getItem('room_no')) {
        dothis();
      } else {
        navigate("/home");
      }
    } else {
      navigate("/signin");
    }
  }, [navigate]);

  function dothis() {
    dispatch({ type: 'UPDATE_VALUE', payload: true });
    dispatch({ type: 'UPDATE_AVALUE', payload: false });
  }

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setAlert({ show: true, message: 'Please provide both title and feedback comments.', type: 'warning' });
      return;
    }

    setLoading(true);
    setAlert({ show: false, message: '', type: 'info' });

    try {
      const response = await fetch(`http://${state.backend}:${state.port}/api/f/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ title, message })
      });

      const json = await response.json();
      setLoading(false);

      if (json.response) {
        setAlert({
          show: true,
          message: json.message || 'Thank you! Your feedback has been shared with the hostel warden.',
          type: 'success'
        });
        setTitle("");
        setMessage("");
      } else {
        setAlert({
          show: true,
          message: json.message || 'Could not submit feedback.',
          type: 'error'
        });
      }
    } catch (err) {
      setLoading(false);
      setAlert({ show: true, message: 'Server connection error: ' + err.message, type: 'error' });
    }
  };

  const sampleTopics = [
    { label: 'Mess Food Quality & Menu', icon: Utensils },
    { label: 'Hostel Maintenance & Utilities', icon: Building2 },
    { label: 'Internet Speed & Wi-Fi Coverage', icon: Sparkles },
    { label: 'Gym & Sports Facilities', icon: ThumbsUp },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Hostel & Mess Feedback"
        description="Share your constructive suggestions and reviews to continuously improve hostel amenities and student life."
        badge={<Badge variant="purple">Student Voice</Badge>}
      />

      {alert.show && (
        <Alert type={alert.type} onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Feedback Form */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle>Submit Suggestions & Review</CardTitle>
              <CardDescription>
                Your feedback helps hostel management, chief wardens, and mess committees take immediate action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                {/* Subject / Title */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Topic / Subject
                  </label>
                  <input
                    type="text"
                    id="email"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Suggestions for Sunday Dinner Menu"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>

                {/* Quick Topic Chips */}
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Suggested Topics:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {sampleTopics.map((topic, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTitle(topic.label)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-600 transition-colors"
                      >
                        <topic.icon className="w-3.5 h-3.5 text-blue-600" />
                        <span>{topic.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <label htmlFor="message" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Detailed Comments & Feedback
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide clear details and constructive ideas on how we can improve..."
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                    <span>Respectful communication helps us resolve matters promptly</span>
                    <span>{message.length} chars</span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Submitting Feedback...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Official Feedback</span>
                    </>
                  )}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Info Card */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/40 border-indigo-100">
            <CardHeader>
              <CardTitle>How Feedback Is Processed</CardTitle>
              <CardDescription>Our institutional review cycle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-600">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-800">Weekly Warden Review</p>
                  <p className="text-slate-500 mt-0.5">All submissions are categorized and reviewed during the weekly warden committee briefing.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-800">Mess Committee Action</p>
                  <p className="text-slate-500 mt-0.5">Dietary or menu recommendations are tabled with the student mess representatives.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-bold text-slate-800">Continuous Facility Upgrades</p>
                  <p className="text-slate-500 mt-0.5">Physical repairs and amenity expansions are prioritized based on student feedback volumes.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default Temp;
