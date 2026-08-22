require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./supabaseClient');

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------------------
// GET /piezas -> lista todas las piezas activas
// Soporta búsqueda opcional: /piezas?buscar=texto
// ---------------------------------------------------
app.get('/piezas', async (req, res) => {
    const { buscar } = req.query;
    let query = supabase.from('piezas').select('*').order('id', { ascending: false });

    if (buscar) {
        // busca coincidencias en código, nombre, marca o modelo
        query = query.or(
            `codigo.ilike.%${buscar}%,nombre_pieza.ilike.%${buscar}%,marca.ilike.%${buscar}%,modelo.ilike.%${buscar}%`
        );
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ---------------------------------------------------
// POST /piezas -> agrega una pieza nueva
// body esperado: { codigo, nombre_pieza, marca, modelo, anio, descripcion }
// ---------------------------------------------------
app.post('/piezas', async (req, res) => {
    const { codigo, nombre_pieza, marca, modelo, anio, descripcion } = req.body;

    if (!nombre_pieza || !marca || !modelo || !anio) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: nombre_pieza, marca, modelo, anio' });
    }

    const { data, error } = await supabase
        .from('piezas')
        .insert([{ codigo, nombre_pieza, marca, modelo, anio, descripcion }])
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

// ---------------------------------------------------
// DELETE /piezas/:id -> "elimina" una pieza
// En realidad: la copia a historial_piezas y luego la borra de piezas
// body opcional: { motivo: "usada" }
// ---------------------------------------------------
app.delete('/piezas/:id', async (req, res) => {
    const { id } = req.params;
    const { motivo } = req.body || {};

    // 1. Buscar la pieza
    const { data: pieza, error: errorBuscar } = await supabase
        .from('piezas')
        .select('*')
        .eq('id', id)
        .single();

    if (errorBuscar || !pieza) {
        return res.status(404).json({ error: 'Pieza no encontrada' });
    }

    // 2. Copiarla al historial
    const { error: errorHistorial } = await supabase.from('historial_piezas').insert([{
        id_original: pieza.id,
        codigo: pieza.codigo,
        nombre_pieza: pieza.nombre_pieza,
        marca: pieza.marca,
        modelo: pieza.modelo,
        anio: pieza.anio,
        descripcion: pieza.descripcion,
        fecha_agregado: pieza.fecha_agregado,
        motivo: motivo || null
    }]);

    if (errorHistorial) return res.status(500).json({ error: errorHistorial.message });

    // 3. Borrarla de la tabla activa
    const { error: errorBorrar } = await supabase.from('piezas').delete().eq('id', id);
    if (errorBorrar) return res.status(500).json({ error: errorBorrar.message });

    res.json({ mensaje: 'Pieza movida al historial correctamente', pieza });
});

// ---------------------------------------------------
// GET /historial -> lista el historial de piezas eliminadas
// Soporta búsqueda opcional: /historial?buscar=texto
// ---------------------------------------------------
app.get('/historial', async (req, res) => {
    const { buscar } = req.query;
    let query = supabase.from('historial_piezas').select('*').order('fecha_eliminado', { ascending: false });

    if (buscar) {
        query = query.or(
            `codigo.ilike.%${buscar}%,nombre_pieza.ilike.%${buscar}%,marca.ilike.%${buscar}%,modelo.ilike.%${buscar}%`
        );
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});
// ---------------------------------------------------
// GET /por-llegar -> lista todas las piezas que van a llegar
// Soporta búsqueda opcional: /por-llegar?buscar=texto
// ---------------------------------------------------
app.get('/por-llegar', async (req, res) => {
    const { buscar } = req.query;
    let query = supabase.from('piezas_por_llegar').select('*').order('id', { ascending: false });

    if (buscar) {
        query = query.or(
            `codigo.ilike.%${buscar}%,nombre_pieza.ilike.%${buscar}%,marca.ilike.%${buscar}%,modelo.ilike.%${buscar}%`
        );
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ---------------------------------------------------
// POST /por-llegar -> agrega una pieza que va a llegar
// body esperado: { codigo, nombre_pieza, marca, modelo, anio, descripcion, fecha_llegada }
// ---------------------------------------------------
app.post('/por-llegar', async (req, res) => {
    const { codigo, nombre_pieza, marca, modelo, anio, descripcion, fecha_llegada } = req.body;

    if (!nombre_pieza || !marca || !modelo || !anio) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: nombre_pieza, marca, modelo, anio' });
    }

    const { data, error } = await supabase
        .from('piezas_por_llegar')
        .insert([{ codigo, nombre_pieza, marca, modelo, anio, descripcion, fecha_llegada: fecha_llegada || null }])
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

// ---------------------------------------------------
// POST /por-llegar/:id/entregar -> marca una pieza como entregada
// La mueve de piezas_por_llegar a historial_entregas
// body esperado: { fecha_entregado }
// ---------------------------------------------------
app.post('/por-llegar/:id/entregar', async (req, res) => {
    const { id } = req.params;
    const { fecha_entregado } = req.body || {};

    const { data: pieza, error: errorBuscar } = await supabase
        .from('piezas_por_llegar')
        .select('*')
        .eq('id', id)
        .single();

    if (errorBuscar || !pieza) {
        return res.status(404).json({ error: 'Pieza no encontrada' });
    }

    const { error: errorHistorial } = await supabase.from('historial_entregas').insert([{
        id_original: pieza.id,
        codigo: pieza.codigo,
        nombre_pieza: pieza.nombre_pieza,
        marca: pieza.marca,
        modelo: pieza.modelo,
        anio: pieza.anio,
        descripcion: pieza.descripcion,
        fecha_llegada: pieza.fecha_llegada,
        fecha_agregado: pieza.fecha_agregado,
        fecha_entregado: fecha_entregado || new Date().toISOString().split('T')[0]
    }]);

    if (errorHistorial) return res.status(500).json({ error: errorHistorial.message });

    const { error: errorBorrar } = await supabase.from('piezas_por_llegar').delete().eq('id', id);
    if (errorBorrar) return res.status(500).json({ error: errorBorrar.message });

    res.json({ mensaje: 'Pieza marcada como entregada correctamente', pieza });
});

// ---------------------------------------------------
// GET /entregas -> lista el historial de piezas entregadas
// Soporta búsqueda opcional: /entregas?buscar=texto
// ---------------------------------------------------
app.get('/entregas', async (req, res) => {
    const { buscar } = req.query;
    let query = supabase.from('historial_entregas').select('*').order('fecha_entregado', { ascending: false });

    if (buscar) {
        query = query.or(
            `codigo.ilike.%${buscar}%,nombre_pieza.ilike.%${buscar}%,marca.ilike.%${buscar}%,modelo.ilike.%${buscar}%`
        );
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});
// ---------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
