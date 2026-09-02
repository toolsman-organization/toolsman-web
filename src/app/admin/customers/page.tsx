import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { Users, Mail, Phone, Calendar } from 'lucide-react';

export const metadata = {
  title: 'Customer Directory | Admin TOOLSMAN',
};

export default async function AdminCustomersPage() {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const customers = profiles || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Users & Profiles
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Customer Directory ({customers.length})
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center shrink-0">
                          {c.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <span className="font-bold text-neutral-900 block text-sm">
                            {c.full_name || 'Anonymous User'}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            ID: {c.id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-neutral-700 font-bold">
                        {c.phone || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`status-pill ${c.role === 'admin' ? 'bg-orange-100 text-orange-800' : 'bg-neutral-100 text-neutral-700'}`}>
                        {c.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-500">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-neutral-400 text-xs">
            No customers registered yet.
          </div>
        )}
      </div>
    </div>
  );
}
