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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    fetchGastos();
  }, []);

  const fetchGastos = async () => {
    try {
      const res = await fetch('/api/gastos');
      if (res.ok) {
        const data = await res.json();
        setGastos(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto) return;

    setLoading(true);
    const res = await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto, categoria, descripcion }),
    });

    if (res.ok) {
      setMonto('');
      setDescripcion('');
      fetchGastos();
    }
    setLoading(false);
  };

  const totalGastos = gastos.reduce((acc, item) => acc + item.monto, 0);

  return (
    <div className="wrap">
      {/* Header */}
      <header className="top">
        <div className="brand">
          <span className="eyebrow">CASIPIZZA · Ficha de equipo</span>
          <h1>Control de gastos</h1>
          <p className="sub">
            Registra y gestiona los egresos operativos de la pizzería en tiempo real.
          </p>
        </div>        
      </header>

      {/* Card 1: Formulario */}
      <div className="card">
        <h2>
          <span className="n">1</span>Registrar nuevo gasto
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="scale-row" style={{ marginBottom: '16px' }}>
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
                style={{
                  width: '100%',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                {OPCIONES_CATEGORIA.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="field" style={{ flex: '1.5' }}>
              <label htmlFor="descripcion">Descripción</label>
              <input
                id="descripcion"
                type="text"
                placeholder="Ej. Harina 13% proteína"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="theme-toggle"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            {loading ? 'Guardando...' : 'Guardar Gasto'}
          </button>
        </form>
      </div>

      {/* Card 2: Total */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '15px', color: 'var(--text-dim)', fontWeight: '600' }}>
          Gastos Acumulados:
        </span>
        <strong style={{ fontSize: '24px', fontFamily: "'Fraunces', serif", color: 'var(--accent)' }}>
          Q{totalGastos.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </strong>
      </div>

      {/* Card 3: Historial */}
      <div className="card">
        <h2>
          <span className="n">2</span>Historial
        </h2>

        <table className="temp-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th style={{ textAlign: 'right' }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {gastos.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px 0' }}>
                  No hay registros almacenados.
                </td>
              </tr>
            ) : (
              gastos.map((g) => (
                <tr key={g.id}>
                  <td style={{ color: 'var(--text-dim)' }}>
                    {new Date(g.fecha).toLocaleDateString()}
                  </td>
                  <td style={{ fontWeight: '600' }}>{g.categoria}</td>
                  <td style={{ color: 'var(--text-dim)' }}>{g.descripcion || '—'}</td>
                  <td className="val" style={{ color: 'var(--accent)' }}>
                    Q{g.monto.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer>CasiPizza · Control Interno de Gastos</footer>
    </div>
  );
}