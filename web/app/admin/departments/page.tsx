'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Loader2, Building2, Tag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDept, setAddingDept] = useState(false);
  const [addingDesig, setAddingDesig] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });
  const [desigForm, setDesigForm] = useState({ department_id: '', name: '', pay_level: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('sp_token') || '' : '';

  useEffect(() => {
    const supabase = createClient();
    supabase.from('departments').select('*, designations(id, name, pay_level)').eq('is_active', true)
      .then(({ data }) => { setDepartments(data || []); setLoading(false); });
  }, []);

  async function addDepartment(e: React.FormEvent) {
    e.preventDefault();
    setAddingDept(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...deptForm }),
      }).then(r => r.json());
      setDepartments(prev => [...prev, { ...res.data, designations: [] }]);
      setDeptForm({ name: '', code: '', description: '' });
      toast.success('Department added!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAddingDept(false);
    }
  }

  async function addDesignation(e: React.FormEvent) {
    e.preventDefault();
    setAddingDesig(true);
    try {
      const body = {
        department_id: desigForm.department_id,
        name: desigForm.name,
        pay_level: desigForm.pay_level ? parseInt(desigForm.pay_level) : undefined,
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/designations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      }).then(r => r.json());
      setDepartments(prev => prev.map(d =>
        d.id === desigForm.department_id
          ? { ...d, designations: [...(d.designations || []), res.data] }
          : d
      ));
      setDesigForm({ ...desigForm, name: '', pay_level: '' });
      toast.success('Designation added!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAddingDesig(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Departments & Designations</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Add Department */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" /> Add Department</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addDepartment} className="space-y-3">
              <div className="space-y-1.5"><Label htmlFor="dept-name">Name</Label>
                <Input id="dept-name" placeholder="e.g. Customs & Excise" value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label htmlFor="dept-code">Code (2–10 chars)</Label>
                <Input id="dept-code" placeholder="e.g. CE" value={deptForm.code} onChange={e => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })} required maxLength={10} /></div>
              <div className="space-y-1.5"><Label htmlFor="dept-desc">Description</Label>
                <Input id="dept-desc" placeholder="Optional description" value={deptForm.description} onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} /></div>
              <Button type="submit" className="w-full gradient-saffron text-white border-0 gap-2" disabled={addingDept}>
                {addingDept ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Department
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Add Designation */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Tag className="w-4 h-4" /> Add Designation</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addDesignation} className="space-y-3">
              <div className="space-y-1.5"><Label htmlFor="desig-dept">Department</Label>
                <Select value={desigForm.department_id} onValueChange={v => setDesigForm({ ...desigForm, department_id: v ?? '' })}>
                  <SelectTrigger id="desig-dept"><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label htmlFor="desig-name">Designation Name</Label>
                <Input id="desig-name" placeholder="e.g. Inspector" value={desigForm.name} onChange={e => setDesigForm({ ...desigForm, name: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label htmlFor="desig-pay">Pay Level (1–18)</Label>
                <Input id="desig-pay" type="number" min={1} max={18} placeholder="Optional" value={desigForm.pay_level} onChange={e => setDesigForm({ ...desigForm, pay_level: e.target.value })} /></div>
              <Button type="submit" className="w-full gradient-saffron text-white border-0 gap-2" disabled={addingDesig || !desigForm.department_id}>
                {addingDesig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Designation
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Department List */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">All Departments</h2>
        {departments.map(dept => (
          <Card key={dept.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="font-semibold">{dept.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{dept.code}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(dept.designations || []).map((d: any) => (
                  <span key={d.id} className="text-xs bg-muted px-2 py-1 rounded-md">
                    {d.name} {d.pay_level ? `(L${d.pay_level})` : ''}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
