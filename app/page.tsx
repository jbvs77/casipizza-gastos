'use client';

import { useState, useEffect } from 'react';

interface Gasto {
  id: string;
  monto: number;
  categoria: string;
  descripcion: string;
  fecha: string;
}

const OPCIONES_CATEGORIA = [
  'Harina y Levadura',
  'Quesos y Lácteos',
  'Embutidos y Carnes',
  'Salsas y Empaques',
  'Servicios (Gas, Luz, Agua)',
  'Nómina / Sueldos',
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

  useEffect(() => {
    fetchGastos();
  }, []);

  const fetchGastos = async () => {
    setErrorMessage(null);
    try {
      const res = await fetch('/api/gastos');
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al obtener la lista de gastos');
      }
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

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo guardar el registro');
      }

      setMonto('');
      setDescripcion('');
      fetchGastos();
    } catch (e: any) {
      setErrorMessage(e.message || 'Ocurrió un fallo al intentar guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas borrar este registro?')) return;

    setErrorMessage(null);
    try {
      const res = await fetch(`/api/gastos?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo eliminar el registro');
      }

      fetchGastos();
    } catch (e: any) {
      setErrorMessage(e.message || 'Ocurrió un error al eliminar');
    }
  };

  const totalGastos = gastos.reduce((acc, item) => acc + item.monto, 0);

  return (
    <div className="app-container">
      {/* Banner de Errores Visibles */}
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
          <button 
            onClick={() => setErrorMessage(null)} 
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <header className="top">
        <div className="brand">
          <span className="eyebrow">CasiPizza · Control Financiero</span>
          <h1>Registro de Egresos</h1>
          <p className="sub">
            Administra las compras operativas y mantén el control de costos de la pizzería.
          </p>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} type="button">
          <span>{theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}</span>
        </button>
      </header>

      {/* Formulario */}
      <div className="card">
        <h2>
          <span className="n">1</span>Ingresar nuevo gasto
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="monto">Monto (Q)</label>
              <input
                id="monto"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="categoria">Categoría</label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {OPCIONES_CATEGORIA.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="descripcion">Descripción</label>
              <input
                id="descripcion"
                type="text"
                placeholder="Ej. Harina 13% proteína (Saco 50lb)"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Guardando registro...' : 'Guardar Gasto'}
          </button>
        </form>
      </div>

      {/* Card de Acumulado */}
      <div className="card total-card">
        <span style={{ fontSize: '16px', color: 'var(--text-dim)', fontWeight: '600' }}>
          Total Gastos Acumulados
        </span>
        <span className="total-amount">
          Q{totalGastos.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Historial */}
      <div className="card">
        <h2>
          <span className="n">2</span>Historial de compras
        </h2>

        <div className="table-wrapper">
          <table className="gastos-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Fecha</th>
                <th style={{ width: '180px' }}>Categoría</th>
                <th>Descripción</th>
                <th style={{ textAlign: 'right', width: '110px' }}>Monto</th>
                <th style={{ textAlign: 'center', width: '60px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastos.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '32px 0' }}>
                    No hay compras o gastos registrados todavía.
                  </td>
                </tr>
              ) : (
                gastos.map((g) => (
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
                        onClick={() => handleDelete(g.id)}
                        title="Eliminar registro"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
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
      </div>

      <footer>CasiPizza · Sistema de Gestión Interna</footer>
    </div>
  );
}