-- ===================================================
-- Esquema para el Inventario de Piezas de Carro
-- Pega este script completo en Supabase > SQL Editor > New query > Run
-- ===================================================

-- Tabla principal: piezas activas en el inventario
CREATE TABLE piezas (
    id SERIAL PRIMARY KEY,           -- ID autoincremental para búsqueda rápida
    codigo TEXT UNIQUE,              -- ID/código que tú le asignas a la pieza (ej: "MOT-001")
    nombre_pieza TEXT NOT NULL,      -- nombre de la pieza (ej: "Alternador", "Radiador")
    marca TEXT NOT NULL,             -- marca del carro (ej: "Toyota")
    modelo TEXT NOT NULL,            -- modelo del carro (ej: "Corolla")
    anio INTEGER NOT NULL,           -- año del carro
    descripcion TEXT,                -- notas adicionales (opcional)
    fecha_agregado TIMESTAMP DEFAULT NOW()
);

-- Tabla de historial: piezas que fueron eliminadas/usadas
-- Mismos campos que "piezas" + fecha de eliminación
CREATE TABLE historial_piezas (
    id SERIAL PRIMARY KEY,
    id_original INTEGER,             -- el id que tenía en la tabla piezas
    codigo TEXT,
    nombre_pieza TEXT NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    anio INTEGER NOT NULL,
    descripcion TEXT,
    fecha_agregado TIMESTAMP,
    fecha_eliminado TIMESTAMP DEFAULT NOW(),
    motivo TEXT                      -- opcional: por qué se eliminó (ej: "usada", "vendida")
);

-- Índice para buscar más rápido por código o marca/modelo/año
CREATE INDEX idx_piezas_codigo ON piezas(codigo);
CREATE INDEX idx_piezas_marca_modelo_anio ON piezas(marca, modelo, anio);
