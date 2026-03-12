#!/usr/bin/env node
/**
 * scripts/audit-supabase-schema.mjs
 * Auditoría de sincronización entre el código y el esquema de Supabase.
 *
 * Detecta en código: .from('tabla'), table: 'tabla', .select("col1,col2"),
 * relaciones embebidas (tabla!inner(...)), y accesos row.col / item.col.
 * Opcionalmente consulta information_schema vía Supabase y compara.
 *
 * Uso (PowerShell):
 *   $env:SUPABASE_URL="https://xxx.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."; node scripts/audit-supabase-schema.mjs
 *
 * Salida: docs/audits/supabase-schema-audit.md y .json
 *
 * Modo offline: si existen docs/audits/supabase-tables.json y docs/audits/supabase-columns.json,
 * se usan como fuente de verdad para comparar (sin llamar a Supabase).
 *
 * Formato esperado (ejemplo):
 *   supabase-tables.json:
 *     [ { "table_name": "devices" }, { "table_name": "device_positions" }, { "table_name": "device_events" } ]
 *   supabase-columns.json:
 *     [ { "table_name": "devices", "column_name": "id" }, { "table_name": "devices", "column_name": "name" }, ... ]
 *
 * Orden de resolución del esquema: 1) JSON en docs/audits (si ambos existen), 2) API Supabase (si hay URL+key), 3) solo código.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SCAN_DIRS = ['src', 'server', 'core', 'app', 'scripts'];
const IGNORE_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage', '.turbo', '.vercel']);
const IGNORE_FILES = new Set(['scripts/audit-supabase-schema.mjs']);

// --- 1) Recorrer carpetas y leer archivos ---
function* walk(dir, base = ROOT) {
  const full = path.join(base, dir);
  if (!fs.existsSync(full) || !fs.statSync(full).isDirectory()) return;
  const entries = fs.readdirSync(full, { withFileTypes: true });
  for (const e of entries) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (IGNORE_DIRS.has(e.name)) continue;
      yield* walk(rel, base);
    } else if (/\.(js|jsx|mjs|ts|tsx)$/.test(e.name)) {
      const normalized = path.relative(base, path.join(base, rel)).replace(/\\/g, '/');
      if (!IGNORE_FILES.has(normalized)) yield path.join(base, rel);
    }
  }
}

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

// --- 2) Extraer tablas y columnas del código ---

// .from('tabla') .from("tabla") .from(`tabla`)
const RE_FROM = /\.from\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;

// table: 'tabla' (realtime)
const RE_TABLE_KEY = /table\s*:\s*['"`]([^'"`]+)['"`]/g;

// Constantes tipo TABLE = 'x' o POSITIONS_TABLE = 'y' en el mismo archivo (para resolver .from(VAR))
const RE_TABLE_CONST = /(?:const|let)\s+(\w+)\s*=\s*['"`]([^'"`]+)['"`]\s*[;\n]/g;

// .select("id,name,last_latitude") o .select('id','name') o .select(`a`,`b`)
const RE_SELECT_STR = /\.select\s*\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*\{[^)]*\})?\s*\)/g;
const RE_SELECT_MULTI = /\.select\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*['"`]([^'"`]*)['"`])*\s*\)/g;

// Relaciones embebidas: devices!inner(...) vehicles(...) algo!left(...)
const RE_RELATION = /(\w+)(?:\s*!\s*(?:inner|left|right)?)\s*\(\s*[^)]*\)/g;

// row.xxx item.xxx (solo en archivos que contienen .from( para reducir ruido)
const RE_ROW_FIELD = /\b(?:row|item|payload\.new|payload\.old)\s*\.\s*(\w+)/g;

function extractTableConstants(content) {
  const map = new Map();
  let m;
  RE_TABLE_CONST.lastIndex = 0;
  while ((m = RE_TABLE_CONST.exec(content)) !== null) {
    map.set(m[1], m[2]);
  }
  return map;
}

function extractTablesAndColumns(filePath, content) {
  const tables = new Map(); // tableName -> { files: Set, columns: Set }
  const constants = extractTableConstants(content);
  const relPath = path.relative(ROOT, filePath);

  const addTable = (name, file) => {
    const n = name.trim();
    if (!n || n.includes('${') || /^[^a-zA-Z_]/.test(n)) return; // excluir template literals y no identificadores
    if (!tables.has(n)) tables.set(n, { files: new Set(), columns: new Set() });
    tables.get(n).files.add(file);
  };

  const addColumns = (tableName, cols) => {
    const n = tableName.trim();
    if (!n) return;
    if (!tables.has(n)) tables.set(n, { files: new Set(), columns: new Set() });
    const colSet = tables.get(n).columns;
    for (const c of cols) if (c.trim()) colSet.add(c.trim());
  };

  const resolveTable = (token) => (constants.get(String(token).trim()) ?? String(token).trim());

  // 1) .from('tabla') y .from(VAR)
  let match;
  RE_FROM.lastIndex = 0;
  while ((match = RE_FROM.exec(content)) !== null) addTable(match[1], relPath);
  const fromVar = /\.from\s*\(\s*(\w+)\s*\)/g;
  while ((match = fromVar.exec(content)) !== null) addTable(resolveTable(match[1]), relPath);

  // 2) table: 'tabla'
  RE_TABLE_KEY.lastIndex = 0;
  while ((match = RE_TABLE_KEY.exec(content)) !== null) addTable(match[1], relPath);

  // 3) Relaciones embebidas en .select
  RE_RELATION.lastIndex = 0;
  while ((match = RE_RELATION.exec(content)) !== null) addTable(match[1], relPath);

  // 4) Cadenas .from(...).select(...) para asociar columnas a la tabla correcta
  const chainRe = /\.from\s*\(\s*['"`]?([^'"`)]+)['"`]?\s*\)\s*\.\s*select\s*\(\s*['"`]([^'"`]*)['"`]/g;
  while ((match = chainRe.exec(content)) !== null) {
    const tableName = resolveTable(match[1].trim());
    const sel = match[2];
    if (sel !== '*') {
      const cols = sel.split(',').map((c) => c.trim()).filter(Boolean);
      addTable(tableName, relPath);
      addColumns(tableName, cols);
    } else {
      addTable(tableName, relPath);
    }
  }
  // .from(VAR).select(...)
  const chainVarRe = /\.from\s*\(\s*(\w+)\s*\)\s*\.\s*select\s*\(\s*['"`]([^'"`]*)['"`]/g;
  while ((match = chainVarRe.exec(content)) !== null) {
    const tableName = resolveTable(match[1]);
    const sel = match[2];
    if (sel !== '*') {
      const cols = sel.split(',').map((c) => c.trim()).filter(Boolean);
      addTable(tableName, relPath);
      addColumns(tableName, cols);
    } else {
      addTable(tableName, relPath);
    }
  }
  // .select("a,b,c") suelto: asociar a la última tabla antes en el archivo
  RE_SELECT_STR.lastIndex = 0;
  const allFroms = [...content.matchAll(/\.from\s*\(\s*['"`]?([^'"`)]+)['"`]?\s*\)|\.from\s*\(\s*(\w+)\s*\)/g)];
  while ((match = RE_SELECT_STR.exec(content)) !== null) {
    const str = match[1];
    if (str === '*') continue;
    const cols = str.split(',').map((c) => c.trim()).filter(Boolean);
    const lastFrom = allFroms.filter((m) => m.index < match.index).pop();
    const tableName = lastFrom ? resolveTable((lastFrom[1] || lastFrom[2] || '').trim()) : null;
    if (tableName) addColumns(tableName, cols);
    else for (const t of tables.keys()) addColumns(t, cols);
  }

  // 5) row.xxx, item.xxx en archivos que usan .from (heurística: repartir en todas las tablas del archivo)
  if (/\.from\s*\(/.test(content)) {
    RE_ROW_FIELD.lastIndex = 0;
    while ((match = RE_ROW_FIELD.exec(content)) !== null) {
      const col = match[1];
      for (const t of tables.keys()) tables.get(t).columns.add(col);
    }
  }

  return tables;
}

function mergeTables(acc, filePath, fileTables) {
  for (const [tableName, data] of fileTables) {
    if (!acc.has(tableName)) acc.set(tableName, { files: new Set(), columns: new Set() });
    const cur = acc.get(tableName);
    for (const f of data.files) cur.files.add(f);
    for (const c of data.columns) cur.columns.add(c);
  }
}

// --- 3) Esquema: JSON offline o API Supabase ---
const AUDITS_DIR = path.join(ROOT, 'docs', 'audits');
const TABLES_JSON = path.join(AUDITS_DIR, 'supabase-tables.json');
const COLUMNS_JSON = path.join(AUDITS_DIR, 'supabase-columns.json');

/**
 * Normaliza JSON exportado por Supabase (json_agg u otros) a un array de filas.
 * Formatos soportados (igual para supabase-tables.json y supabase-columns.json):
 *   - Array plano: [ { "table_name": "devices" }, ... ]
 *   - Array con wrapper: [ { "json_agg": [ { "table_name": "devices" } ] } ]
 *   - Objeto: { "data": [ ... ] }  o  { "json_agg": [ ... ] }
 * Para columnas cada elemento debe tener table_name y column_name.
 * @param {unknown} parsed
 * @returns {Array<Record<string, unknown>>}
 */
function normalizeJsonExport(parsed) {
  if (!parsed || typeof parsed !== 'object') return [];
  if (!Array.isArray(parsed)) {
    const obj = parsed;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.json_agg)) return obj.json_agg;
    return [];
  }
  if (parsed.length === 0) return [];
  const first = parsed[0];
  if (first && typeof first === 'object' && Array.isArray(first.json_agg)) {
    return parsed.flatMap((item) => (item && Array.isArray(item.json_agg) ? item.json_agg : []));
  }
  return parsed;
}

/**
 * Carga el esquema desde docs/audits/supabase-tables.json y supabase-columns.json.
 * Acepta array plano o export de Supabase (json_agg / data).
 * @returns {{ ok: boolean, error?: string, source?: string, tables: Map<string, string[]> }}
 */
function loadSchemaFromJsonFiles() {
  const tables = new Map();
  try {
    if (!fs.existsSync(TABLES_JSON) || !fs.existsSync(COLUMNS_JSON)) {
      return { ok: false, error: 'No existen ambos JSON (supabase-tables.json y supabase-columns.json)', tables };
    }
    const tablesParsed = JSON.parse(fs.readFileSync(TABLES_JSON, 'utf8'));
    const columnsParsed = JSON.parse(fs.readFileSync(COLUMNS_JSON, 'utf8'));
    const tablesRaw = normalizeJsonExport(tablesParsed);
    const columnsRaw = normalizeJsonExport(columnsParsed);
    if (!Array.isArray(tablesRaw) || !Array.isArray(columnsRaw)) {
      return { ok: false, error: 'Tras normalizar, tablas o columnas no son arrays', tables };
    }
    for (const row of tablesRaw) {
      const name = row && row.table_name;
      if (name) tables.set(String(name), []);
    }
    for (const row of columnsRaw) {
      const t = row && row.table_name;
      const c = row && row.column_name;
      if (t && c) {
        if (!tables.has(t)) tables.set(t, []);
        tables.get(t).push(String(c));
      }
    }
    return { ok: true, source: 'json', tables };
  } catch (err) {
    return { ok: false, error: err.message || String(err), tables: new Map() };
  }
}

async function fetchSupabaseSchema(supabaseUrl, supabaseKey) {
  const tables = new Map(); // table_name -> [ column_name, ... ]
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // Intentar schema('information_schema') — no siempre está expuesto en REST
    const schemaClient = supabase.schema('information_schema');
    const { data: tablesData, error: tablesError } = await schemaClient
      .from('tables')
      .select('table_schema, table_name')
      .eq('table_schema', 'public');

    if (tablesError || !tablesData || tablesData.length === 0) {
      return { ok: false, error: tablesError?.message || 'No tables returned or schema not exposed', tables: new Map() };
    }

    for (const row of tablesData) {
      const name = row.table_name;
      if (!name) continue;
      tables.set(name, []);
    }

    const { data: colsData, error: colsError } = await schemaClient
      .from('columns')
      .select('table_schema, table_name, column_name')
      .eq('table_schema', 'public');

    if (!colsError && colsData) {
      for (const row of colsData) {
        const t = row.table_name;
        const c = row.column_name;
        if (t && c && tables.has(t)) tables.get(t).push(c);
      }
    }

    return { ok: true, source: 'api', tables };
  } catch (err) {
    return { ok: false, error: err.message || String(err), tables: new Map() };
  }
}

// --- 4) Comparar y generar reporte ---
function buildReport(codeTables, schemaResult) {
  const codeTableNames = [...codeTables.keys()].filter((t) => !/^[A-Z_]+$/.test(t) || (codeTables.get(t).files && codeTables.get(t).files.length > 0));
  const realTables = schemaResult.ok ? [...schemaResult.tables.keys()] : [];
  const onlyInCode = codeTableNames.filter((t) => !realTables.includes(t));
  const onlyInDb = realTables.filter((t) => !codeTableNames.includes(t));

  const tableDetails = [];
  for (const tableName of codeTableNames) {
    const codeData = codeTables.get(tableName);
    const codeCols = [...(codeData?.columns || [])];
    const dbCols = schemaResult.ok && schemaResult.tables.has(tableName)
      ? schemaResult.tables.get(tableName)
      : [];
    const missingInDb = schemaResult.ok && dbCols.length
      ? codeCols.filter((c) => !dbCols.includes(c))
      : [];
    const missingInCode = schemaResult.ok && dbCols.length
      ? dbCols.filter((c) => !codeCols.includes(c))
      : [];
    tableDetails.push({
      table: tableName,
      files: [...(codeData?.files || [])],
      columnsInCode: codeCols,
      columnsInDb: dbCols,
      columnsOnlyInCode: missingInDb,
      columnsOnlyInDb: missingInCode,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    schemaFetched: schemaResult.ok,
    schemaSource: schemaResult.source || null,
    schemaError: schemaResult.error || null,
    summary: {
      tablesInCode: codeTableNames.length,
      tablesInDb: realTables.length,
      tablesOnlyInCode: onlyInCode.length,
      tablesOnlyInDb: onlyInDb.length,
    },
    tablesOnlyInCode: onlyInCode,
    tablesOnlyInDb: onlyInDb,
    tableDetails,
  };
}

function toMarkdown(report) {
  const lines = [
    '# Auditoría de esquema Supabase vs código',
    '',
    `Generado: ${report.generatedAt}`,
    '',
    '## Resumen',
    '',
    `- Tablas detectadas en código: ${report.summary.tablesInCode}`,
    `- Tablas en base de datos: ${report.summary.tablesInDb}`,
    `- Tablas solo en código: ${report.summary.tablesOnlyInCode}`,
    `- Tablas solo en BD: ${report.summary.tablesOnlyInDb}`,
    '',
  ];

  if (!report.schemaFetched && report.schemaError) {
    lines.push('## Esquema', '', 'No se pudo obtener el esquema (ni desde JSON ni desde Supabase).', '', `Motivo: ${report.schemaError}`, '');
    lines.push('Solo se reportan tablas y columnas detectadas en el código.', '');
  } else if (report.schemaFetched && report.schemaSource === 'json') {
    lines.push('## Esquema', '', 'Comparación contra esquema cargado desde **docs/audits** (modo offline).', '');
  }

  if (report.tablesOnlyInCode.length) {
    lines.push('## Tablas solo en código (revisar si existen en Supabase)', '');
    for (const t of report.tablesOnlyInCode) {
      lines.push(`- \`${t}\``);
    }
    lines.push('');
  }

  if (report.tablesOnlyInDb.length) {
    lines.push('## Tablas solo en BD (no referenciadas en código)', '');
    for (const t of report.tablesOnlyInDb) {
      lines.push(`- \`${t}\``);
    }
    lines.push('');
  }

  lines.push('## Detalle por tabla', '');
  for (const d of report.tableDetails) {
    lines.push(`### ${d.table}`, '');
    lines.push(`- Archivos: ${d.files.join(', ') || '-'}`);
    lines.push(`- Columnas en código: ${d.columnsInCode.length ? d.columnsInCode.join(', ') : '(ninguna detectada)'}`);
    if (d.columnsInDb.length) {
      lines.push(`- Columnas en BD: ${d.columnsInDb.join(', ')}`);
    }
    if (d.columnsOnlyInCode.length) {
      lines.push(`- ⚠️ Solo en código (revisar en BD): ${d.columnsOnlyInCode.join(', ')}`);
    }
    if (d.columnsOnlyInDb.length) {
      lines.push(`- Columnas en BD no usadas en código: ${d.columnsOnlyInDb.join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// --- Main ---
async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  const codeTables = new Map();
  for (const dir of SCAN_DIRS) {
    for (const filePath of walk(dir)) {
      const content = readFile(filePath);
      const fileTables = extractTablesAndColumns(filePath, content);
      mergeTables(codeTables, filePath, fileTables);
    }
  }

  // Normalizar: convertir Sets a arrays para JSON y para "tablas" sin archivos (solo constantes)
  const normalized = new Map();
  for (const [name, data] of codeTables) {
    normalized.set(name, {
      files: [...data.files],
      columns: [...data.columns],
    });
  }

  let schemaResult = loadSchemaFromJsonFiles();
  if (!schemaResult.ok && supabaseUrl && supabaseKey) {
    schemaResult = await fetchSupabaseSchema(supabaseUrl, supabaseKey);
  }
  if (!schemaResult.ok && !schemaResult.error) {
    schemaResult.error = 'SUPABASE_URL o SUPABASE_KEY no configurados';
  }

  const report = buildReport(normalized, schemaResult);

  const outDir = path.join(ROOT, 'docs', 'audits');
  fs.mkdirSync(outDir, { recursive: true });

  const mdPath = path.join(outDir, 'supabase-schema-audit.md');
  const jsonPath = path.join(outDir, 'supabase-schema-audit.json');

  fs.writeFileSync(mdPath, toMarkdown(report), 'utf8');
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        ...report,
        tableDetails: report.tableDetails.map((d) => ({
          ...d,
          columnsInCode: d.columnsInCode,
          columnsInDb: d.columnsInDb,
        })),
      },
      null,
      2
    ),
    'utf8'
  );

  console.log('Auditoría completada.');
  console.log('  -', mdPath);
  console.log('  -', jsonPath);
  console.log('  Tablas en código:', report.summary.tablesInCode);
  if (report.schemaFetched) {
    console.log('  Tablas en BD:', report.summary.tablesInDb);
    console.log('  Solo en código:', report.summary.tablesOnlyInCode);
    console.log('  Solo en BD:', report.summary.tablesOnlyInDb);
  } else {
    console.log('  Esquema:', report.schemaError || 'no obtenido (usa docs/audits/supabase-tables.json + supabase-columns.json para modo offline)');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
