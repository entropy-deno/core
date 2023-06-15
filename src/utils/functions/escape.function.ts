export function escape(html: string) {
  return html.replace(
    /[&<>'"]/g,
    (char) => {
      const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#39;',
      };

      return entities[char as '&' | '<' | '>' | '"' | `'`];
    },
  );
}
