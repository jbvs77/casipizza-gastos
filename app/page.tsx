'use client';

import { useState, useEffect, useMemo } from 'react';
import Modal from '@/components/Modal';

interface Gasto {
  id: string;
  monto: number;
  categoria: string;
  descripcion: string;
  fecha: string;
}

const OPCIONES_CATEGORIA = [
  'Harina/Levadura',
  'Quesos',
  'Embutidos',
  'Salsas',
  'Vegetales',    
  'Cajas/Servilletas/Empaques',
  'Gas',    
  'Otros Gastos'
];

export default function Home() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState(OPCIONES_CATEGORIA[0]);
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // --- Estado para el Modal Personalizado ---
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    idToDelete?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  // Filtros y Paginación
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchGastos();
  }, []);

  const fetchGastos = async () => {
    setErrorMessage(null);
    try {
      const res = await fetch('/api/gastos');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Error al obtener gastos');
      setGastos(data);
    } catch (e: any) {
      setErrorMessage(e.message || 'Error de conexión con el servidor');
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!monto) return;

    setLoading(true);
    try {
      const res = await fetch('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto, categoria, descripcion }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar el registro');

      setMonto('');
      setDescripcion('');
      fetchGastos();
    } catch (e: any) {
      setErrorMessage(e.message || 'Error al intentar guardar');
    } finally {
      setLoading(false);
    }
  };

  // Abre el modal de confirmación
  const askDeleteConfirmation = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Eliminar Registro',
      message: '¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.',
      idToDelete: id,
    });
  };

  // Procesa la eliminación tras confirmar en el modal
  const handleConfirmDelete = async () => {
    const id = modalConfig.idToDelete;
    setModalConfig({ isOpen: false, title: '', message: '' });

    if (!id) return;

    setErrorMessage(null);
    try {
      const res = await fetch(`/api/gastos?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar el registro');

      fetchGastos();
    } catch (e: any) {
      setErrorMessage(e.message || 'Error al eliminar el registro');
    }
  };

  const filteredGastos = useMemo(() => {
    return gastos.filter((g) => {
      const matchesSearch = 
        g.descripcion.toLowerCase().includes(search.toLowerCase()) ||
        g.categoria.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filterCategory === 'ALL' || g.categoria === filterCategory;
      const gastoDate = new Date(g.fecha).toISOString().split('T')[0];
      const matchesStartDate = !startDate || gastoDate >= startDate;
      const matchesEndDate = !endDate || gastoDate <= endDate;

      return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
    });
  }, [gastos, search, filterCategory, startDate, endDate]);

  const totalFiltrado = useMemo(() => filteredGastos.reduce((acc, item) => acc + item.monto, 0), [filteredGastos]);
  const totalGeneral = useMemo(() => gastos.reduce((acc, item) => acc + item.monto, 0), [gastos]);

  const totalPages = Math.ceil(filteredGastos.length / itemsPerPage) || 1;
  const paginatedGastos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredGastos.slice(start, start + itemsPerPage);
  }, [filteredGastos, currentPage]);

  const resetFilters = () => {
    setSearch('');
    setFilterCategory('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="app-container">
      {/* Componente Modal Personalizado */}
      <Modal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type="confirm"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setModalConfig({ isOpen: false, title: '', message: '' })}
      />

      {/* Banner de Errores */}
      {errorMessage && (
        <div style={{
          backgroundColor: '#ef4444',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontWeight: '600',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      {/* Header */}
      <header className="top">
        <div className="brand">
          <span className="eyebrow">CasiPizza · Control Financiero</span>
          <h1>Registro de Egresos</h1>
          <p className="sub">Administra las compras operativas y mantén el control de costos.</p>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} type="button">
          <span>{theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}</span>
        </button>
      </header>

      {/* Formulario */}
      <div className="card">
        <h2><span className="n">1</span>Ingresar nuevo gasto</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="monto">Monto (Q)</label>
              <input id="monto" type="number" step="0.01" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="categoria">Categoría</label>
              <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {OPCIONES_CATEGORIA.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="descripcion">Descripción</label>
              <input id="descripcion" type="text" placeholder="Ej. Harina 13% proteína (Saco 50lb)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Guardando registro...' : 'Guardar Gasto'}
          </button>
        </form>
      </div>

      {/* Cards de Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ marginBottom: 0, textAlign: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: '600' }}>TOTAL REGISTRADO</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)', marginTop: '4px' }}>
            Q{totalGeneral.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card" style={{ marginBottom: 0, textAlign: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: '600' }}>FILTRADO ACTUAL</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
            Q{totalFiltrado.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card" style={{ marginBottom: 0, textAlign: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: '600' }}>REGISTROS VISIBLES</span>
          <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px' }}>
            {filteredGastos.length} de {gastos.length}
          </div>
        </div>
      </div>

      {/* Historial Completo y Filtros */}
      <div className="card">
        <h2><span className="n">2</span>Historial Completo de Compras</h2>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
          gap: '12px', 
          padding: '16px', 
          backgroundColor: 'rgba(255, 255, 255, 0.03)', 
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Buscar</label>
            <input type="text" placeholder="Ej. Harina, Queso..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Categoría</label>
            <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'inherit' }}>
              <option value="ALL">Todas las categorías</option>
              {OPCIONES_CATEGORIA.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Desde</label>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Hasta</label>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={resetFilters} type="button" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none', background: '#334155', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
              Limpiar
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="gastos-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>Fecha</th>
                <th style={{ width: '180px' }}>Categoría</th>
                <th>Descripción</th>
                <th style={{ textAlign: 'right', width: '120px' }}>Monto</th>
                <th style={{ textAlign: 'center', width: '60px' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGastos.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '32px 0' }}>
                    No se encontraron registros con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedGastos.map((g) => (
                  <tr key={g.id}>
                    <td style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
                      {new Date(g.fecha).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: '600' }}>{g.categoria}</td>
                    <td style={{ color: 'var(--text-dim)' }}>{g.descripcion || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent)', fontSize: '15px' }}>
                      Q{g.monto.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => askDeleteConfirmation(g.id)}
                        title="Eliminar gasto"
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Página {currentPage} de {totalPages}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'inherit', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>◀ Anterior</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'inherit', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}>Siguiente ▶</button>
            </div>
          </div>
        )}
      </div>

      <footer>CasiPizza · Sistema de Gestión Interna</footer>
    </div>
  );
}