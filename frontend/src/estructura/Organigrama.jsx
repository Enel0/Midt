import React, { useEffect, useContext, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Tree from 'react-d3-tree';
import { UserContext } from '../context/UserContext';
import { validarRutFormato, validarRutDV, formatearRut } from '../utils/cl-regiones-comunas';

const palette = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
const getColorByDepth = (depth) => palette[depth % palette.length];

const CustomNode = ({ nodeDatum, toggleNode, hierarchyPointNode, onStartDrag, onDropOnNode, onSelect, selectedId }) => {
  const depth = hierarchyPointNode?.depth ?? 0;
  const fill = getColorByDepth(depth);
  const isSelected = selectedId && (nodeDatum?.id === selectedId);

  return (
    <g
      onClick={(e) => { e.stopPropagation(); onSelect?.(nodeDatum); }}
      onMouseDown={(e) => { e.stopPropagation(); onStartDrag?.(nodeDatum); }}
      onMouseUp={(e) => { e.stopPropagation(); onDropOnNode?.(nodeDatum); }}
      style={{ cursor: 'pointer' }}
    >
      <rect x={-90} y={-28} rx={12} width={180} height={56} fill={fill} stroke={isSelected ? "#FF540C" : "#0D0A4F"} strokeWidth={isSelected ? 4 : 2} />
      <text x={0} y={-4} textAnchor="middle" fontWeight="700" fontSize="14" fill="#FFFFFF">
        {nodeDatum.name}
      </text>
      {nodeDatum.attributes?.title && (
        <text x={0} y={14} textAnchor="middle" fontSize="11" fill="#F9FAFB" opacity={0.9}>
          {nodeDatum.attributes.title}
        </text>
      )}
    </g>
  );
};

const Organigrama = () => {
  const { darkMode } = useContext(UserContext);
  const containerRef = useRef(null);
  const [translate, setTranslate] = useState({ x: 400, y: 80 });
  const [empresaRut, setEmpresaRut] = useState('');
  const [empresas, setEmpresas] = useState([]); // lista de empresas disponibles
  const [newEmpresa, setNewEmpresa] = useState('');
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    const recalc = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect?.width) setTranslate({ x: rect.width / 2, y: 90 });
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, []);

  useEffect(() => {
    const savedSel = localStorage.getItem('empresaRut');
    const savedListRaw = localStorage.getItem('empresasRut');
    let list = [];
    try { list = savedListRaw ? JSON.parse(savedListRaw) : []; } catch { list = []; }
    setEmpresas(Array.isArray(list) ? list : []);
    if (savedSel) setEmpresaRut(savedSel);
  }, []);

  // Cargar empresas permitidas para el usuario (no admin) según su RUT
  const { user } = useContext(UserContext);
  useEffect(() => {
    const loadEmpresasUsuario = async () => {
      // Si es admin, no restringimos
      if (!user || user.rol === 'admin') return;
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('http://localhost:5000/api/organigramas/mis-empresas', { headers });
        if (!res.ok) throw new Error('No se pudieron cargar tus empresas');
        const data = await res.json();
        const lista = Array.isArray(data.empresas) ? data.empresas : [];
        setEmpresas(lista);
        localStorage.setItem('empresasRut', JSON.stringify(lista));
        // Si la seleccionada no está en la lista, limpiar selección
        if (!lista.includes(empresaRut)) {
          setEmpresaRut('');
          localStorage.removeItem('empresaRut');
        }
      } catch (e) {
        // Si falla, no mostrar empresas (forzar vacío)
        setEmpresas([]);
        setEmpresaRut('');
      }
    };
    loadEmpresasUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.rol]);

  useEffect(() => {
    const fetchTree = async () => {
      if (!empresaRut) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`http://localhost:5000/api/organigramas/${encodeURIComponent(empresaRut)}/tree`);
        if (!res.ok) throw new Error('No se pudo cargar el organigrama');
        const data = await res.json();
        const normalized = Array.isArray(data)
          ? (data.length === 1 ? data[0] : { name: empresaRut, children: data })
          : data;
        setTreeData(normalized);
      } catch (e) {
        setError(e.message || 'Error cargando organigrama');
        setTreeData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, [empresaRut]);

  const linkColor = darkMode ? '#334155' : '#94a3b8';
  const containerStyles = useMemo(
    () => ({
      position: 'relative',
      width: '100%',
      height: '80vh',
      background: darkMode ? '#0b0f1a' : '#f7f9fc',
      borderRadius: '12px',
      boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.1)',
    }),
    [darkMode]
  );

  const handleAddEmpresa = () => {
    let val = (newEmpresa || '').trim();
    if (!val) return;
    if (!validarRutFormato(val) || !validarRutDV(val)) {
      alert('RUT de empresa inválido. Formato esperado 12.345.678-5');
      return;
    }
    if (!empresas.includes(val)) {
      const updated = [...empresas, val];
      setEmpresas(updated);
      localStorage.setItem('empresasRut', JSON.stringify(updated));
    }
    setEmpresaRut(val);
    localStorage.setItem('empresaRut', val);
    setNewEmpresa('');
  };

  const handleChangeEmpresa = (val) => {
    setEmpresaRut(val);
    localStorage.setItem('empresaRut', val);
  };

  const handleTreeAreaClick = () => { /* no-op: ya no abre el cuadro */ };

  const handleStartDrag = (nodeDatum) => {
    if (!nodeDatum?.id) return;
    setDraggingId(nodeDatum.id);
  };
  const handleDropOnNode = async (targetNode) => {
    if (!draggingId || !targetNode?.id) return;
    if (draggingId === targetNode.id) { setDraggingId(null); return; }
    try {
      await fetch(`http://localhost:5000/api/organigramas/nodos/${encodeURIComponent(draggingId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent: targetNode.id }),
      });
      // recargar árbol
      const res = await fetch(`http://localhost:5000/api/organigramas/${encodeURIComponent(empresaRut)}/tree`);
      if (res.ok) {
        const data = await res.json();
        const normalized = Array.isArray(data) ? (data.length === 1 ? data[0] : { name: empresaRut, children: data }) : data;
        setTreeData(normalized);
      }
    } catch (e) {
      console.error('Error al reubicar nodo', e);
    } finally {
      setDraggingId(null);
    }
  };

  const handleSelect = (nodeDatum) => {
    setSelectedNode(nodeDatum);
  };

  const [newRut, setNewRut] = useState('');
  const [newCargo, setNewCargo] = useState('');
  const refreshTree = async () => {
    if (!empresaRut) return;
    try {
      const res = await fetch(`http://localhost:5000/api/organigramas/${encodeURIComponent(empresaRut)}/tree`);
      if (res.ok) {
        const data = await res.json();
        const normalized = Array.isArray(data) ? (data.length === 1 ? data[0] : { name: empresaRut, children: data }) : data;
        setTreeData(normalized);
      }
    } catch {}
  };
  const handleAddWorker = async () => {
    if (!empresaRut || !newRut || !newCargo) return;
    try {
      const body = { empresaRut, trabajadorRut: newRut, cargo: newCargo };
      if (selectedNode?.id) body.parent = selectedNode.id;
      const res = await fetch('http://localhost:5000/api/organigramas/nodos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('No se pudo crear el nodo');
      setNewRut('');
      setNewCargo('');
      await refreshTree();
    } catch (e) {
      alert(e.message || 'Error creando nodo');
    }
  };

  const deleteSelected = async (cascade = false) => {
    if (!selectedNode?.id) return;
    const ok = window.confirm(cascade ? '¿Eliminar este nodo y todos sus descendientes?' : '¿Eliminar este nodo? (debe estar sin hijos)');
    if (!ok) return;
    try {
      const url = new URL(`http://localhost:5000/api/organigramas/nodos/${encodeURIComponent(selectedNode.id)}`);
      if (cascade) url.searchParams.set('cascade', 'true');
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar el nodo');
      setSelectedNode(null);
      await refreshTree();
    } catch (e) {
      alert(e.message);
    }
  };

  const makeSelectedRoot = async () => {
    if (!selectedNode?.id) return;
    try {
      const res = await fetch(`http://localhost:5000/api/organigramas/nodos/${encodeURIComponent(selectedNode.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent: null })
      });
      if (!res.ok) throw new Error('No se pudo mover a raíz');
      await refreshTree();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <h1 className="text-center text-4xl font-bold text-[#0D0A4F] dark:text-white mt-6 mb-4">
        Organigrama
      </h1>

      {!empresaRut && empresas.length === 0 && (
        <div className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-900 p-4 flex items-center gap-3">
          <span>No tienes empresa seleccionada.</span>
          <input
            type="text"
            value={newEmpresa}
            onChange={(e) => setNewEmpresa(e.target.value)}
            placeholder="RUT de la empresa"
            className="p-2 border rounded"
          />
          <button
            onClick={handleAddEmpresa}
            className="bg-[#FF540C] hover:bg-[#FF6A00] text-white font-semibold py-2 px-4 rounded"
          >
            Añadir empresa
          </button>
        </div>
      )}

      {(empresaRut || empresas.length > 0) && (
        <div className="w-full bg-blue-50 text-blue-900 px-4 py-2 text-sm flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span>Empresa:</span>
            <select
              className="border rounded p-1"
              value={empresaRut}
              onChange={(e) => handleChangeEmpresa(e.target.value)}
            >
              <option value="">-- Seleccionar --</option>
              {empresas.map((er) => (
                <option key={er} value={er}>{er}</option>
              ))}
            </select>
            <button
              className="text-blue-600 underline"
              onClick={() => { localStorage.removeItem('empresaRut'); setEmpresaRut(''); }}
            >
              Limpiar selección
            </button>
          </div>
          <div className="flex items-center gap-2">
            {user?.rol === 'admin' && (
              <>
                <input
                  type="text"
                  value={newEmpresa}
                  onChange={(e) => {
                    const raw = e.target.value.toUpperCase();
                    // formateo básico: solo números y K, agregar guión final
                    const clean = raw.replace(/[^\dK]/g, '');
                    let body = clean.slice(0, Math.max(0, clean.length - 1));
                    const dv = clean.slice(-1);
                    body = body.slice(0, 8);
                    let formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                    if (dv) formatted = `${formatted}-${dv}`;
                    setNewEmpresa(formatted);
                  }}
                  placeholder="Agregar nuevo RUT"
                  className="p-1 border rounded"
                  onBlur={(e)=>{ e.target.value = formatearRut(e.target.value); setNewEmpresa(e.target.value); }}
                  maxLength={12}
                />
                <button
                  onClick={handleAddEmpresa}
                  className="bg-[#FF540C] hover:bg-[#FF6A00] text-white text-sm font-semibold py-1 px-3 rounded"
                >
                  Añadir
                </button>
              </>
            )}
            <button
              className="ml-2 px-3 py-1 border rounded hover:bg-blue-100"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="menu"
              title="Menú"
            >
              ☰
            </button>
          </div>
        </div>
      )}

      {/* Barra de controles: izquierda (añadir trabajador), derecha (acciones del nodo) */}
      <div className="w-full px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {empresaRut && (
            <>
              <input
                type="text"
                value={newRut}
                onChange={(e) => setNewRut(e.target.value)}
                placeholder="RUT trabajador"
                className="p-1 border rounded text-sm"
              />
              <input
                type="text"
                value={newCargo}
                onChange={(e) => setNewCargo(e.target.value)}
                placeholder="Cargo"
                className="p-1 border rounded text-sm"
              />
              <button
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-1 px-2 rounded"
                onClick={(e) => { e.stopPropagation(); handleAddWorker(); }}
              >
                Añadir trabajador {selectedNode ? '(hijo del seleccionado)' : '(raíz)'}
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedNode && (
            <>
              <button className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded" onClick={(e) => { e.stopPropagation(); deleteSelected(false); }}>Eliminar</button>
              <button className="bg-red-700 hover:bg-red-800 text-white text-xs px-2 py-1 rounded" onClick={(e) => { e.stopPropagation(); deleteSelected(true); }}>Eliminar con hijos</button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded" onClick={(e) => { e.stopPropagation(); makeSelectedRoot(); }}>Convertir en raíz</button>
              <button
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  const params = new URLSearchParams({ empresaRut: empresaRut || '' });
                  if (selectedNode?.id) {
                    params.set('nodoId', selectedNode.id);
                    if (selectedNode.trabajadorRut) params.set('trabajadorRut', selectedNode.trabajadorRut);
                    if (selectedNode.nombreTrabajador) params.set('nombreTrabajador', selectedNode.nombreTrabajador);
                    if (selectedNode.name) params.set('cargo', selectedNode.name);
                  }
                  navigate(`/denunciar?${params.toString()}`);
                }}
              >
                Denunciar
              </button>
            </>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        style={containerStyles}
        className="overflow-hidden"
        onClick={handleTreeAreaClick}
      >
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-blue-600">Cargando organigrama...</div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-red-600">{error}</div>
        )}
        {!loading && !error && treeData && empresas.includes(empresaRut) && (
          <Tree
            data={treeData}
            orientation="vertical"
            pathFunc="diagonal"
            translate={translate}
            separation={{ siblings: 1, nonSiblings: 1.2 }}
            nodeSize={{ x: 240, y: 120 }}
            zoomable
            scaleExtent={{ min: 0.6, max: 2 }}
            transitionDuration={400}
            renderCustomNodeElement={(rd3tProps) => (
              <CustomNode
                {...rd3tProps}
                onStartDrag={handleStartDrag}
                onDropOnNode={handleDropOnNode}
                onSelect={handleSelect}
                selectedId={selectedNode?.id}
              />
            )}
            styles={{ links: { stroke: linkColor, strokeWidth: 2 } }}
          />
        )}
        {!loading && !error && (!empresaRut || !empresas.includes(empresaRut)) && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600">No tienes acceso a ninguna empresa o no hay selección.</div>
        )}

        {draggingId && (
          <div className="absolute bottom-2 left-2 bg-yellow-100 border border-yellow-300 text-yellow-900 text-xs px-2 py-1 rounded">
            Arrastrando nodo... suelta sobre otro para reubicar
          </div>
        )}

        {/* Denunciar se maneja vía página dedicada */}
        
      </div>

      {/* Drawer deslizante de menú */}
      <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg border-l transform transition-transform duration-300 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <span className="font-semibold">Menú</span>
          <button className="text-gray-600" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
        <div className="p-4 flex flex-col gap-2">
          <button className="text-left px-3 py-2 rounded hover:bg-gray-100" onClick={() => { setMenuOpen(false); navigate('/perfil'); }}>Ver perfil</button>
          <button className="text-left px-3 py-2 rounded hover:bg-gray-100" onClick={() => { setMenuOpen(false); navigate('/mis-denuncias'); }}>Mis denuncias</button>
        </div>
      </div>
    </div>
  );
};

export default Organigrama;
