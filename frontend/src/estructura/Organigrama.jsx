import React, { useEffect, useContext, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Tree from 'react-d3-tree';
import { UserContext } from '../context/UserContext';
import { validarRutFormato, validarRutDV, formatearRut } from '../utils/cl-regiones-comunas';

const normalizeRut = (r) => (r || '').toUpperCase().replace(/[.\-]/g, '');

const palette = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
const getColorByDepth = (depth) => palette[depth % palette.length];
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const stopNativePropagation = (evt) => {
  if (!evt) return;
  evt.preventDefault?.();
  evt.stopPropagation?.();
  if (evt.nativeEvent) {
    evt.nativeEvent.preventDefault?.();
    evt.nativeEvent.stopPropagation?.();
    evt.nativeEvent.stopImmediatePropagation?.();
  }
};

const CustomNode = ({
  nodeDatum,
  hierarchyPointNode,
  onStartDrag,
  onHoverTarget,
  onHoverEnd,
  onSelect,
  selectedId,
  isDragging,
  draggingId,
  dropTargetId,
}) => {
  const depth = hierarchyPointNode?.depth ?? 0;
  const fill = getColorByDepth(depth);
  const isSelected = Boolean(selectedId && nodeDatum?.id === selectedId);
  const isDropCandidate = Boolean(isDragging && dropTargetId && nodeDatum?.id === dropTargetId && draggingId !== nodeDatum?.id);
  const strokeColor = isDropCandidate ? "#2563EB" : (isSelected ? "#FF540C" : "#0D0A4F");
  const strokeWidth = isDropCandidate ? 4 : (isSelected ? 4 : 2);

  return (
    <g
      onClick={(e) => {
        stopNativePropagation(e);
        if (!isDragging) onSelect?.(nodeDatum);
      }}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        stopNativePropagation(e);
        if (!isDragging) onStartDrag?.(e, nodeDatum);
      }}
      onMouseEnter={(e) => {
        if (!isDragging || draggingId === nodeDatum?.id) return;
        stopNativePropagation(e);
        onHoverTarget?.(nodeDatum);
      }}
      onMouseLeave={(e) => {
        if (!isDragging) return;
        stopNativePropagation(e);
        if (dropTargetId === nodeDatum?.id) onHoverEnd?.(nodeDatum);
      }}
      style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
    >
      <rect x={-90} y={-28} rx={12} width={180} height={56} fill={fill} stroke={strokeColor} strokeWidth={strokeWidth} />
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
  const MENU_OFFSET_PX = 72;
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
  const [draggingNode, setDraggingNode] = useState(null);
  const [dragPosition, setDragPosition] = useState(null);
  const [dropTargetNode, setDropTargetNode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetId, setMoveTargetId] = useState('');
  const [moveSearch, setMoveSearch] = useState('');
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [divisionRut, setDivisionRut] = useState('');
  const [divisionNombre, setDivisionNombre] = useState('');
  const [divisionCargo, setDivisionCargo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { user, logout } = useContext(UserContext);
  const isAdmin = user?.rol === 'admin';
  const isEmpresaAdmin = user?.rol === 'admin_empresa';
  const empresaAsignada = user?.empresaAdministra || '';
  const mergeEmpresasConAsignada = useCallback(
    (lista = []) => {
      const base = Array.isArray(lista) ? [...lista] : [];
      if (isEmpresaAdmin && empresaAsignada) {
        const exists = base.some((er) => normalizeRut(er) === normalizeRut(empresaAsignada));
        if (!exists) base.push(empresaAsignada);
      }
      return base;
    },
    [isEmpresaAdmin, empresaAsignada]
  );

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = () => setMenuOpen((prev) => !prev);
    window.addEventListener('toggleOrganigramaMenu', handler);
    return () => {
      window.removeEventListener('toggleOrganigramaMenu', handler);
    };
  }, []);

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
    const finalList = mergeEmpresasConAsignada(Array.isArray(list) ? list : []);
    setEmpresas(finalList);
    localStorage.setItem('empresasRut', JSON.stringify(finalList));
    if (finalList.length === 0) {
      setEmpresaRut('');
      localStorage.removeItem('empresaRut');
      return;
    }
    const fallback = isEmpresaAdmin && empresaAsignada ? empresaAsignada : finalList[0];
    const preferred = savedSel || fallback;
    const match = finalList.find((er) => normalizeRut(er) === normalizeRut(preferred));
    if (match) {
      setEmpresaRut(match);
      localStorage.setItem('empresaRut', match);
    } else {
      setEmpresaRut(fallback);
      localStorage.setItem('empresaRut', fallback);
    }
  }, [mergeEmpresasConAsignada, isEmpresaAdmin, empresaAsignada]);

  // Cargar empresas permitidas para el usuario (no admin) segun su RUT
  useEffect(() => {
    const loadEmpresasUsuario = async () => {
      if (!user || isAdmin) return;
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resMis = await fetch(`${API_BASE}/api/organigramas/mis-empresas`, { headers });
        if (resMis.status === 401) {
          alert('Tu sesion expiro o es invalida. Inicia sesion nuevamente.');
          localStorage.removeItem('token');
          localStorage.removeItem('empresaRut');
          localStorage.removeItem('empresasRut');
          window.location.href = '/login';
          return;
        }
        if (!resMis.ok) throw new Error('No se pudieron cargar tus empresas');
        const dataMis = await resMis.json();
        let listaMis = Array.isArray(dataMis.empresas) ? dataMis.empresas : [];
        listaMis = mergeEmpresasConAsignada(listaMis);
        setEmpresas(listaMis);
        localStorage.setItem('empresasRut', JSON.stringify(listaMis));
        const saved = localStorage.getItem('empresaRut');
        const defaultRut = isEmpresaAdmin && empresaAsignada ? empresaAsignada : (listaMis[0] || '');
        const prefer = saved || defaultRut;
        const match = listaMis.find((er) => normalizeRut(er) === normalizeRut(prefer));
        if (match) {
          setEmpresaRut(match);
          localStorage.setItem('empresaRut', match);
        } else if (listaMis.length > 0) {
          setEmpresaRut(listaMis[0]);
          localStorage.setItem('empresaRut', listaMis[0]);
        } else {
          setEmpresaRut('');
          localStorage.removeItem('empresaRut');
        }
      } catch (e) {
        setEmpresas([]);
        setEmpresaRut('');
        localStorage.removeItem('empresaRut');
        localStorage.removeItem('empresasRut');
      }
    };
    loadEmpresasUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.rol, mergeEmpresasConAsignada, isAdmin, isEmpresaAdmin, empresaAsignada]);

  useEffect(() => {
    const fetchTree = async () => {
      if (!empresaRut) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/api/organigramas/${encodeURIComponent(empresaRut)}/tree`);
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

  const { flatNodes, parentMap } = useMemo(() => {
    if (!treeData) return { flatNodes: [], parentMap: {} };
    const nodes = [];
    const parents = {};
    const visit = (node, depth = 0, parentId = null) => {
      if (!node) return;
      if (node.id) {
        const indent = depth > 0 ? `${'· '.repeat(depth)} ` : '';
        nodes.push({
          id: node.id,
          label: `${indent}${node.name || 'Sin cargo'}`,
          node,
          depth,
        });
        parents[node.id] = parentId;
        if (Array.isArray(node.children)) {
          node.children.forEach((child) => visit(child, depth + 1, node.id));
        }
      } else if (Array.isArray(node.children)) {
        node.children.forEach((child) => visit(child, depth, parentId));
      }
    };
    if (Array.isArray(treeData)) treeData.forEach((n) => visit(n, 0, null));
    else visit(treeData, 0, null);
    return { flatNodes: nodes, parentMap: parents };
  }, [treeData]);

  const excludedMoveIds = useMemo(() => {
    const ids = new Set();
    const walk = (node) => {
      if (!node?.id) return;
      ids.add(node.id);
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    if (selectedNode?.id) walk(selectedNode);
    return ids;
  }, [selectedNode]);

  const moveableTargets = useMemo(() => {
    return flatNodes.filter((entry) => !excludedMoveIds.has(entry.id));
  }, [flatNodes, excludedMoveIds]);

  const moveModalTitle = 'Reasignar jefe directo';

  const moveOptionsFiltered = useMemo(() => {
    const term = moveSearch.trim().toLowerCase();
    const base = [];
    if (selectedNode?.id) {
      base.push({
        id: 'root',
        label: 'Nivel raíz (sin jefe directo)',
        subtitle: 'Moverá el nodo al nivel superior',
      });
    }
    moveableTargets.forEach((opt) => {
      const subtitle = opt.node?.attributes?.title || opt.node?.trabajadorRut || '';
      base.push({
        id: opt.id,
        label: opt.label,
        subtitle,
      });
    });
    if (!term) return base;
    return base.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        (opt.subtitle || '').toLowerCase().includes(term)
    );
  }, [moveableTargets, moveSearch, selectedNode]);

  const handleAddEmpresa = async () => {
    let val = (newEmpresa || '').trim();
    if (!val) return;
    if (!validarRutFormato(val) || !validarRutDV(val)) {
      alert('RUT de empresa invalido. Formato esperado 12.345.678-5');
      return;
    }
    if (user && !isAdmin) {
      const mismoRut = isEmpresaAdmin && empresaAsignada && normalizeRut(val) === normalizeRut(empresaAsignada);
      if (!mismoRut) {
        alert('Solo puedes ver empresas donde tu RUT aparece en el organigrama. Pide a un administrador que te agregue.');
        return;
      }
    }
    if (!empresas.some((er) => normalizeRut(er) === normalizeRut(val))) {
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

  const handleStartDrag = (event, nodeDatum) => {
    if (!nodeDatum?.id) return;
    setDraggingId(nodeDatum.id);
    setDraggingNode(nodeDatum);
    setDragPosition({ x: event.clientX, y: event.clientY });
    setDropTargetNode(null);
    setIsDragging(true);
  };

  const handleDropOnNode = useCallback(async (targetNode) => {
    if (!draggingId || !targetNode?.id) {
      setDraggingId(null);
      return;
    }
    if (draggingId === targetNode.id) {
      setDraggingId(null);
      return;
    }
    try {
      await fetch(`${API_BASE}/api/organigramas/nodos/${encodeURIComponent(draggingId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent: targetNode.id }),
      });
      // recargar árbol
      const res = await fetch(`${API_BASE}/api/organigramas/${encodeURIComponent(empresaRut)}/tree`);
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
  }, [draggingId, empresaRut]);

  const clearDragVisuals = useCallback(() => {
    setIsDragging(false);
    setDraggingNode(null);
    setDropTargetNode(null);
    setDragPosition(null);
  }, []);

  const finalizeDrag = useCallback(() => {
    if (dropTargetNode && dropTargetNode.id && draggingId && dropTargetNode.id !== draggingId) {
      handleDropOnNode(dropTargetNode);
    } else {
      setDraggingId(null);
    }
    clearDragVisuals();
  }, [dropTargetNode, draggingId, handleDropOnNode, clearDragVisuals]);

  useEffect(() => {
    if (!isDragging) return undefined;
    const handleMove = (evt) => {
      evt.preventDefault();
      setDragPosition({ x: evt.clientX, y: evt.clientY });
    };
    const handleUp = (evt) => {
      evt.preventDefault();
      finalizeDrag();
    };
    const handleKey = (evt) => {
      if (evt.key === 'Escape') {
        evt.preventDefault();
        setDraggingId(null);
        clearDragVisuals();
      }
    };
    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleUp, { passive: false });
    window.addEventListener('keydown', handleKey);
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('keydown', handleKey);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
    };
  }, [isDragging, finalizeDrag, clearDragVisuals]);

  const handleHoverTarget = useCallback((nodeDatum) => {
    setDropTargetNode(nodeDatum);
  }, []);

  const handleHoverLeave = useCallback((nodeDatum) => {
    setDropTargetNode((current) => {
      if (!current) return current;
      if (nodeDatum?.id === current.id) return null;
      return current;
    });
  }, []);

  const handleSelect = (nodeDatum) => {
    setSelectedNode(nodeDatum);
  };

  const [newRut, setNewRut] = useState('');
  const [newCargo, setNewCargo] = useState('');
  const refreshTree = async () => {
    if (!empresaRut) return;
    try {
      const res = await fetch(`${API_BASE}/api/organigramas/${encodeURIComponent(empresaRut)}/tree`);
      if (res.ok) {
        const data = await res.json();
        const normalized = Array.isArray(data) ? (data.length === 1 ? data[0] : { name: empresaRut, children: data }) : data;
        setTreeData(normalized);
      }
    } catch {}
  };

  const patchNodeParent = useCallback(async (nodeId, parentId) => {
    if (!nodeId) throw new Error('Nodo inválido');
    const res = await fetch(`${API_BASE}/api/organigramas/nodos/${encodeURIComponent(nodeId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent: parentId ?? null }),
    });
    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }
    if (!res.ok) {
      const message = data?.message || 'No se pudo actualizar el nodo';
      throw new Error(message);
    }
    await refreshTree();
  }, [refreshTree]);

  const openMoveModal = () => {
    if (!selectedNode?.id) {
      alert('Selecciona un nodo primero.');
      return;
    }
    setMoveSearch('');
    setMoveTargetId('');
    setShowMoveModal(true);
  };

  const closeMoveModal = () => {
    if (actionLoading) return;
    setShowMoveModal(false);
    setMoveTargetId('');
    setMoveSearch('');
  };

  const handleConfirmMove = async () => {
    if (!selectedNode?.id || !moveTargetId) return;
    setActionLoading(true);
    try {
      const parentId = moveTargetId === 'root' ? null : moveTargetId;
      await patchNodeParent(selectedNode.id, parentId);
      setShowMoveModal(false);
      setMoveTargetId('');
    } catch (err) {
      alert(err.message || 'No se pudo mover el nodo');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromoteLevel = async () => {
    if (!selectedNode?.id) return;
    const parentId = parentMap[selectedNode.id];
    if (!parentId) {
      alert('Este nodo ya está en el nivel raíz.');
      return;
    }
    const grandParentId = parentMap[parentId] || null;
    setActionLoading(true);
    try {
      await patchNodeParent(selectedNode.id, grandParentId);
    } catch (err) {
      alert(err.message || 'No se pudo subir de nivel');
    } finally {
      setActionLoading(false);
    }
  };

  const openDivisionModal = () => {
    if (!selectedNode?.id) {
      alert('Selecciona un nodo para crearle una división por encima.');
      return;
    }
    setDivisionRut('');
    setDivisionNombre('');
    setDivisionCargo('');
    setShowDivisionModal(true);
  };

  const handleCreateDivision = async () => {
    if (!empresaRut || !selectedNode?.id) return;
    const rut = formatearRut(divisionRut || '');
    if (!rut || !validarRutFormato(rut) || !validarRutDV(rut)) {
      alert('Ingresa un RUT válido para la nueva división.');
      return;
    }
    if (!divisionCargo.trim()) {
      alert('Define un cargo/nombre para la división.');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        empresaRut,
        trabajadorRut: rut,
        cargo: divisionCargo.trim(),
        parent: parentMap[selectedNode.id] || null,
      };
      if (divisionNombre.trim()) payload.nombreTrabajador = divisionNombre.trim();
      const res = await fetch(`${API_BASE}/api/organigramas/nodos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let data = null;
      try {
        data = await res.json();
      } catch (_) {
        data = null;
      }
      if (!res.ok) {
        const message = data?.message || 'No se pudo crear la división';
        throw new Error(message);
      }
      const nuevoId = data?._id;
      if (!nuevoId) throw new Error('Respuesta del servidor inválida al crear la división.');
      await patchNodeParent(selectedNode.id, nuevoId);
      setShowDivisionModal(false);
      setDivisionRut('');
      setDivisionNombre('');
      setDivisionCargo('');
    } catch (err) {
      alert(err.message || 'No se pudo crear la nueva división');
    } finally {
      setActionLoading(false);
    }
  };
  const handleAddWorker = async () => {
    if (!empresaRut || !newRut || !newCargo) return;
    if (!validarRutFormato(newRut) || !validarRutDV(newRut)) {
      alert('RUT de trabajador inválido. Formato esperado 12.345.678-5');
      return;
    }
    try {
      const body = { empresaRut, trabajadorRut: newRut, cargo: newCargo };
      if (selectedNode?.id) body.parent = selectedNode.id;
      const res = await fetch(`${API_BASE}/api/organigramas/nodos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('No se pudo crear el nodo');
      setNewRut('');
      setNewCargo('');
      // Si el RUT recién añadido coincide con el del usuario, asegurar que la empresa se cargue automáticamente en la lista
      if (user?.rut && normalizeRut(user.rut) === normalizeRut(body.trabajadorRut)) {
        const exists = empresas.some(er => normalizeRut(er) === normalizeRut(empresaRut));
        if (!exists) {
          const updated = [...empresas, empresaRut];
          setEmpresas(updated);
          localStorage.setItem('empresasRut', JSON.stringify(updated));
        }
        setEmpresaRut(empresaRut);
        localStorage.setItem('empresaRut', empresaRut);
      }
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
      const url = new URL(`${API_BASE}/api/organigramas/nodos/${encodeURIComponent(selectedNode.id)}`);
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
      const res = await fetch(`${API_BASE}/api/organigramas/nodos/${encodeURIComponent(selectedNode.id)}`, {
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
      <div className="px-4 mt-6 mb-4 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-center w-full text-[#0D0A4F] dark:text-white mb-2">
          Organigrama
        </h1>
      </div>

      {!empresaRut && empresas.length === 0 && (
        isEmpresaAdmin ? (
          <div className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-900 p-4 flex flex-col gap-3">
            <p>
              No tienes empresa seleccionada. Fuiste asignado como administrador del organigrama de{' '}
              <strong>{empresaAsignada ? formatearRut(empresaAsignada) : 'una empresa pendiente'}</strong>.
            </p>
            <button
              onClick={() => {
                if (!empresaAsignada) {
                  alert('Aun no tienes una empresa asignada. Solicitala al administrador principal.');
                  return;
                }
                if (!empresas.some((er) => normalizeRut(er) === normalizeRut(empresaAsignada))) {
                  const updated = [...empresas, empresaAsignada];
                  setEmpresas(updated);
                  localStorage.setItem('empresasRut', JSON.stringify(updated));
                }
                setEmpresaRut(empresaAsignada);
                localStorage.setItem('empresaRut', empresaAsignada);
              }}
              className="bg-[#FF540C] hover:bg-[#FF6A00] text-white font-semibold py-2 px-4 rounded max-w-fit"
            >
              Cargar mi organigrama
            </button>
          </div>
        ) : (
          <div className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-900 p-4 flex items-center gap-3">
            <span>No tienes empresa seleccionada.</span>
            {isAdmin ? (
              <>
                <input
                  type="text"
                  value={newEmpresa}
                  onChange={(e) => {
                    const raw = e.target.value.toUpperCase();
                    const clean = raw.replace(/[^\dK]/g, '');
                    let body = clean.slice(0, Math.max(0, clean.length - 1));
                    const dv = clean.slice(-1);
                    body = body.slice(0, 8);
                    let formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                    if (dv) formatted = `${formatted}-${dv}`;
                    setNewEmpresa(formatted);
                  }}
                  placeholder="RUT de la empresa"
                  className="p-2 border rounded"
                  maxLength={12}
                  onBlur={(e)=>{ const f = formatearRut(e.target.value); setNewEmpresa(f); e.target.value=f; }}
                />
                <button
                  onClick={handleAddEmpresa}
                  className="bg-[#FF540C] hover:bg-[#FF6A00] text-white font-semibold py-2 px-4 rounded"
                >
                  Anadir empresa
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={newEmpresa}
                  onChange={(e) => {
                    const raw = e.target.value.toUpperCase();
                    const clean = raw.replace(/[^\dK]/g, '');
                    let body = clean.slice(0, Math.max(0, clean.length - 1));
                    const dv = clean.slice(-1);
                    body = body.slice(0, 8);
                    let formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                    if (dv) formatted = `${formatted}-${dv}`;
                    setNewEmpresa(formatted);
                  }}
                  placeholder="RUT de la empresa"
                  className="p-2 border rounded"
                  maxLength={12}
                  onBlur={(e)=>{ const f = formatearRut(e.target.value); setNewEmpresa(f); e.target.value=f; }}
                />
                <input
                  type="text"
                  value={newCargo}
                  onChange={(e)=> setNewCargo(e.target.value)}
                  placeholder="Tu cargo propuesto"
                  className="p-2 border rounded"
                />
                <button
                  onClick={async ()=>{
                    if (!validarRutFormato(newEmpresa) || !validarRutDV(newEmpresa)) { alert('RUT invalido'); return; }
                    if (!newCargo) { alert('Ingresa un cargo'); return; }
                    try {
                      const token = localStorage.getItem('token');
                      const headers = { 'Content-Type': 'application/json' };
                      if (token) headers['Authorization'] = `Bearer ${token}`;
                      const resp = await fetch(`${API_BASE}/api/organigramas/solicitudes`, {
                        method: 'POST', headers, body: JSON.stringify({ empresaRut: newEmpresa, cargoPropuesto: newCargo })
                      });
                      if (resp.status === 401) {
                        alert('Tu sesion expiro o es invalida. Inicia sesion nuevamente.');
                        localStorage.removeItem('token');
                        localStorage.removeItem('empresaRut');
                        localStorage.removeItem('empresasRut');
                        window.location.href = '/login';
                        return;
                      }
                      const data = await resp.json();
                      if (!resp.ok) throw new Error(data.message || 'No se pudo crear la solicitud');
                      if (data.autoAprobada) {
                        const token2 = localStorage.getItem('token');
                        const headers2 = token2 ? { Authorization: `Bearer ${token2}` } : {};
                        const resMis = await fetch(`${API_BASE}/api/organigramas/mis-empresas`, { headers: headers2 });
                        if (resMis.status === 401) {
                          alert('Tu sesion expiro o es invalida. Inicia sesion nuevamente.');
                          localStorage.removeItem('token');
                          localStorage.removeItem('empresaRut');
                          localStorage.removeItem('empresasRut');
                          window.location.href = '/login';
                          return;
                        }
                        const dataMis = await resMis.json();
                        const listaMis = Array.isArray(dataMis.empresas) ? dataMis.empresas : [];
                        setEmpresas(listaMis);
                        localStorage.setItem('empresasRut', JSON.stringify(listaMis));
                      }
                      alert('Solicitud enviada');
                    } catch (error) {
                      alert(error.message || 'No se pudo crear la solicitud');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                >
                  Solicitar unirme
                </button>
              </div>
            )}
          </div>
        )
      )}

      {(isAdmin || empresas.length > 0 || empresaRut) && (
        <section className="w-full px-4 pb-4">
          <div className={`grid gap-4 ${empresaRut ? 'lg:[grid-template-columns:0.95fr_1.05fr]' : ''}`}>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 shadow-sm p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                {isAdmin && (
                  <div className="flex-1 lg:max-w-sm">
                    <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      RUT de empresa nueva
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={newEmpresa}
                        onChange={(e) => {
                          const raw = e.target.value.toUpperCase();
                          const clean = raw.replace(/[^\dK]/g, '');
                          let body = clean.slice(0, Math.max(0, clean.length - 1));
                          const dv = clean.slice(-1);
                          body = body.slice(0, 8);
                          let formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                          if (dv) formatted = `${formatted}-${dv}`;
                          setNewEmpresa(formatted);
                        }}
                        placeholder="12.345.678-9"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF540C]"
                        onBlur={(e)=>{ e.target.value = formatearRut(e.target.value); setNewEmpresa(e.target.value); }}
                        maxLength={12}
                      />
                      <button
                        type="button"
                        onClick={handleAddEmpresa}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-xl font-semibold text-white bg-[#FF540C] hover:bg-[#FF6A00] shadow-sm transition-colors"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-[220px]">
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Seleccionar empresa
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      className="flex-1 min-w-[160px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={empresaRut}
                      onChange={(e) => handleChangeEmpresa(e.target.value)}
                    >
                      <option value="">-- Seleccionar --</option>
                      {empresas.map((er) => (
                        <option key={er} value={er}>{formatearRut(er)}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 disabled:text-slate-200 px-4 py-2 rounded-xl transition"
                      disabled={!empresaRut}
                      onClick={() => { localStorage.removeItem('empresaRut'); setEmpresaRut(''); }}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {empresaRut && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 shadow-sm p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      RUT del trabajador
                    </label>
                    <input
                      type="text"
                      value={newRut}
                      onChange={(e) => {
                        const raw = e.target.value.toUpperCase();
                        const clean = raw.replace(/[^\dK]/g, '');
                        let body = clean.slice(0, Math.max(0, clean.length - 1));
                        const dv = clean.slice(-1);
                        body = body.slice(0, 8);
                        let formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                        if (dv) formatted = `${formatted}-${dv}`;
                        setNewRut(formatted);
                      }}
                      placeholder="12.345.678-9"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      maxLength={12}
                      onBlur={(e)=>{ const f = formatearRut(e.target.value); setNewRut(f); e.target.value=f; }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={newCargo}
                      onChange={(e) => setNewCargo(e.target.value)}
                      placeholder="Ej: Gerente de operaciones"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <button
                    type="button"
                    className="w-full md:w-auto inline-flex items-center justify-center px-5 py-2 rounded-xl font-semibold text-white bg-[#FF540C] hover:bg-[#FF6A00] shadow-sm transition-colors"
                    onClick={(e) => { e.stopPropagation(); handleAddWorker(); }}
                  >
                    Agregar trabajador
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
      {/* Acciones sobre el nodo seleccionado */}
      <div className="w-full px-4 pb-2 flex items-center justify-end gap-2 flex-wrap">
        {selectedNode && (
          <>
            <button className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded" onClick={(e) => { e.stopPropagation(); deleteSelected(false); }}>Eliminar</button>
            <button className="bg-red-700 hover:bg-red-800 text-white text-xs px-2 py-1 rounded" onClick={(e) => { e.stopPropagation(); deleteSelected(true); }}>Eliminar nodo y equipo</button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded" onClick={(e) => { e.stopPropagation(); makeSelectedRoot(); }}>Mover al nivel superior</button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2 py-1 rounded" onClick={(e) => { e.stopPropagation(); openMoveModal(); }}>Reasignar jefe</button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded disabled:opacity-50" disabled={actionLoading} onClick={(e) => { e.stopPropagation(); handlePromoteLevel(); }}>Subir un nivel</button>
            <button
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                const params = new URLSearchParams({ empresaRut: empresaRut || '' });
                if (selectedNode?.id) {
                  params.set('nodoId', selectedNode.id);
                  if (selectedNode.trabajadorRut) params.set('trabajadorRut', selectedNode.trabajadorRut);
                  const nombreDesdeTitulo = selectedNode.attributes?.title;
                  const nombreAuto = selectedNode.nombreTrabajador
                    || (nombreDesdeTitulo && nombreDesdeTitulo !== selectedNode.trabajadorRut
                      ? nombreDesdeTitulo
                      : '');
                  if (typeof nombreAuto === 'string' && nombreAuto.trim()) {
                    params.set('nombreTrabajador', nombreAuto.trim());
                  }
                  if (selectedNode.name) params.set('cargo', selectedNode.name);
                }
                navigate(`/denunciar?${params.toString()}`);
              }}
            >
              Denunciar
            </button>
            <button className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-2 py-1 rounded" onClick={(e) => { e.stopPropagation(); openDivisionModal(); }}>Crear division</button>
          </>
        )}
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
        {!loading && !error && treeData && empresas.some(er => normalizeRut(er) === normalizeRut(empresaRut)) && (
          <div className="relative w-full h-full">
            <Tree
              key={isDragging ? 'dragging-tree' : 'idle-tree'}
              data={treeData}
              orientation="vertical"
              pathFunc="diagonal"
              translate={translate}
              separation={{ siblings: 1, nonSiblings: 1.2 }}
              nodeSize={{ x: 240, y: 120 }}
              zoomable={!isDragging}
              scaleExtent={{ min: 0.6, max: 2 }}
              transitionDuration={400}
              renderCustomNodeElement={(rd3tProps) => (
                <CustomNode
                  {...rd3tProps}
                  onStartDrag={handleStartDrag}
                  onHoverTarget={handleHoverTarget}
                  onHoverEnd={handleHoverLeave}
                  onSelect={handleSelect}
                  selectedId={selectedNode?.id}
                  isDragging={isDragging}
                  draggingId={draggingId}
                  dropTargetId={dropTargetNode?.id}
                />
              )}
              styles={{ links: { stroke: linkColor, strokeWidth: 2 } }}
            />
            {isDragging && (
              <div
                className="absolute inset-0"
                style={{ cursor: 'grabbing' }}
                onMouseMove={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  finalizeDrag();
                }}
              />
            )}
          </div>
        )}
        {!loading && !error && (!empresaRut || !empresas.some(er => normalizeRut(er) === normalizeRut(empresaRut))) && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600">No tienes acceso a ninguna empresa o no hay selección.</div>
        )}

        {draggingId && (
          <div className="absolute bottom-2 left-2 bg-yellow-100 border border-yellow-300 text-yellow-900 text-xs px-2 py-1 rounded shadow">
            Arrastrando {draggingNode?.name || 'trabajador'} — suelta sobre otro nodo para cambiarlo de equipo (Esc para cancelar)
          </div>
        )}

        {/* Denunciar se maneja vía página dedicada */}
        
      </div>

      {/* Drawer deslizante de menú */}
      <div
        className={`fixed right-0 w-64 bg-white shadow-lg border-l transform transition-transform duration-300 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ top: `${MENU_OFFSET_PX}px`, height: `calc(100% - ${MENU_OFFSET_PX}px)` }}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <span className="font-semibold">Menú</span>
          <button className="text-gray-600" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
        <div className="p-4 flex flex-col gap-2">
          <button className="text-left px-3 py-2 rounded hover:bg-gray-100" onClick={() => { setMenuOpen(false); navigate('/perfil'); }}>Ver perfil</button>
          <button className="text-left px-3 py-2 rounded hover:bg-gray-100" onClick={() => { setMenuOpen(false); navigate('/mis-denuncias'); }}>Mis denuncias</button>
          <button
            className="text-left px-3 py-2 rounded hover:bg-gray-100 text-red-600"
            onClick={() => {
              setMenuOpen(false);
              logout();
              navigate('/login');
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
      {isDragging && draggingNode && dragPosition && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg shadow-lg bg-[#0D0A4F] text-white text-xs"
          style={{ left: `${dragPosition.x + 12}px`, top: `${dragPosition.y + 12}px` }}
        >
          <div className="font-semibold">{draggingNode.name}</div>
          {draggingNode.attributes?.title && (
            <div className="opacity-80 text-[10px]">{draggingNode.attributes.title}</div>
          )}
          <div className="opacity-70 text-[10px] mt-1">Arrastra y suelta para reubicar</div>
        </div>
      )}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeMoveModal}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">{moveModalTitle}</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={closeMoveModal}>✕</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600">
                Selecciona el nuevo jefe para <span className="font-semibold">{selectedNode?.name}</span>. Sólo se muestran cargos válidos para evitar ciclos.
              </p>
              <input
                type="text"
                value={moveSearch}
                onChange={(e) => setMoveSearch(e.target.value)}
                placeholder="Buscar por cargo o RUT"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={moveTargetId}
                onChange={(e) => setMoveTargetId(e.target.value)}
              >
                <option value="">Selecciona el nuevo jefe</option>
                {moveOptionsFiltered.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}{opt.subtitle ? ` — ${opt.subtitle}` : ''}
                  </option>
                ))}
              </select>
              {moveOptionsFiltered.length === 0 && (
                <div className="text-xs text-rose-500">No hay destinos disponibles para esta operación.</div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              <button className="px-4 py-2 text-sm rounded border" onClick={closeMoveModal}>
                Cancelar
              </button>
              <button
                className="px-4 py-2 text-sm rounded bg-indigo-600 text-white disabled:opacity-50"
                onClick={handleConfirmMove}
                disabled={!moveTargetId || actionLoading}
              >
                {actionLoading ? 'Aplicando...' : 'Confirmar movimiento'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showDivisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { if (!actionLoading) setShowDivisionModal(false); }}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Crear nueva división para {selectedNode?.name}</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => { if (!actionLoading) setShowDivisionModal(false); }}>✕</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600">
                Se creará un nuevo nodo al mismo nivel que <strong>{selectedNode?.name}</strong> y luego se moverá este trabajador dentro de esa división.
              </p>
              <input
                type="text"
                value={divisionRut}
                onChange={(e) => setDivisionRut(e.target.value.toUpperCase())}
                onBlur={(e) => { const formatted = formatearRut(e.target.value); setDivisionRut(formatted); e.target.value = formatted; }}
                placeholder="RUT del responsable de la división"
                className="w-full border rounded px-3 py-2 text-sm"
                maxLength={12}
              />
              <input
                type="text"
                value={divisionNombre}
                onChange={(e) => setDivisionNombre(e.target.value)}
                placeholder="Nombre del responsable (opcional)"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={divisionCargo}
                onChange={(e) => setDivisionCargo(e.target.value)}
                placeholder="Cargo / nombre de la división"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <div className="text-xs text-gray-500">
                El nuevo nodo se insertará por encima del trabajador seleccionado para generar un nivel adicional en la jerarquía.
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              <button className="px-4 py-2 text-sm rounded border" onClick={() => { if (!actionLoading) setShowDivisionModal(false); }}>
                Cancelar
              </button>
              <button
                className="px-4 py-2 text-sm rounded bg-teal-600 text-white disabled:opacity-50"
                onClick={handleCreateDivision}
                disabled={actionLoading}
              >
                {actionLoading ? 'Creando...' : 'Crear división'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organigrama;
