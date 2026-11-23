import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  ChevronDown,
  Database,
  CircleDot,
  GitBranch,
  KeyRound,
  Link2,
  Minus,
  Plus,
  RefreshCw,
  Table2,
} from 'lucide-react';
import type { DatabaseSchema, SchemaTable } from '../types/api';
import { ApiError } from '../services/http';
import { schemaService } from '../services/schemaService';

type SchemaView = 'tables' | 'mer' | 'der';

const BADGE_BASE = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium';

export default function DatabaseSchemaTab() {
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [view, setView] = useState<SchemaView>('tables');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setSchema(await schemaService.get());
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível ler a estrutura do banco de dados.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleTable = (name: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
        <Database className="h-5 w-5 animate-pulse" />
        Lendo o catálogo do banco...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
        <AlertCircle className="mx-auto mb-3 h-7 w-7" />
        <p>{error}</p>
        <button
          onClick={load}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-current px-3 py-2 text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!schema) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
            <Database className="h-5 w-5 text-brand-600" />
            {schema.database.productName}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Versão {schema.database.productVersion} · schema {schema.database.schemaName}
          </p>
        </div>
        <div className="rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 dark:bg-brand-600/10 dark:text-brand-300">
          {schema.tables.length} tabelas encontradas
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <ViewButton
          active={view === 'tables'}
          icon={<Table2 className="h-4 w-4" />}
          onClick={() => setView('tables')}
        >
          Tabelas
        </ViewButton>
        <ViewButton
          active={view === 'mer'}
          icon={<CircleDot className="h-4 w-4" />}
          onClick={() => setView('mer')}
        >
          MER
        </ViewButton>
        <ViewButton
          active={view === 'der'}
          icon={<GitBranch className="h-4 w-4" />}
          onClick={() => setView('der')}
        >
          DER
        </ViewButton>
      </div>

      {view === 'tables' ? (
        <div className="space-y-3">
          {schema.tables.map((table) => (
            <TableAccordion
              key={table.name}
              table={table}
              expanded={expanded.has(table.name)}
              onToggle={() => toggleTable(table.name)}
            />
          ))}
        </div>
      ) : view === 'der' ? (
        <SchemaDiagram schema={schema} />
      ) : (
        <MerDiagram schema={schema} />
      )}
    </div>
  );
}

function ViewButton({
  active,
  icon,
  onClick,
  children,
}: {
  active: boolean;
  icon: ReactNode;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium ${
        active
          ? 'border-brand-600 text-brand-700 dark:text-brand-400'
          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function TableAccordion({
  table,
  expanded,
  onToggle,
}: {
  table: SchemaTable;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
      >
        <span className="flex items-center gap-3">
          <Table2 className="h-5 w-5 text-brand-600" />
          <span className="font-semibold text-slate-800 dark:text-slate-100">{table.name}</span>
          <span className="text-sm text-slate-400">{table.columns.length} atributos</span>
        </span>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          {table.columns.map((column) => {
            const foreignKey = table.foreignKeys.find((item) => item.column === column.name);
            return (
              <div
                key={column.name}
                className="flex flex-col gap-2 border-b border-slate-100 px-5 py-3 last:border-b-0 sm:flex-row sm:items-center dark:border-slate-800"
              >
                <code className="min-w-44 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {column.name}
                </code>
                <span className="min-w-36 text-sm text-slate-500 dark:text-slate-400">
                  {formatType(column.type)}
                  {column.size ? ` (${column.size})` : ''}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {column.primaryKey && (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                      <KeyRound className="h-3 w-3" />
                      PK
                    </Badge>
                  )}
                  {foreignKey && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
                      <Link2 className="h-3 w-3" />
                      FK → {foreignKey.referencedTable}.{foreignKey.referencedColumn}
                    </Badge>
                  )}
                  {!column.nullable && (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">
                      NOT NULL
                    </Badge>
                  )}
                  {column.unique && (
                    <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                      UNIQUE
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Badge({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`${BADGE_BASE} ${className}`}>{children}</span>;
}

function SchemaDiagram({ schema }: { schema: DatabaseSchema }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [fitZoom, setFitZoom] = useState(0.5);
  const [zoom, setZoom] = useState<number | null>(null);
  const boxWidth = 360;
  const horizontalGap = 50;
  const rowGap = 60;
  const columns = 3;
  const width = columns * boxWidth + (columns - 1) * horizontalGap + 40;
  const positions = useMemo(
    () => calculatePositions(schema.tables, boxWidth, horizontalGap, rowGap),
    [schema.tables],
  );
  const height =
    Math.max(...Array.from(positions.values()).map((item) => item.y + item.height)) + 15;
  const activeZoom = zoom ?? fitZoom;
  const minimumZoom = Math.max(0.2, fitZoom * 0.6);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;

    const updateFitZoom = () => {
      const availableWidth = Math.max(320, element.clientWidth - 32);
      const availableHeight = Math.max(300, window.innerHeight * 0.75 - 90);
      const nextFit = Math.min(1, availableWidth / width, availableHeight / (height + 58));
      setFitZoom(Math.max(0.2, Number(nextFit.toFixed(2))));
    };

    updateFitZoom();
    const observer = new ResizeObserver(updateFitZoom);
    observer.observe(element);
    window.addEventListener('resize', updateFitZoom);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateFitZoom);
    };
  }, [height, width]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span>Arraste as barras de rolagem para explorar o diagrama.</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((value) => Math.max(minimumZoom, (value ?? fitZoom) - 0.1))}
            className="rounded border border-slate-300 p-1.5 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            aria-label="Reduzir zoom"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom(null)}
            className="min-w-16 rounded border border-slate-300 px-2 py-1.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Ajustar
          </button>
          <span className="w-12 text-center">{Math.round(activeZoom * 100)}%</span>
          <button
            onClick={() => setZoom((value) => Math.min(1.5, (value ?? fitZoom) + 0.1))}
            className="rounded border border-slate-300 p-1.5 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            aria-label="Aumentar zoom"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={viewportRef}
        className="max-h-[75vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
      >
        <svg
          width={width * activeZoom}
          height={height * activeZoom}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMin meet"
          role="img"
          aria-label="Diagrama de entidades e relacionamentos do banco"
          className="block max-w-none"
        >
          <defs>
            <marker
              id="schema-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 z" fill="#64748b" />
            </marker>
          </defs>
          {schema.tables.flatMap((table) =>
            table.foreignKeys.map((foreignKey, index) => {
              const source = positions.get(table.name);
              const target = positions.get(foreignKey.referencedTable);
              if (!source || !target) return [];
              const points = connectionPoints(source, target);
              return (
                <g key={`${table.name}-${foreignKey.column}-${index}`}>
                  <path
                    d={`M ${points.source.x} ${points.source.y} L ${points.sourceBend.x} ${points.sourceBend.y} L ${points.targetBend.x} ${points.targetBend.y} L ${points.target.x} ${points.target.y}`}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.5"
                    markerEnd="url(#schema-arrow)"
                  />
                  <text
                    x={(points.source.x + points.target.x) / 2}
                    y={(points.source.y + points.target.y) / 2 - 7}
                    textAnchor="middle"
                    className="fill-slate-600 text-[12px] font-semibold dark:fill-slate-300"
                  >
                    1:N
                  </text>
                </g>
              );
            }),
          )}
          {schema.tables.map((table) => {
            const position = positions.get(table.name);
            if (!position) return null;
            return <DiagramTable key={table.name} table={table} position={position} />;
          })}
        </svg>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-amber-500" />
            PK: chave primária
          </span>
          <span className="inline-flex items-center gap-2">
            <Link2 className="h-4 w-4 text-blue-500" />
            FK: chave estrangeira
          </span>
          <span>1:N: uma linha da tabela pai para várias da tabela filha</span>
        </div>
      </div>
    </div>
  );
}

type MerEntity = {
  table: SchemaTable;
  label: string;
  attributes: string[];
};

type MerRelationship = {
  id: string;
  name: string;
  left: string;
  right: string;
  leftCardinality: string;
  rightCardinality: string;
  attributes: string[];
};

type MerPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const ENTITY_LABELS: Record<string, string> = {
  users: 'Usuário',
  books: 'Livro',
  loans: 'Empréstimo',
  sales: 'Venda',
  reservations: 'Reserva',
  fines: 'Multa',
  categories: 'Categoria',
};

const RELATIONSHIP_NAMES: Record<string, string> = {
  book_categories: 'classifica',
  loan_items: 'contém',
  sale_items: 'contém',
};

const ENTITY_HEIGHT = 64;
const DIAMOND_HEIGHT = 48;
const CARDINALITY_WIDTH = 44;
const CARDINALITY_HEIGHT = 32;

function buildMerEntities(tables: SchemaTable[]): MerEntity[] {
  return tables
    .filter((table) => !isMerRelationshipTable(table))
    .map((table) => ({
      table,
      label: ENTITY_LABELS[table.name] ?? table.name,
      attributes: table.columns
        .filter(
          (column) => !table.foreignKeys.some((foreignKey) => foreignKey.column === column.name),
        )
        .map((column) => column.name),
    }));
}

function buildMerRelationships(tables: SchemaTable[], entities: MerEntity[]): MerRelationship[] {
  const entityNames = new Set(entities.map((entity) => entity.table.name));
  const relationships: MerRelationship[] = [];

  tables.forEach((table) => {
    if (isMerRelationshipTable(table)) {
      const references = Array.from(
        new Set(
          table.foreignKeys
            .map((foreignKey) => foreignKey.referencedTable)
            .filter((name) => entityNames.has(name)),
        ),
      );
      if (references.length >= 2) {
        relationships.push({
          id: table.name,
          name: RELATIONSHIP_NAMES[table.name] ?? table.name,
          left: references[0],
          right: references[1],
          leftCardinality: 'N',
          rightCardinality: 'N',
          attributes: table.columns
            .filter(
              (column) =>
                !table.foreignKeys.some((foreignKey) => foreignKey.column === column.name) &&
                !table.primaryKey.includes(column.name),
            )
            .map((column) => column.name),
        });
      }
      return;
    }

    table.foreignKeys.forEach((foreignKey, index) => {
      if (!entityNames.has(table.name) || !entityNames.has(foreignKey.referencedTable)) {
        return;
      }
      relationships.push({
        id: `${table.name}-${foreignKey.column}-${index}`,
        name: relationshipName(table.name, foreignKey.referencedTable),
        left: foreignKey.referencedTable,
        right: table.name,
        leftCardinality: '1',
        rightCardinality: 'N',
        attributes: [],
      });
    });
  });

  return relationships;
}

function isMerRelationshipTable(table: SchemaTable) {
  const primaryKeys = new Set(table.primaryKey);
  const foreignKeys = new Set(table.foreignKeys.map((foreignKey) => foreignKey.column));
  const isPureJunction =
    primaryKeys.size > 0 && Array.from(primaryKeys).every((column) => foreignKeys.has(column));
  return isPureJunction || table.name.endsWith('_items');
}

function relationshipName(source: string, target: string) {
  const names: Record<string, string> = {
    'books|categories': 'classifica',
    'books|loans': 'contém',
    'books|reservations': 'reserva',
    'books|sales': 'contém',
    'fines|loans': 'gera',
    'loans|users': 'empresta',
    'reservations|users': 'reserva',
    'sales|users': 'compra',
    'categories|categories': 'contém',
  };
  return names[[source, target].sort().join('|')] ?? 'relaciona';
}

function merConnectionPoint(position: MerPosition, target: { x: number; y: number }) {
  const center = {
    x: position.x + position.width / 2,
    y: position.y + position.height / 2,
  };
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return {
      x: position.x + (dx > 0 ? position.width : 0),
      y: Math.max(position.y + 12, Math.min(position.y + position.height - 12, target.y)),
    };
  }
  return {
    x: center.x,
    y: position.y + (dy > 0 ? position.height : 0),
  };
}

function calculatePositions(
  tables: SchemaTable[],
  boxWidth: number,
  horizontalGap: number,
  rowGap: number,
) {
  const rowOrder = [
    ['users', 'loans', 'loan_items'],
    ['books', 'reservations', 'fines'],
    ['categories', 'sales', 'sale_items'],
    ['empty', 'book_categories', 'empty-2'],
  ];
  const tableByName = new Map(tables.map((table) => [table.name, table]));
  const positions = new Map<string, { x: number; y: number; width: number; height: number }>();
  let y = 20;

  rowOrder.forEach((row) => {
    const rowTables = row
      .map((name) => tableByName.get(name))
      .filter((table): table is SchemaTable => Boolean(table));
    const rowHeight = Math.max(...rowTables.map((table) => tableHeight(table)), 250);
    row.forEach((name, column) => {
      const table = tableByName.get(name);
      if (table) {
        positions.set(name, {
          x: 20 + column * (boxWidth + horizontalGap),
          y,
          width: boxWidth,
          height: tableHeight(table),
        });
      }
    });
    y += rowHeight + rowGap;
  });

  tables.forEach((table, index) => {
    if (!positions.has(table.name)) {
      positions.set(table.name, {
        x: 20 + (index % 3) * (boxWidth + horizontalGap),
        y,
        width: boxWidth,
        height: tableHeight(table),
      });
    }
  });
  return positions;
}

function tableHeight(table: SchemaTable) {
  return 54 + table.columns.length * 24 + 16;
}

function DiagramTable({
  table,
  position,
}: {
  table: SchemaTable;
  position: { x: number; y: number; width: number; height: number };
}) {
  return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      <rect
        width={position.width}
        height={position.height}
        rx="10"
        className="fill-white stroke-slate-300 dark:fill-slate-900 dark:stroke-slate-700"
        strokeWidth="1.5"
      />
      <rect width={position.width} height="38" rx="10" className="fill-brand-600" />
      <rect y="28" width={position.width} height="10" className="fill-brand-600" />
      <text x="16" y="25" className="fill-white text-sm font-semibold">
        {table.name}
      </text>
      {table.columns.map((column, index) => (
        <g key={column.name} transform={`translate(16, ${62 + index * 24})`}>
          {(() => {
            const foreignKey = table.foreignKeys.some((item) => item.column === column.name);
            const marker = column.primaryKey
              ? foreignKey
                ? 'PK/FK '
                : 'PK '
              : foreignKey
                ? 'FK '
                : column.unique
                  ? '◆ '
                  : '';
            return (
              <>
                <text
                  x="0"
                  y="0"
                  className={`text-[13px] ${
                    foreignKey
                      ? 'fill-sky-700 font-semibold dark:fill-sky-300'
                      : column.primaryKey
                        ? 'fill-amber-600 font-semibold'
                        : 'fill-slate-700 dark:fill-slate-300'
                  }`}
                >
                  {marker}
                  {column.name}
                </text>
                <text x="205" y="0" className="fill-slate-500 text-[12px] dark:fill-slate-400">
                  {formatType(column.type)}
                </text>
              </>
            );
          })()}
        </g>
      ))}
    </g>
  );
}

function connectionPoints(
  source: { x: number; y: number; width: number; height: number },
  target: { x: number; y: number; width: number; height: number },
) {
  if (source.x < target.x) {
    return {
      source: { x: source.x + source.width, y: source.y + source.height / 2 },
      target: { x: target.x, y: target.y + target.height / 2 },
      sourceBend: {
        x: source.x + source.width + 25,
        y: source.y + source.height / 2,
      },
      targetBend: {
        x: target.x - 25,
        y: target.y + target.height / 2,
      },
    };
  }
  if (source.x > target.x) {
    return {
      source: { x: source.x, y: source.y + source.height / 2 },
      target: { x: target.x + target.width, y: target.y + target.height / 2 },
      sourceBend: {
        x: source.x - 25,
        y: source.y + source.height / 2,
      },
      targetBend: {
        x: target.x + target.width + 25,
        y: target.y + target.height / 2,
      },
    };
  }
  return {
    source: { x: source.x + source.width / 2, y: source.y + source.height },
    target: { x: target.x + target.width / 2, y: target.y },
    sourceBend: {
      x: source.x + source.width / 2,
      y: source.y + source.height + 25,
    },
    targetBend: {
      x: target.x + target.width / 2,
      y: target.y - 25,
    },
  };
}

function formatType(type: string) {
  return type
    .replace('timestamp with time zone', 'timestamptz')
    .replace('character varying', 'varchar')
    .replace(/^enum\(.*\)$/i, 'enum');
}

type MerMode = 'overview' | 'entity';

function MerDiagram({ schema }: { schema: DatabaseSchema }) {
  const [mode, setMode] = useState<MerMode>('overview');
  const entities = useMemo(() => buildMerEntities(schema.tables), [schema.tables]);
  const relationships = useMemo(
    () => buildMerRelationships(schema.tables, entities),
    [schema.tables, entities],
  );
  const [selected, setSelected] = useState(entities[0]?.table.name ?? '');

  useEffect(() => {
    if (!entities.some((entity) => entity.table.name === selected)) {
      setSelected(entities[0]?.table.name ?? '');
    }
  }, [entities, selected]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
          {(['overview', 'entity'] as MerMode[]).map((item) => (
            <button
              key={item}
              onClick={() => setMode(item)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                mode === item
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {item === 'overview' ? 'Visão geral' : 'Por entidade'}
            </button>
          ))}
        </div>
        {mode === 'entity' && (
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            Entidade
            <select
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            >
              {entities.map((entity) => (
                <option key={entity.table.name} value={entity.table.name}>
                  {entity.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {mode === 'overview' ? (
        <MerCanvas
          {...merOverviewCanvasSize(entities, relationships)}
          ariaLabel="Visão geral do MER"
          showAttributes={false}
        >
          <MerOverviewContent entities={entities} relationships={relationships} />
        </MerCanvas>
      ) : (
        <MerCanvas
          width={1050}
          height={704}
          ariaLabel={`MER da entidade ${selected}`}
          showAttributes
        >
          <MerEntityContent
            entity={entities.find((item) => item.table.name === selected)!}
            entities={entities}
            relationships={relationships}
          />
        </MerCanvas>
      )}
    </div>
  );
}

function MerCanvas({
  width,
  height,
  ariaLabel,
  showAttributes,
  children,
}: {
  width: number;
  height: number;
  ariaLabel: string;
  showAttributes: boolean;
  children: ReactNode;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [fitZoom, setFitZoom] = useState(0.5);
  const [zoom, setZoom] = useState<number | null>(null);
  const activeZoom = zoom ?? fitZoom;
  const minimumZoom = Math.max(0.2, fitZoom * 0.6);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;
    const update = () => {
      const availableWidth = Math.max(320, element.clientWidth - 32);
      const availableHeight = Math.max(300, window.innerHeight * 0.75 - 70);
      const next = Math.min(1, availableWidth / width, availableHeight / height);
      setFitZoom(Number(next.toFixed(2)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [height, width]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span>Modelo conceitual na notação de Chen.</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((value) => Math.max(minimumZoom, (value ?? fitZoom) - 0.1))}
            className="rounded border border-slate-300 p-1.5 dark:border-slate-700"
            aria-label="Reduzir zoom do MER"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom(null)}
            className="min-w-16 rounded border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700"
          >
            Ajustar
          </button>
          <span className="w-12 text-center">{Math.round(activeZoom * 100)}%</span>
          <button
            onClick={() => setZoom((value) => Math.min(1.5, (value ?? fitZoom) + 0.1))}
            className="rounded border border-slate-300 p-1.5 dark:border-slate-700"
            aria-label="Aumentar zoom do MER"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={viewportRef}
        className="max-h-[75vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
      >
        <svg
          width={width * activeZoom}
          height={height * activeZoom}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMin meet"
          role="img"
          aria-label={ariaLabel}
          className="block max-w-none"
        >
          {children}
        </svg>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
          <span>▭ Entidade</span>
          {showAttributes && <span>⬭ Atributo</span>}
          <span>◇ Relacionamento</span>
          <span>Cardinalidade: 1:N ou N:N</span>
        </div>
      </div>
    </div>
  );
}

function overviewPositions(entities: MerEntity[]) {
  const gap = (names: string[]) =>
    Math.max(...names.map((name) => merDiamondWidth(name))) + 2 * (CARDINALITY_WIDTH + 12);
  const userWidth = merEntityWidth(ENTITY_LABELS.users);
  const centralWidth = Math.max(
    merEntityWidth(ENTITY_LABELS.loans),
    merEntityWidth(ENTITY_LABELS.reservations),
    merEntityWidth(ENTITY_LABELS.sales),
    merEntityWidth(ENTITY_LABELS.fines),
  );
  const bookWidth = merEntityWidth(ENTITY_LABELS.books);
  const categoryWidth = merEntityWidth(ENTITY_LABELS.categories);
  const userCentralGap = gap(['empresta', 'reserva', 'compra']);
  const centralBookGap = gap(['contém', 'reserva']);
  const bookCategoryGap = gap(['classifica']);
  const centralX = 30 + userWidth + userCentralGap;
  const booksX = centralX + centralWidth + centralBookGap;
  const verticalGap = DIAMOND_HEIGHT + 2 * (CARDINALITY_HEIGHT + 16);
  const rowGap = ENTITY_HEIGHT + verticalGap;
  const finesY = 24;
  const loansY = finesY + rowGap;
  const reservationsY = loansY + rowGap;
  const salesY = reservationsY + rowGap;
  const preferred: Record<string, [number, number, number, number]> = {
    users: [30, reservationsY, userWidth, ENTITY_HEIGHT],
    loans: [centralX, loansY, centralWidth, ENTITY_HEIGHT],
    reservations: [centralX, reservationsY, centralWidth, ENTITY_HEIGHT],
    sales: [centralX, salesY, centralWidth, ENTITY_HEIGHT],
    books: [booksX, reservationsY, bookWidth, ENTITY_HEIGHT],
    categories: [booksX + bookWidth + bookCategoryGap, reservationsY, categoryWidth, ENTITY_HEIGHT],
    fines: [centralX, finesY, centralWidth, ENTITY_HEIGHT],
  };
  const result = new Map<string, MerPosition>();
  entities.forEach((entity, index) => {
    const fallback: [number, number, number, number] = [
      40 + (index % 3) * 360,
      100 + Math.floor(index / 3) * 230,
      150,
      ENTITY_HEIGHT,
    ];
    const [x, y, width, height] = preferred[entity.table.name] ?? fallback;
    result.set(entity.table.name, { x, y, width, height });
  });
  return result;
}

function merOverviewCanvasSize(entities: MerEntity[], relationships: MerRelationship[]) {
  const positions = overviewPositions(entities);
  const maxRight = Math.max(
    ...Array.from(positions.values(), (position) => position.x + position.width),
  );
  const maxBottom = Math.max(
    ...Array.from(positions.values(), (position) => position.y + position.height),
  );
  const maxDiamondWidth = Math.max(
    ...relationships.map((relationship) => merDiamondWidth(relationship.name)),
    0,
  );
  return {
    width: maxRight + maxDiamondWidth / 2 + 24,
    height: maxBottom + 24 + 24,
  };
}

function MerOverviewContent({
  entities,
  relationships,
}: {
  entities: MerEntity[];
  relationships: MerRelationship[];
}) {
  const positions = overviewPositions(entities);
  const layouts = relationships.flatMap((relationship) => {
    const left = positions.get(relationship.left);
    const right = positions.get(relationship.right);
    if (!left || !right) return [];
    const leftCenter = merPositionCenter(left);
    const rightCenter = merPositionCenter(right);
    const center =
      relationship.left === relationship.right
        ? { x: leftCenter.x, y: left.y + left.height + DIAMOND_HEIGHT + 24 }
        : {
            x: (leftCenter.x + rightCenter.x) / 2,
            y: (leftCenter.y + rightCenter.y) / 2,
          };
    return [{ relationship, center }];
  });
  return (
    <>
      {layouts.map((layout) => (
        <MerOverviewRelationship
          key={layout.relationship.id}
          layout={layout}
          positions={positions}
        />
      ))}
      {entities.map((entity) => (
        <MerEntityBox
          key={entity.table.name}
          entity={entity}
          position={positions.get(entity.table.name)!}
        />
      ))}
    </>
  );
}

function MerOverviewRelationship({
  layout,
  positions,
}: {
  layout: { relationship: MerRelationship; center: { x: number; y: number } };
  positions: Map<string, MerPosition>;
}) {
  const { relationship, center } = layout;
  const left = positions.get(relationship.left)!;
  const right = positions.get(relationship.right)!;
  const leftPoint = merConnectionPoint(left, center);
  const rightPoint = merConnectionPoint(right, center);
  const sameEntity = relationship.left === relationship.right;
  return (
    <g>
      <path
        d={
          sameEntity
            ? `M ${leftPoint.x} ${leftPoint.y} V ${center.y} H ${center.x}`
            : `M ${leftPoint.x} ${leftPoint.y} V ${center.y} H ${center.x}`
        }
        className="stroke-slate-500 dark:stroke-slate-300"
        fill="none"
        strokeWidth="3"
      />
      <path
        d={
          sameEntity
            ? `M ${center.x} ${center.y} V ${rightPoint.y} H ${rightPoint.x}`
            : `M ${center.x} ${center.y} V ${rightPoint.y} H ${rightPoint.x}`
        }
        className="stroke-slate-500 dark:stroke-slate-300"
        fill="none"
        strokeWidth="3"
      />
      <MerDiamond center={center} name={relationship.name} />
      <MerCardinality
        {...merOverviewCardinalityPosition(leftPoint, center, merDiamondWidth(relationship.name))}
        value={relationship.leftCardinality}
      />
      <MerCardinality
        {...merOverviewCardinalityPosition(rightPoint, center, merDiamondWidth(relationship.name))}
        value={relationship.rightCardinality}
      />
    </g>
  );
}

function MerEntityContent({
  entity,
  entities,
  relationships,
}: {
  entity: MerEntity;
  entities: MerEntity[];
  relationships: MerRelationship[];
}) {
  const center: MerPosition = {
    x: 440,
    y: 330,
    width: merEntityWidth(entity.label),
    height: ENTITY_HEIGHT,
  };
  const selected = relationships.filter(
    (relationship) =>
      relationship.left === entity.table.name || relationship.right === entity.table.name,
  );
  const attributes = entity.attributes.map((name, index) => {
    const topCount = Math.ceil(entity.attributes.length / 2);
    const top = index < topCount;
    const slot = top ? index : index - topCount;
    const count = top ? topCount : entity.attributes.length - topCount;
    return {
      name,
      x: 40 + ((slot + 1) / (count + 1)) * 910,
      y: top ? 80 : 650,
      primary: name === entity.table.primaryKey[0],
      anchor: {
        x: 550,
        y: top ? center.y : center.y + center.height,
      },
    };
  });
  return (
    <>
      {attributes.map((attribute) => (
        <MerConceptAttribute key={attribute.name} attribute={attribute} entity={center} />
      ))}
      {selected.map((relationship, index) => {
        const left = index % 2 === 0;
        const sideIndex = Math.floor(index / 2);
        const neighborName =
          relationship.left === entity.table.name ? relationship.right : relationship.left;
        const neighbor = entities.find((item) => item.table.name === neighborName) ?? entity;
        const neighborWidth = merEntityWidth(neighbor.label);
        const diamondY = 210 + sideIndex * 160;
        const neighborPosition: MerPosition = {
          x: left ? 24 : 1050 - 24 - neighborWidth,
          y: diamondY - 35,
          width: neighborWidth,
          height: ENTITY_HEIGHT,
        };
        const diamond = {
          x: left
            ? neighborPosition.x +
              neighborPosition.width +
              (center.x - (neighborPosition.x + neighborPosition.width)) / 2
            : center.x + center.width + (neighborPosition.x - (center.x + center.width)) / 2,
          y: diamondY,
        };
        return (
          <MerEntityRelationship
            key={relationship.id}
            relationship={relationship}
            diamond={diamond}
            neighbor={neighbor}
            neighborPosition={neighborPosition}
            center={center}
          />
        );
      })}
      <MerEntityBox entity={entity} position={center} />
    </>
  );
}

function MerEntityRelationship({
  relationship,
  diamond,
  neighbor,
  neighborPosition,
  center,
}: {
  relationship: MerRelationship;
  diamond: { x: number; y: number };
  neighbor: MerEntity;
  neighborPosition: MerPosition;
  center: MerPosition;
}) {
  const centerPoint = merConnectionPoint(center, diamond);
  const neighborPoint = merConnectionPoint(neighborPosition, diamond);
  const relationshipAttributes = relationship.attributes.map((name, index) => ({
    name,
    x: diamond.x + (index - (relationship.attributes.length - 1) / 2) * 120,
    y: diamond.y >= 500 ? diamond.y - 90 : diamond.y + 90,
    primary: false,
  }));
  return (
    <g>
      <path
        d={merOrthPath(centerPoint, diamond)}
        className="stroke-slate-500 dark:stroke-slate-300"
        fill="none"
        strokeWidth="3"
      />
      <path
        d={merOrthPath(diamond, neighborPoint)}
        className="stroke-slate-500 dark:stroke-slate-300"
        fill="none"
        strokeWidth="3"
      />
      <MerCardinality
        {...merCardinalityPosition(centerPoint, diamond)}
        value={relationship.left === relationship.right ? '1' : relationship.leftCardinality}
      />
      <MerCardinality
        {...merCardinalityPosition(neighborPoint, diamond)}
        value={relationship.right === relationship.left ? 'N' : relationship.rightCardinality}
      />
      <MerDiamond center={diamond} name={relationship.name} />
      {relationshipAttributes.map((attribute) => (
        <MerConceptAttribute
          key={attribute.name}
          attribute={attribute}
          entity={{ x: diamond.x - 1, y: diamond.y - 1, width: 2, height: 2 }}
        />
      ))}
      <MerEntityBox entity={neighbor} position={neighborPosition} />
    </g>
  );
}

function MerConceptAttribute({
  attribute,
  entity,
}: {
  attribute: {
    name: string;
    x: number;
    y: number;
    primary: boolean;
    anchor?: { x: number; y: number };
  };
  entity: MerPosition;
}) {
  const center = attribute.anchor ?? merPositionCenter(entity);
  const rx = Math.max(32, merAttributeTextWidth(attribute.name) * 0.62);
  return (
    <g>
      <line
        x1={center.x}
        y1={center.y}
        x2={attribute.x}
        y2={attribute.y}
        className="stroke-slate-400 dark:stroke-slate-500"
        strokeWidth="2"
      />
      <ellipse
        cx={attribute.x}
        cy={attribute.y}
        rx={rx}
        ry="28"
        className="fill-white stroke-slate-500 dark:fill-slate-900 dark:stroke-slate-300"
        strokeWidth="2"
      />
      <text
        x={attribute.x}
        y={attribute.y + 6}
        textAnchor="middle"
        textDecoration={attribute.primary ? 'underline' : undefined}
        className="fill-slate-800 text-lg dark:fill-slate-100"
      >
        {attribute.name}
      </text>
    </g>
  );
}

function MerEntityBox({ entity, position }: { entity: MerEntity; position: MerPosition }) {
  return (
    <g>
      <rect
        x={position.x}
        y={position.y}
        width={position.width}
        height={ENTITY_HEIGHT}
        className="fill-brand-600 stroke-brand-700 dark:fill-brand-500 dark:stroke-brand-300"
        strokeWidth="3"
      />
      <text
        x={position.x + position.width / 2}
        y={position.y + 44}
        textAnchor="middle"
        className="fill-white text-xl font-bold dark:fill-white"
      >
        {entity.label}
      </text>
    </g>
  );
}

function MerDiamond({ center, name }: { center: { x: number; y: number }; name: string }) {
  const width = merDiamondWidth(name);
  const height = DIAMOND_HEIGHT;
  return (
    <>
      <polygon
        points={`${center.x},${center.y - height / 2} ${center.x + width / 2},${center.y} ${center.x},${center.y + height / 2} ${center.x - width / 2},${center.y}`}
        className="fill-violet-100 stroke-violet-700 dark:fill-violet-900 dark:stroke-violet-300"
        strokeWidth="3"
      />
      <text
        x={center.x}
        y={center.y + 7}
        textAnchor="middle"
        className="fill-violet-900 text-lg font-bold dark:fill-violet-100"
      >
        {name}
      </text>
    </>
  );
}

function merShapeTextWidth(text: string) {
  return Math.max(44, text.length * 7 + 18);
}

function merEntityWidth(text: string) {
  return Math.max(130, text.length * 11.5 + 44);
}

function merDiamondWidth(text: string) {
  return merShapeTextWidth(text) * 2.2;
}

function merAttributeTextWidth(text: string) {
  return Math.max(52, text.length * 8 + 24);
}

function MerCardinality({ x, y, value }: { x: number; y: number; value: string }) {
  return (
    <g>
      <rect
        x={x - 22}
        y={y - 20}
        width={CARDINALITY_WIDTH}
        height={CARDINALITY_HEIGHT}
        rx="7"
        className="fill-white stroke-slate-300 dark:fill-slate-950 dark:stroke-slate-600"
        strokeWidth="2"
      />
      <text
        x={x}
        y={y + 3}
        textAnchor="middle"
        className="fill-slate-800 text-lg font-bold dark:fill-slate-100"
      >
        {value}
      </text>
    </g>
  );
}

function merPositionCenter(position: MerPosition) {
  return {
    x: position.x + position.width / 2,
    y: position.y + position.height / 2,
  };
}

function merCardinalityPosition(point: { x: number; y: number }, target: { x: number; y: number }) {
  const dx = target.x - point.x;
  const dy = target.y - point.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return {
      x: point.x + Math.sign(dx || 1) * (CARDINALITY_WIDTH / 2 + 14),
      y: point.y,
    };
  }
  return {
    x: point.x,
    y: point.y + Math.sign(dy || 1) * (CARDINALITY_HEIGHT / 2 + 14),
  };
}

function merOverviewCardinalityPosition(
  point: { x: number; y: number },
  diamond: { x: number; y: number },
  diamondWidth: number,
) {
  const dx = diamond.x - point.x;
  const dy = diamond.y - point.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return {
      x:
        diamond.x +
        Math.sign(point.x - diamond.x || -1) * (diamondWidth / 2 + CARDINALITY_WIDTH / 2 + 14),
      y: diamond.y,
    };
  }
  return merCardinalityPosition(point, diamond);
}

function merOrthPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  if (Math.abs(to.x - from.x) >= Math.abs(to.y - from.y)) {
    return `M ${from.x} ${from.y} H ${to.x} V ${to.y}`;
  }
  return `M ${from.x} ${from.y} V ${to.y} H ${to.x}`;
}
