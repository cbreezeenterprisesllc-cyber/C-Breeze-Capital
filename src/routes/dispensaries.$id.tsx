import { apiFetch } from "~/lib/api-config";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { TopbarNav } from "~/components/Navigation";
import { Button } from "~/components/Button";
import { Card, CardBody } from "~/components/Card";
import { Badge } from "~/components/Badge";
import { Input } from "~/components/Input";
import { useCart } from "~/context/CartContext";

export const Route = createFileRoute("/dispensaries/$id")({ component: StorefrontPage });

function StorefrontPage() {
  const { id } = Route.useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [strain, setStrain] = useState("");
  const { addItem, itemCount } = useCart();

  useState(() => {
    fetch(`/api/tenants/${id}`).then(r=>r.json()).then(async tRes => {
      if (!tRes.success) { setLoading(false); return; }
      const tenant = tRes.data;
      const [pRes, cRes] = await Promise.all([
        fetch(`/api/products?tenantId=${tenant.id}`).then(r=>r.json()),
        fetch(`/api/categories?tenantId=${tenant.id}`).then(r=>r.json()),
      ]);
      setData({ tenant, products: pRes.success ? pRes.data : [], categories: cRes.success ? cRes.data : [] });
      setLoading(false);
    }).catch(() => setLoading(false));
  });

  const strains = useMemo(() => data ? [...new Set(data.products.map((p:any)=>p.strain_type).filter(Boolean))] : [], [data]);
  const filtered = useMemo(() => data ? data.products.filter((p:any) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (cat && p.category_id !== cat) return false;
    if (strain && p.strain_type !== strain) return false;
    return true;
  }) : [], [data, search, cat, strain]);

  if (loading) return <div className="min-h-dvh bg-emerald-50 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full"/></div>;
  if (!data) return <div className="min-h-dvh bg-emerald-50 flex items-center justify-center"><p className="text-gray-500">Not found.</p></div>;

  const t = data.tenant;
  return (
    <div className="min-h-dvh bg-emerald-50">
      <TopbarNav branding={{title:t.store_name}} items={[{label:"Home",href:"/"},{label:"Dispensaries",href:"/dispensaries"},{label:`Cart(${itemCount})`,href:"/cart"}]}/>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shrink-0" style={{backgroundColor:t.primary_color||"#2D6A4F"}}>{(t.store_name||"S").charAt(0)}</div>
          <div><h1 className="text-4xl font-bold text-gray-800">{t.store_name}</h1><Badge variant="success" size="sm" dot>Open</Badge></div>
        </div>
        <div className="flex flex-wrap gap-4 mb-8">
          <Input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} />
          <select className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm" value={cat} onChange={e=>setCat(e.target.value)}>
            <option value="">All</option>{data.categories.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {strains.length>0&&<select className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm" value={strain} onChange={e=>setStrain(e.target.value)}>
            <option value="">All Strains</option>{strains.map((s:any)=><option key={s} value={s}>{s}</option>)}
          </select>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p:any)=><Card key={p.id} hover padding="md"><CardBody>
            <div className="h-40 bg-emerald-100 rounded-lg mb-4 flex items-center justify-center text-emerald-300 text-4xl">&#127807;</div>
            {(p.category_name||p.strain_type)&&<div className="flex gap-2 mb-2">{p.category_name&&<Badge size="sm">{p.category_name}</Badge>}{p.strain_type&&<Badge variant="info" size="sm">{p.strain_type}</Badge>}</div>}
            <h3 className="text-lg font-semibold text-gray-800 mb-1">{p.name}</h3>
            {p.thc_content&&<p className="text-sm text-emerald-600 mb-2">THC: {p.thc_content}</p>}
            <div className="flex items-center justify-between"><span className="text-xl font-bold">${Number(p.price).toFixed(2)}</span>
              <Button size="sm" onClick={()=>addItem({productId:p.id,name:p.name,price:Number(p.price),quantity:1,imageUrl:"",thcContent:p.thc_content||"",unit:p.unit||"g",tenantId:p.tenant_id,tenantName:t.store_name})}>Add</Button>
            </div>
          </CardBody></Card>)}
        </div>
        {filtered.length===0&&<p className="text-center py-16 text-gray-400 text-lg">No products match.</p>}
      </main>
      {itemCount>0&&<Link to="/cart" className="fixed bottom-6 right-6 bg-emerald-800 text-white px-6 py-3 rounded-full shadow-lg hover:bg-emerald-700 flex items-center gap-2 z-50">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
        <span className="font-medium">Cart ({itemCount})</span>
      </Link>}
    </div>
  );
}