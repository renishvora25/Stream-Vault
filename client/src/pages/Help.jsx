import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaQuestionCircle, FaBook, FaEnvelope, FaShieldAlt } from 'react-icons/fa';

export default function Help() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [formState, setFormState] = useState({ name: '', email: '', message: '', type: 'general' });
  const [isSending, setIsSending] = useState(false);
  const [sentMessage, setSentMessage] = useState(false);

  const faqs = [
    {
      q: "How do I upload a video?",
      a: "Click the bright orange 'Upload' button in the top right corner of the navigation bar. This will open a modal where you can select your video file, upload a custom thumbnail, and set your title and description."
    },
    {
      q: "Can I change my username?",
      a: "Currently, usernames are permanent identifiers for your account and cannot be changed. However, you can update your Display Name (Full Name) at any time by visiting your Settings page."
    },
    {
      q: "How do I edit or delete my videos?",
      a: "Navigate to your 'Dashboard' from the left sidebar. There, you'll see a list of all your uploaded videos. Click the pencil icon to edit details (like the title or thumbnail), or the trash can icon to permanently delete a video."
    },
    {
      q: "How do Playlists work?",
      a: "Playlists allow you to organize videos. You can create a new playlist from the Playlists tab, or by clicking 'Save' while watching any video. Videos can be added to multiple playlists."
    }
  ];

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    setIsSending(true);
    // Simulate API call
    setTimeout(() => {
      setIsSending(false);
      setSentMessage(true);
      setFormState({ name: '', email: '', message: '', type: 'general' });
      setTimeout(() => setSentMessage(false), 5000);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center justify-center sm:justify-start gap-3 mb-2">
          <FaQuestionCircle className="text-[#C85C2C]" /> Help Center
        </h1>
        <p className="text-gray-500 font-medium">Find answers, learn how to grow your channel, or get in touch with us.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FaQuestionCircle className="text-gray-400" /> Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className={`border rounded-xl overflow-hidden transition-all duration-200 ${activeFaq === index ? 'border-[#C85C2C]/30 bg-orange-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left font-semibold text-gray-900 focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <span className="text-gray-400 ml-4">
                      {activeFaq === index ? <FaChevronUp /> : <FaChevronDown />}
                    </span>
                  </button>
                  {activeFaq === index && (
                    <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FaBook className="text-gray-400" /> The Creator Handbook
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 text-sm">Understanding Your Dashboard</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Your Dashboard is your command center. It gives you a birds-eye view of your total channel views, subscriber count, and likes across all videos. Use this data to understand what content your audience loves most.
                </p>
              </div>
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 text-sm">Video Visibility</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  When you upload a video, you can set it as Public or Draft. Draft videos are only visible to you on your Dashboard, allowing you to prepare the perfect title and thumbnail before making it public.
                </p>
              </div>
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 text-sm">Optimizing Your Profile</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  A great profile attracts subscribers. Head to Settings to upload a high-quality Avatar and a striking Cover Image. This helps build a recognizable brand for your channel.
                </p>
              </div>
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 text-sm">Engaging with Viewers</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Don't just upload and forget! Reply to comments on your videos. Active creators tend to grow much faster because they build a community, not just an audience.
                </p>
              </div>
            </div>
          </section>

        </div>

        <div className="lg:col-span-1 space-y-8">
          <section className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl shadow-md text-white">
            <FaShieldAlt className="text-3xl text-[#C85C2C] mb-4" />
            <h2 className="text-lg font-bold mb-2">Account Security</h2>
            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              We take your security seriously. If you suspect any unauthorized access, please change your password immediately in the Settings menu.
            </p>
          </section>

          
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaEnvelope className="text-gray-400" /> Contact Support
            </h2>
            <p className="text-xs text-gray-500 mb-6">Can't find what you're looking for? Send us a message and our team will get back to you.</p>
            
            {sentMessage ? (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm font-semibold text-center">
                Message sent successfully! We'll be in touch soon.
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Issue Type</label>
                  <select 
                    value={formState.type}
                    onChange={e => setFormState({...formState, type: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C85C2C] bg-white"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="bug">Report a Bug</option>
                    <option value="account">Account Issue</option>
                    <option value="feedback">Feedback / Suggestion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
                  <input 
                    type="text" 
                    required
                    value={formState.name}
                    onChange={e => setFormState({...formState, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C85C2C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={formState.email}
                    onChange={e => setFormState({...formState, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C85C2C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Message</label>
                  <textarea 
                    rows="4" 
                    required
                    value={formState.message}
                    onChange={e => setFormState({...formState, message: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C85C2C] resize-none"
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={isSending}
                  className="w-full py-2.5 bg-black text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isSending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
