// DEV ONLY — remove before production or guard behind feature flag
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';

export default function OrganizationDebug() {
  const { user } = useAuth();
  const { organizations, currentOrganization, currentRole, loading, error, refreshOrganizations } =
    useOrganization();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-700">
          Página de debug — solo desarrollo. No incluir en producción.
        </div>

        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-3">Usuario actual</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-gray-500 w-20">ID:</dt>
              <dd className="text-gray-800 font-mono break-all">{user?.id ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-20">Email:</dt>
              <dd className="text-gray-800">{user?.email ?? '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-3">Organización activa</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Cargando...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : currentOrganization ? (
            <dl className="space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="text-gray-500 w-20">Nombre:</dt>
                <dd className="text-gray-800">{currentOrganization.name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-20">Slug:</dt>
                <dd className="text-gray-800 font-mono">{currentOrganization.slug}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-20">Sector:</dt>
                <dd className="text-gray-800">{currentOrganization.sector ?? '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-20">Rol:</dt>
                <dd className="text-gray-800 capitalize">{currentRole ?? '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-400">Sin organización activa</p>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">
              Organizaciones del usuario ({organizations.length})
            </h2>
            <button
              onClick={refreshOrganizations}
              className="text-xs text-indigo-600 hover:underline"
            >
              Recargar
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Cargando...</p>
          ) : organizations.length === 0 ? (
            <p className="text-sm text-gray-400">Sin organizaciones</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {organizations.map(({ organization, membership }) => (
                <li key={organization.id} className="py-3 text-sm">
                  <div className="font-medium text-gray-800">{organization.name}</div>
                  <div className="text-gray-500 text-xs mt-0.5 font-mono">{organization.id}</div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    slug: {organization.slug} · rol: {membership.role} · sector:{' '}
                    {organization.sector ?? '—'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
