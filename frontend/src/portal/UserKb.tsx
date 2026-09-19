import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function UserKb() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  
  // Navigation state
  const [view, setView] = useState<'categories' | 'sections' | 'articles' | 'article_detail'>('categories');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedSec, setSelectedSec] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  useEffect(() => {
    api.get('/kb/public', { params: { search } }).then(res => setArticles(res.data));
  }, [search]);

  // Group data for the drill-down views
  const groupedData = useMemo(() => {
    const categories: any = {};
    articles.forEach(a => {
      const catName = a.section.category.name;
      const secName = a.section.name;
      if (!categories[catName]) categories[catName] = {};
      if (!categories[catName][secName]) categories[catName][secName] = [];
      categories[catName][secName].push(a);
    });

    return {
      categories: Object.keys(categories).map(catName => ({
        name: catName,
        sectionCount: Object.keys(categories[catName]).length,
        sections: Object.keys(categories[catName]).map(secName => ({
          name: secName,
          articleCount: categories[catName][secName].length,
          articles: categories[catName][secName]
        }))
      }))
    };
  }, [articles]);

  const currentCategory = groupedData.categories.find(c => c.name === selectedCat);
  const currentSection = currentCategory?.sections.find(s => s.name === selectedSec);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setSelectedArticle(null);
    if (val) setView('articles'); 
    if (!val) setView('categories');
  };

  // Breadcrumbs
  const renderBreadcrumb = () => {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <button 
          onClick={() => { setView('categories'); setSelectedCat(null); setSelectedSec(null); setSelectedArticle(null); setSearch(''); }} 
          className="hover:text-blue-600 font-medium"
        >
          All Categories
        </button>
        {selectedCat && view !== 'categories' && (
          <>
            <span>/</span>
            <button 
              onClick={() => { setView('sections'); setSelectedSec(null); setSelectedArticle(null); }} 
              className="hover:text-blue-600 font-medium"
            >
              {selectedCat}
            </button>
          </>
        )}
        {selectedSec && (view === 'articles' || view === 'article_detail') && (
          <>
            <span>/</span>
            <button 
              onClick={() => { setView('articles'); setSelectedArticle(null); }} 
              className="hover:text-blue-600 font-medium"
            >
              {selectedSec}
            </button>
          </>
        )}
        {selectedArticle && view === 'article_detail' && (
          <>
            <span>/</span>
            <span className="text-gray-700 font-medium">{selectedArticle.title}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/portal')} className="mb-4 text-green-600 hover:underline text-sm">&larr; Back to My Tickets</button>
      
      <div className="clay p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">Knowledge Base</h1>
        <input 
          type="text" 
          placeholder="Search for solutions..." 
          value={search} 
          onChange={(e) => handleSearchChange(e.target.value)} 
          className="w-full px-4 py-3 clay-input text-sm focus:outline-none text-gray-700"
        />
      </div>

      {renderBreadcrumb()}

      {/* ================= VIEW: CATEGORIES ================= */}
      {!search && view === 'categories' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {groupedData.categories.length === 0 && <p className="text-gray-500 col-span-full text-center py-8">No categories found.</p>}
          {groupedData.categories.map(cat => (
            <div 
              key={cat.name} 
              onClick={() => { setSelectedCat(cat.name); setView('sections'); }} 
              className="clay p-4 cursor-pointer hover:-translate-y-1 transition-transform flex flex-col items-center text-center justify-center h-32"
            >
              <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
              <h2 className="text-sm font-bold text-gray-700">{cat.name}</h2>
              <p className="text-[10px] text-gray-400 mt-1">{cat.sectionCount} Sections</p>
            </div>
          ))}
        </div>
      )}

      {/* ================= VIEW: SECTIONS ================= */}
      {!search && view === 'sections' && currentCategory && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {currentCategory.sections.map(sec => (
            <div 
              key={sec.name} 
              onClick={() => { setSelectedSec(sec.name); setView('articles'); }} 
              className="clay p-4 cursor-pointer hover:-translate-y-1 transition-transform flex flex-col items-center text-center justify-center h-32"
            >
              <svg className="w-8 h-8 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <h2 className="text-sm font-bold text-gray-700">{sec.name}</h2>
              <p className="text-[10px] text-gray-400 mt-1">{sec.articleCount} Articles</p>
            </div>
          ))}
        </div>
      )}

      {/* ================= VIEW: ARTICLES LIST ================= */}
      {(search || view === 'articles') && view !== 'article_detail' && (
        <div className="clay p-6">
          <div className="divide-y divide-gray-100">
            {articles.length === 0 && <p className="text-gray-500 text-center py-8">No articles found. Try a different search.</p>}
            
            {/* If searching, show flat list. If drill-down, show only selected section's articles */}
            {(search ? articles : currentSection?.articles || []).map(article => (
              <div 
                key={article.id} 
                onClick={() => { setSelectedArticle(article); setView('article_detail'); }} 
                className="py-3 cursor-pointer hover:text-blue-600 text-gray-800 font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {article.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= VIEW: ARTICLE DETAIL ================= */}
      {view === 'article_detail' && selectedArticle && (
        <div className="clay p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{selectedArticle.title}</h1>
          <div className="text-sm text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedArticle.publicContent }} />
          <p className="text-xs text-gray-400 mt-8 pt-4 border-t border-gray-100">Last Updated: {new Date(selectedArticle.updatedAt).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}