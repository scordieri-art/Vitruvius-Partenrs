/**
 * The server's rules (lib/actions.ts) as `pattern` attributes, so the browser can tell while the
 * visitor corrects a field whether it is right yet. Written for the `v` flag browsers compile
 * patterns with: brackets and dashes inside a class are escaped.
 */
export const PHONE = "[+\\(\\)0-9\\s.\\-]{6,20}";
export const EMAIL = "[^@\\s]+@[^@\\s]+\\.[^@\\s]+";
