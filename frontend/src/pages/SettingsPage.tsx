import { useState, type ReactNode } from 'react';
import { Sun, Moon, Monitor, type LucideIcon } from 'lucide-react';
import DatabaseSchemaTab from '../components/DatabaseSchemaTab';
import { useTheme, type Theme } from '../theme/ThemeProvider';

const themeOptions: {
  value: Theme;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { value: 'light', label: 'Claro', description: 'Sempre o tema claro', icon: Sun },
  { value: 'dark', label: 'Escuro', description: 'Sempre o tema escuro', icon: Moon },
  {
    value: 'system',
    label: 'Sistema',
    description: 'Acompanha o sistema operacional',
    icon: Monitor,
  },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<'appearance' | 'database'>('appearance');

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <TabButton active={tab === 'appearance'} onClick={() => setTab('appearance')}>
          Aparência
        </TabButton>
        <TabButton active={tab === 'database'} onClick={() => setTab('database')}>
          Banco de dados
        </TabButton>
      </div>

      {tab === 'appearance' ? <AppearanceSettings /> : <DatabaseSchemaTab />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 px-4 py-2.5 text-sm font-medium ${
        active
          ? 'border-brand-600 text-brand-700 dark:text-brand-400'
          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <Card title="Aparência">
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Escolha como o BookWise deve ser exibido.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {themeOptions.map(({ value, label, description, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors ${
                  active
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:bg-brand-600/10'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    active
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {label}
                </span>
                <span className="text-xs text-slate-400">{description}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Preferências">
        <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
          <PreferenceRow label="Notificações por email" hint="em breve" />
          <PreferenceRow label="Tabelas compactas" hint="em breve" />
          <PreferenceRow label="Idioma" hint="Português (Brasil)" />
        </ul>
      </Card>

      <Card title="Sobre">
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <Info label="Aplicação" value="BookWise" />
          <Info label="Versão" value="0.0.1" />
          <Info label="Frontend" value="React + TypeScript" />
          <Info label="Backend" value="Spring Boot 3 · Java 17" />
        </dl>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PreferenceRow({ label, hint }: { label: string; hint: string }) {
  return (
    <li className="flex items-center justify-between py-3">
      <span className="text-slate-700 dark:text-slate-200">{label}</span>
      <span className="text-xs text-slate-400">{hint}</span>
    </li>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-700 dark:text-slate-200">{value}</dd>
    </>
  );
}
