import { useBackendStatus } from '../services/backendStatus';
import type { KeepAliveConfig } from '../services/keepAliveService';

export default function BackendStatusDetails({
  keepAlive,
}: {
  keepAlive?: KeepAliveConfig | null;
}) {
  const status = useBackendStatus();
  return (
    <span className="block space-y-1">
      <span className="block font-medium">
        {status.phase === 'online'
          ? 'Servidor online'
          : status.phase === 'waking'
            ? 'Acordando servidor…'
            : 'Servidor offline'}
      </span>
      <span className="block">
        Latência: {status.latencyMs === null ? '—' : `${status.latencyMs} ms`}
      </span>
      <span className="block">
        Última verificação:{' '}
        {status.lastCheck ? new Date(status.lastCheck).toLocaleTimeString('pt-BR') : '—'}
      </span>
      {keepAlive?.enabled && (
        <span className="block">
          {keepAlive.activeUntil
            ? `Ativo até ${new Date(keepAlive.activeUntil).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
            : 'Ativo até desligar'}
          {!keepAlive.targetConfigured ? ' · sem URL configurada' : ''}
        </span>
      )}
    </span>
  );
}
