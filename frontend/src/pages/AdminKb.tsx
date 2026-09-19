import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function AdminKb() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  
  // Hierarchy form state
  const [categoryName, setCategoryName] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Permission state
  const [canEditKb, setCanEditKb] = useState(false);
  const [myPoints, setMyPoints] = useState(0);

  const fetchData = async () => {
    const [cRes, aRes] = await Promise.all([api.get('/kb/categories'), api.get('/kb/articles')]);
    setCategories(cRes.data);
    setArticles(aRes.data);
  };

  useEffect(() => { 
    fetchData(); 
    
    // Check permissions from JWT token
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCanEditKb(payload.isAdmin || ['KB_CREATOR', 'KB_APPROVER'].includes(payload.kbRole));
      api.get('/staff/me').then(res => setMyPoints(res.data.kbPoints || 0));
    }
  }, []);

  // Hierarchy Handlers
  const handleCreateCategory = async (e: React.FormEvent) => { 
    e.preventDefault(); await api.post('/kb/categories', { name: categoryName }); setCategoryName(''); fetchData(); 
  };
  
  const handleCreateSection = async (e: React.FormEvent, categoryId: number) => { 
    e.preventDefault(); 
    if(!sectionName) return;
    await api.post('/kb/sections', { categoryId, name: sectionName }); 
    setSectionName(''); 
    fetchData(); 
  };

  const toggleCategory = (id: number) => {
    const idStr = id.toString();
    setExpandedCategories(prev => prev.includes(idStr) ? prev.filter(c => c !== idStr) : [...prev, idStr]);
  };

  const handleDeleteCategory = async (id: number) => {
    if(window.confirm('Delete this Category and all its Sections/Articles?')) { await api.delete(`/kb/categories/${id}`); fetchData(); }
  };
  
  const handleDeleteSection = async (id: number) => {
    if(window.confirm('Delete this Section and all its Articles?')) { await api.delete(`/kb/sections/${id}`); fetchData(); }
  };

  // Workflow Handlers
  const handleWorkflow = async (id: number, action: string) => {
    try {
      await api.post(`/kb/articles/${id}/${action}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update article status.');
    }
  };

  const handleViewVersions = async (articleId: number) => {
    const res = await api.get(`/kb/articles/${articleId}/versions`);
    setSelectedArticle(articles.find(a => a.id === articleId));
    setVersions(res.data);
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline text-sm">&larr; Back to Admin Dashboard</button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Hierarchy */}
        <div className="space-y-8">
          
          {/* Create Category Card (Only for Creators/Approvers) */}
          {canEditKb && (
            <div className="clay p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-700">Create Category</h2>
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="New Category (e.g., Hardware)" className="flex-1 px-4 py-2 clay-input text-sm" required />
                <button className="clay-button clay-sm text-blue-800 bg-blue-600 px-4 py-2 text-sm">Add</button>
              </form>
            </div>
          )}

          {/* Category & Section List */}
          <div className="clay p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-700">KB Hierarchy</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {categories.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No categories created yet.</p>}
              {categories.map(c => {
                const isExpanded = expandedCategories.includes(c.id.toString());
                return (
                  <div key={c.id} className="rounded-xl bg-[#e6ebf2] overflow-hidden">
                    <div 
                      className="flex justify-between items-center p-3 cursor-pointer hover:bg-[#dde3ec] transition-colors"
                      onClick={() => toggleCategory(c.id)}
                    >
                      <div className="flex items-center gap-2">
                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        <span className="text-sm font-bold text-gray-700">{c.name}</span>
                      </div>
                      {canEditKb && <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }} className="text-red-500 hover:text-red-700 text-xs font-bold">Delete</button>}
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2 bg-white border-t border-gray-200">
                        {canEditKb && (
                          <form onSubmit={(e) => handleCreateSection(e, c.id)} className="flex gap-2 mt-3">
                            <input value={c.id === Number(expandedCategories[0]) ? sectionName : ''} onChange={e => setSectionName(e.target.value)} placeholder={`New Section under ${c.name}`} className="flex-1 px-3 py-2 clay-input text-xs focus:outline-none" required />
                            <button type="submit" className="clay-button clay-sm text-blue-800 bg-blue-600 px-4 py-2 text-xs">Add Section</button>
                          </form>
                        )}

                        {c.sections.length > 0 ? (
                          <div className="space-y-2 mt-3">
                            {c.sections.map(s => (
                              <div key={s.id} className="flex justify-between items-center bg-[#e6ebf2] px-3 py-2 rounded-lg">
                                <span className="text-xs font-medium text-gray-700">{s.name}</span>
                                {canEditKb && <button onClick={() => handleDeleteSection(s.id)} className="text-red-500 hover:text-red-700 text-[10px] font-bold">Delete</button>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 text-center py-2">No sections yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Article Workflow & Versions */}
        <div className="clay p-6 h-fit lg:sticky lg:top-4">
          {!selectedArticle ? (
            <>
               <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-700">Article Workflow</h2>
                  {myPoints > 0 && (
                    <span className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-yellow-700 bg-yellow-100 rounded-full shadow-sm">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      {myPoints} KB Points
                    </span>
                  )}
                </div>
                {canEditKb && (
                  <button onClick={() => navigate('/admin/kb/new')} className="clay-button clay-sm text-blue-800 bg-green-600 px-4 py-2 text-xs font-medium">+ New Article</button>
                )}
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {articles.length === 0 && <p className="text-sm text-gray-500">No articles created yet.</p>}
                {articles.map(a => (
                  <div key={a.id} className="p-4 rounded-xl bg-[#e6ebf2]">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-sm text-gray-700 truncate">{a.title}</h3>
                      <div className="flex gap-1">
                        {a.isStale && <span className="text-[10px] px-2 py-1 rounded-full font-medium bg-orange-100 text-orange-800">Stale</span>}
                        <span className={`text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                          a.status === 'DRAFT' ? 'bg-gray-200 text-gray-600' :
                          a.status === 'IN_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                          a.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                          a.status === 'ARCHIVED' ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800'
                        }`}>{a.status.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">By: {a.creator?.firstname} {a.creator?.lastname}</p>
                    <p className="text-xs text-gray-400 mb-3 truncate">{a.section?.category?.name} &gt; {a.section?.name}</p>
                    
                    {canEditKb && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <button onClick={() => navigate(`/admin/kb/edit/${a.id}`)} className="clay-button clay-sm text-blue-600 px-3 py-1 text-xs">Edit</button>
                        <button onClick={() => handleViewVersions(a.id)} className="clay-button clay-sm text-gray-700 px-3 py-1 text-xs">Versions</button>
                        
                        {a.status === 'DRAFT' && <button onClick={() => handleWorkflow(a.id, 'submit')} className="clay-button clay-sm text-blue-800 bg-yellow-500 px-3 py-1 text-xs">Submit</button>}
                        {a.status === 'IN_REVIEW' && <button onClick={() => handleWorkflow(a.id, 'approve')} className="clay-button clay-sm text-blue-800 bg-blue-600 px-3 py-1 text-xs">Approve</button>}
                        {a.status === 'APPROVED' && <button onClick={() => handleWorkflow(a.id, 'publish')} className="clay-button clay-sm text-blue-800 bg-green-600 px-3 py-1 text-xs">Publish</button>}
                        {a.status === 'PUBLISHED' && <button onClick={() => handleWorkflow(a.id, 'archive')} className="clay-button clay-sm text-blue-800 bg-gray-600 px-3 py-1 text-xs">Archive</button>}
                        {a.status === 'ARCHIVED' && <button onClick={() => handleWorkflow(a.id, 'republish')} className="clay-button clay-sm text-blue-800 bg-green-600 px-3 py-1 text-xs">Republish</button>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-700">Versions: {selectedArticle.title}</h2>
                <button onClick={() => setSelectedArticle(null)} className="clay-button clay-sm text-gray-700 px-3 py-1 text-xs">Back to List</button>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {versions.length === 0 && <p className="text-sm text-gray-500">No previous versions saved.</p>}
                {versions.map(v => (
                  <div key={v.id} className="p-4 rounded-xl bg-[#e6ebf2]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-gray-700">Version {v.version}</span>
                      <span className="text-xs text-gray-400">{new Date(v.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Edited By: {v.editedBy?.firstname} {v.editedBy?.lastname}</p>
                    <div className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-200 prose prose-sm max-w-none max-h-40 overflow-y-auto" dangerouslySetInnerHTML={{ __html: v.content }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}