import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import BookWiseBrand from './BookWiseBrand';

describe('BookWiseBrand', () => {
  it('renders the BookOpen icon and header wordmark', () => {
    const html = renderToStaticMarkup(<BookWiseBrand />);
    expect(html).toContain('lucide-book-open');
    expect(html).toContain('Book<span class="font-light">Wise</span>');
  });

  it('renders only the icon in compact mode', () => {
    const html = renderToStaticMarkup(<BookWiseBrand compact />);
    expect(html).toContain('lucide-book-open');
    expect(html).not.toContain('Wise');
  });
});
