import { requireAdmin, noStoreJson } from '../../_lib/admin-auth.js';

export async function onRequestGet(context) {
  const admin = await requireAdmin(context); if (admin instanceof Response) return admin;
  const { results } = await context.env.DB.prepare('SELECT id, lesson_name, subject, topics, actual_price, discounted_price, status, created_at FROM books ORDER BY created_at DESC').all();
  return noStoreJson({ books: results });
}

export async function onRequestPost(context) {
  const admin = await requireAdmin(context); if (admin instanceof Response) return admin;
  const book = await context.request.json();
  if (!['Biology', 'Physics', 'Chemistry'].includes(book.subject) || !book.lessonName || !book.topics || Number(book.actualPrice) < Number(book.discountedPrice)) return noStoreJson({ error: 'Invalid book details.' }, 400);
  const id = crypto.randomUUID();
  await context.env.DB.prepare('INSERT INTO books (id, lesson_name, subject, topics, actual_price, discounted_price, status, created_by) VALUES (?, ?, ?, ?, ?, ?, \'live\', ?)').bind(id, book.lessonName, book.subject, book.topics, book.actualPrice, book.discountedPrice, admin.admin_id).run();
  await context.env.DB.prepare('INSERT INTO admin_audit_log (id, admin_id, action, target_id) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), admin.admin_id, 'create_book', id).run();
  return noStoreJson({ id, status: 'live' }, 201);
}
