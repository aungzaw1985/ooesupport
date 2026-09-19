import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import EditorToolbar from '../components/EditorToolbar';

export default function UserTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [entries, setEntries] = useState<any[]>([]);
  const [ticketInfo, setTicketInfo] = useState<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: '',
  });

  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const submitRating = async () => {
    if (!rating) return;
    try {
      await api.patch(`/tickets/${id}/rate`, { rating, comment: ratingComment });
      setRatingSubmitted(true);
      fetchTicket();
    } catch (err) {
      alert('Failed to submit rating.');
    }
  };

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicketInfo(res.data);
      setRating(res.data.rating || null);
      setRatingComment(res.data.ratingComment || '');
      setRatingSubmitted(res.data.rating !== null);
      
      const threadRes = await api.get(`/tickets/${id}/thread`);
      const threadData = threadRes.data;
      
      const visibleEntries = (threadData.entries || []).filter((e: any) => e.type !== 'note');
      setEntries(visibleEntries);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTicket();
    const socket: Socket = io();
    socket.on(`ticket:${id}:thread`, (newEntry: any) => {
      if (newEntry.type !== 'note') {
        setEntries((prevEntries) => [...prevEntries, newEntry]);
      }
    });
    return () => { socket.disconnect(); };
  }, [id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const htmlContent = editor?.getHTML() || '';
    if (!htmlContent.trim() || htmlContent === '<p></p>') return;

    try {
      await api.post(`/tickets/${id}/replies`, { body: htmlContent });
      editor?.commands.clearContent();
      fetchTicket(); 
    } catch (err) {
      console.error(err);
    }
  };

  if (!ticketInfo || !editor) {
    return <div className="p-8 text-center text-gray-500">Loading ticket...</div>;
  }

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/portal')} className="mb-4 text-green-600 hover:underline text-sm">
        &larr; Back to My Tickets
      </button>

      <div className="clay p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-700">{ticketInfo.subject}</h1>
        <p className="text-sm text-gray-500 mt-1">{ticketInfo.number} • Status: <span className="font-semibold text-green-600">{ticketInfo.status}</span></p>
      </div>
      
      {['RESOLVED', 'CLOSED'].includes(ticketInfo.status) && (
        <div className="clay p-6 mb-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase mb-3">Rate Support Experience</h3>
          {ratingSubmitted ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600">Thank you for your feedback!</p>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-5 h-5 ${star <= (ticketInfo.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(null)}>
                    <svg className={`w-8 h-8 transition-colors ${star <= (hoverRating || rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </button>
                ))}
              </div>
              <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Optional feedback..." className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700 h-20" />
              <button onClick={submitRating} disabled={!rating} className="clay-button clay-sm text-blue-800 bg-green-600 px-4 py-2 text-sm font-medium disabled:opacity-50">Submit Rating</button>
            </div>
          )}
        </div>
      )}

      <div className="clay p-6 mb-6">
        <h3 className="text-xs font-medium text-gray-500 uppercase mb-4">Ticket Information</h3>
        {ticketInfo.staff ? (
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-lg overflow-hidden">
              {ticketInfo.staff.photoUrl ? <img src={ticketInfo.staff.photoUrl} alt="Agent" className="w-full h-full object-cover" /> : `${ticketInfo.staff.firstname.charAt(0)}${ticketInfo.staff.lastname.charAt(0)}`}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Assigned Agent</p>
              <p className="font-bold text-gray-800">{ticketInfo.staff.firstname} {ticketInfo.staff.lastname}</p>
              <p className="text-sm text-gray-500">{ticketInfo.staff.email}</p>
              {ticketInfo.staff.phone && <p className="text-sm text-gray-400">{ticketInfo.staff.phone}</p>}
            </div>
          </div>
        ) : (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <p className="text-sm text-gray-500">Assigned Agent: <span className="font-medium text-gray-400">Not assigned yet</span></p>
          </div>
        )}

        {ticketInfo.customData && Object.keys(ticketInfo.customData).filter(k => k !== 'subject').length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(ticketInfo.customData).filter(k => k !== 'subject').map(key => (
              <div key={key} className="text-sm">
                <p className="text-gray-500 capitalize mb-1">{key}</p>
                <p className="text-gray-800 font-medium break-words bg-[#e6ebf2] px-3 py-2 rounded-lg">{ticketInfo.customData[key] || '-'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No additional details provided.</p>
        )}
      </div>

      <div className="space-y-4 mb-6">
        {entries.map((entry) => (
          <div key={entry.id} className={`clay-sm p-4 ${entry.type === 'response' ? 'bg-blue-50 ml-2 md:ml-8' : 'bg-gray-50 mr-2 md:mr-8'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm text-gray-700">{entry.type === 'message' ? 'You' : 'Support Agent'}</span>
              <span className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
            <div className="text-sm text-gray-800 mb-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: entry.body }} />
            {entry.attachments && entry.attachments.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                {entry.attachments.map((att: any) => (
                  <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:underline">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    {att.filename}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleReply} className="clay overflow-hidden">
        <div className="p-4 bg-[#e6ebf2] border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-700">Add a Reply</h2>
        </div>

        <div className="p-4 bg-[#f0f4f8]">
          <EditorToolbar editor={editor} />
          <EditorContent editor={editor} className="p-3 min-h-[120px] prose prose-sm max-w-none focus:outline-none" />
        </div>

        <div className="flex justify-end items-center p-4 border-t border-gray-200 bg-[#e6ebf2]">
          <button type="submit" className="clay-button clay-sm px-5 py-2 text-blue-800 font-medium text-sm transition-colors bg-green-600 hover:bg-green-700">Send Reply</button>
        </div>
      </form>
    </div>
  );
}