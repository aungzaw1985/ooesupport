import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import EditorToolbar from '../components/EditorToolbar';


export default function KbArticleEditor() {
  const navigate = useNavigate();
  const { id } = useParams(); // If ID exists, we are editing
  const [categories, setCategories] = useState<any[]>([]);
  
  const [title, setTitle] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const editorPublic = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: '',
  });
  const editorInternal = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: '',
  });

  useEffect(() => {
    api.get('/kb/categories').then(res => setCategories(res.data));
    
    if (id) {
      // Editing existing article: fetch and populate
      api.get('/kb/articles').then(res => {
        const article = res.data.find((a: any) => a.id === Number(id));
        if (article) {
          setTitle(article.title);
          setSelectedSectionId(article.sectionId);
          editorPublic?.commands.setContent(article.publicContent || '');
          editorInternal?.commands.setContent(article.internalContent || '');
        }
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSectionId) return alert('Please select a Section.');
    
    const payload = {
      title,
      publicContent: editorPublic?.getHTML() || '',
      internalContent: editorInternal?.getHTML() || '',
      sectionId: Number(selectedSectionId)
    };

    if (id) {
      await api.patch(`/kb/articles/${id}`, payload);
    } else {
      await api.post('/kb/articles', payload);
    }
    navigate('/admin/kb');
  };

  if (!editorPublic || !editorInternal) return <div className="p-8 text-center text-gray-500">Loading editor...</div>;

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin/kb')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Knowledge Base
      </button>

      <div className="clay p-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-6 text-gray-700">{id ? 'Edit Article' : 'Create New Article'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Article Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., How to reset password" className="w-full px-4 py-2 clay-input text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Select Section</label>
              <select value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)} className="w-full px-4 py-2 clay-input text-sm bg-white" required>
                <option value="">Select a Section...</option>
                {categories.flatMap(c => c.sections.map(s => ({ ...s, categoryName: c.name }))).map(s => (
                  <option key={s.id} value={s.id}>{s.categoryName} &gt; {s.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Public Content Editor */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Public Content</label>
            <div className="clay-sm overflow-hidden border border-gray-200">
              <EditorToolbar editor={editorPublic} />
              <EditorContent editor={editorPublic} className="p-4 min-h-[200px] prose prose-sm max-w-none focus:outline-none" />
              <div className="flex gap-1 p-2 border-b bg-[#e6ebf2]">
                <button type="button" onClick={() => editorPublic.chain().focus().toggleBold().run()} className={`p-1 rounded ${editorPublic.isActive('bold') ? 'bg-gray-300 text-blue-600' : 'text-gray-500'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" /></svg></button>
                <button type="button" onClick={() => editorPublic.chain().focus().toggleItalic().run()} className={`p-1 rounded ${editorPublic.isActive('italic') ? 'bg-gray-300 text-blue-600' : 'text-gray-500'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 4h-9M14 20H5M15 4L9 20" /></svg></button>
                <button type="button" onClick={() => editorPublic.chain().focus().toggleBulletList().run()} className={`p-1 rounded ${editorPublic.isActive('bulletList') ? 'bg-gray-300 text-blue-600' : 'text-gray-500'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h.01M4 12h.01M4 18h.01M8 6h13M8 12h13M8 18h13" /></svg></button>
                <button type="button" onClick={() => editorPublic.chain().focus().toggleOrderedList().run()} className={`p-1 rounded ${editorPublic.isActive('orderedList') ? 'bg-gray-300 text-blue-600' : 'text-gray-500'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 6h13M7 12h13M7 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg></button>
              </div>
              
            </div>
          </div>

          {/* Internal Content Editor */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Internal Notes (Agents Only)</label>
            <div className="clay-sm overflow-hidden border border-yellow-200">
            <div className="bg-yellow-50"><EditorToolbar editor={editorInternal} /></div>
            <EditorContent editor={editorInternal} className="p-4 min-h-[150px] prose prose-sm max-w-none bg-yellow-50 focus:outline-none" />
              <div className="flex gap-1 p-2 border-b bg-[#fdf6e3]">
                <button type="button" onClick={() => editorInternal.chain().focus().toggleBold().run()} className={`p-1 rounded ${editorInternal.isActive('bold') ? 'bg-gray-300 text-yellow-700' : 'text-gray-500'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" /></svg></button>
                <button type="button" onClick={() => editorInternal.chain().focus().toggleItalic().run()} className={`p-1 rounded ${editorInternal.isActive('italic') ? 'bg-gray-300 text-yellow-700' : 'text-gray-500'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 4h-9M14 20H5M15 4L9 20" /></svg></button>
                <button type="button" onClick={() => editorInternal.chain().focus().toggleBulletList().run()} className={`p-1 rounded ${editorInternal.isActive('bulletList') ? 'bg-gray-300 text-yellow-700' : 'text-gray-500'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h.01M4 12h.01M4 18h.01M8 6h13M8 12h13M8 18h13" /></svg></button>
              </div>
              
            </div>
          </div>
          
          <div className="flex gap-2">
            <button type="submit" className="clay-button clay-sm flex-1 text-blue-600 bg-blue-600 py-2 text-sm font-medium">
              {id ? 'Update Article' : 'Save Draft'}
            </button>
            <button type="button" onClick={() => navigate('/admin/kb')} className="clay-button clay-sm text-gray-700 px-6 py-2 text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
