import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import BookRowActions from './BookRowActions';

function actions(bookTitle = 'Clean Code') {
  return { bookTitle, onAdjust: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
}

function buttons(props: Parameters<typeof BookRowActions>[0]) {
  return BookRowActions(props).props.children as ReactElement<{
    onClick: () => void;
    className: string;
  }>[];
}

describe('BookRowActions', () => {
  it.each(['Clean Code', '', 'Capa <rara> & "especial"'])(
    'renders a horizontal accessible action group for %j',
    (bookTitle) => {
      const props = actions(bookTitle);
      const html = renderToStaticMarkup(<BookRowActions {...props} />);
      expect(html).toContain('role="group"');
      expect(html).toContain('class="flex justify-end gap-1"');
      expect(html.match(/type="button"/g)).toHaveLength(3);
      for (const label of ['Ajustar preço', 'Editar', 'Remover']) {
        expect(html).toContain(`title="${label}"`);
        expect(html).toContain(`aria-label="${label}: `);
      }
      expect(html).not.toContain('<rara>');
      expect(html).not.toContain('border-');
      expect(html).not.toContain('shadow');
      expect(html.match(/stroke-width="2"/g)).toHaveLength(3);
    },
  );

  it('delegates each action to its original callback', () => {
    const props = actions();
    buttons(props).forEach((button) => button.props.onClick());
    expect(props.onAdjust).toHaveBeenCalledOnce();
    expect(props.onEdit).toHaveBeenCalledOnce();
    expect(props.onDelete).toHaveBeenCalledOnce();
  });

  it('uses the exact Categories icon-action classes, including destructive hover', () => {
    const group = buttons(actions());
    for (const button of group.slice(0, 2)) {
      expect(button.props.className).toBe(
        'rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800',
      );
    }
    expect(group[2].props.className).toBe(
      'rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10',
    );
  });

  it('does not swallow callback errors', () => {
    const props = actions();
    props.onDelete.mockImplementation(() => {
      throw new Error('Falha ao remover');
    });
    expect(() => buttons(props)[2].props.onClick()).toThrow('Falha ao remover');
  });
});
