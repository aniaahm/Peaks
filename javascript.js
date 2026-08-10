async function searchBooks(query) {
  const resultsContainer = document.getElementById('book-search-results') || document.getElementById('searchResults');
  if (!resultsContainer) return;
  
  const trimmed = query ? query.trim() : '';
  if (!trimmed) {
    resultsContainer.innerHTML = '';
    return;
  }

  resultsContainer.innerHTML = '<p class="text-xs text-[#71717A] py-2 text-center">Searching books...</p>';

  try {
    let items = [];

    // 1. Primary: Google Books API with safe URI encoding
    try {
      const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(trimmed)}&maxResults=10`);
      if (gbRes.ok) {
        const gbData = await gbRes.json();
        if (gbData?.items?.length) {
          items = gbData.items.map(item => {
            const info = item.volumeInfo || {};
            const thumb = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
            return {
              title: info.title || 'Untitled',
              author: info.authors ? info.authors.join(', ') : (info.publisher || 'Unknown Author'),
              cover: thumb.replace('http://', 'https://'),
              description: info.description || '',
              year: info.publishedDate ? info.publishedDate.substring(0, 4) : '',
              genres: info.categories ? info.categories.join(', ') : '',
              pages: info.pageCount || ''
            };
          });
        }
      }
    } catch (e) {
      console.warn('Google Books lookup failed, trying fallback...', e);
    }

    // 2. Fallback: Open Library API if Google Books returned nothing or failed
    if (!items.length) {
      const olRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(trimmed)}&limit=10`);
      if (olRes.ok) {
        const olData = await olRes.json();
        if (olData?.docs?.length) {
          items = olData.docs.map(doc => ({
            title: doc.title || 'Untitled',
            author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
            cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '',
            description: doc.first_sentence ? doc.first_sentence.join(' ') : '',
            year: doc.first_publish_year ? String(doc.first_publish_year) : '',
            genres: doc.subject ? doc.subject.slice(0, 3).join(', ') : '',
            pages: doc.number_of_pages_median || ''
          }));
        }
      }
    }

    // Render results
    if (!items.length) {
      resultsContainer.innerHTML = '<p class="text-xs text-[#71717A] py-2 text-center">No books found. Use manual fill below.</p>';
      return;
    }

    resultsContainer.innerHTML = items.map((book, idx) => `
      <div class="search-result-item flex items-center gap-3 p-2 hover:bg-[#F0ECE1]/50 cursor-pointer rounded-lg border border-transparent hover:border-[#E5E5E0] transition-colors" data-index="${idx}">
        ${book.cover ? `<img src="${book.cover}" class="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0" alt="">` : `<div class="w-10 h-14 bg-[#EBE7DF] rounded flex items-center justify-center text-[10px] text-[#71717A] flex-shrink-0">No Cover</div>`}
        <div class="overflow-hidden text-left">
          <p class="text-sm font-medium text-[#141414] truncate">${book.title}</p>
          <p class="text-xs text-[#71717A] truncate">${book.author} ${book.year ? `(${book.year})` : ''}</p>
        </div>
      </div>
    `).join('');

    // Attach click auto-fill listeners
    resultsContainer.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const selected = items[parseInt(el.dataset.index, 10)];
        if (typeof populateBookForm === 'function') {
          populateBookForm(selected);
        } else if (typeof fillBookFields === 'function') {
          fillBookFields(selected);
        }
      });
    });

  } catch (err) {
    console.error('Book Search Error:', err);
    resultsContainer.innerHTML = '<p class="text-xs text-[#71717A] py-2 text-center">Search error. Please enter details manually.</p>';
  }
}
// Global navigation switch function
window.switchApp = function(appName) {
  console.log("Switching view to:", appName);
  
  // Hide all view elements that match the app-view class or naming convention
  document.querySelectorAll('.app-view, [id$="-view"]').forEach(el => {
    el.classList.add('hidden');
  });
  
  // Locate the target view and reveal it
  const targetView = document.getElementById(appName + '-view') || document.getElementById(appName);
  if (targetView) {
    targetView.classList.remove('hidden');
  } else {
    console.warn("Target view container not found for:", appName);
  }
};
