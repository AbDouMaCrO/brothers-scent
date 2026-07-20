const SUPABASE_URL = 'https://lumhgprmkwjsbpvgckeq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1bWhncHJta3dqc2Jwdmdja2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MzM2OTYsImV4cCI6MjEwMDEwOTY5Nn0.bb9nwmRtNK3AL70xBAYfh3MF3pjgDKZtK4vzHYATZuU';

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SB = {
  // ── Auth ──
  async signIn(email, password) {
    const { data, error } = await _sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signUp(email, password, meta) {
    const { data, error } = await _sb.auth.signUp({
      email, password,
      options: { data: meta }
    });
    if (error) throw error;
    return data;
  },
  async signOut() {
    await _sb.auth.signOut();
  },
  onAuthChange(cb) {
    return _sb.auth.onAuthStateChange(cb);
  },

  // ── Data ──
  async products(catSlug) {
    let q = _sb.from('products').select('*').eq('active', true).order('created_at');
    if (catSlug && catSlug !== 'all') q = q.eq('category_slug', catSlug);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },
  async settings() {
    const { data } = await _sb.from('settings').select('*').single();
    return data || {};
  },
  async insertOrder(order) {
    const { data, error } = await _sb.from('orders').insert(order).select().single();
    if (error) throw error;
    return data;
  }
};
