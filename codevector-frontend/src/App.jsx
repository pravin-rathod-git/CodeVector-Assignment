import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Books', 'Home', 'Beauty', 'Sports'];


function App() {
  const [products, setProducts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchProducts = async (reset = false) => {
    setLoading(true);
    try {
      const activeCursor = reset ? null : cursor;
      let url = `${API_BASE_URL}/api/products?limit=12`;
      
      if (activeCursor) url += `&cursor=${encodeURIComponent(activeCursor)}`;
      if (selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.error) throw new Error(result.error);

      setProducts(prev => reset ? result.data : [...prev, ...result.data]);
      setCursor(result.pagination.nextCursor);
      setHasNextPage(result.pagination.hasNextPage);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset and fetch from the beginning whenever the category changes
  useEffect(() => {
    fetchProducts(true);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">CodeVector Shop</h1>
          
          <div className="flex items-center gap-2">
            <label htmlFor="category" className="text-sm font-medium text-gray-600">Filter:</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 bg-white border outline-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {product.category}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  ${product.price}
                </span>
              </div>
              <h2 className="text-lg font-medium text-gray-800 mb-1">{product.name}</h2>
              <p className="text-xs text-gray-400 mt-4">
                Added: {new Date(product.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {products.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">No products found in this category.</div>
        )}

        {hasNextPage && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => fetchProducts(false)}
              disabled={loading}
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-8 rounded-full transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More Products'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
