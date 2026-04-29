import type { ReactNode } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';

export default function RequireOrganization({ children }: { children: ReactNode }) {
  const { loading, currentOrganization, error } = useOrganization();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
        Cargando organización...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error al cargar organización</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-700 font-medium">Sin organización asignada</p>
          <p className="text-sm text-gray-500 mt-1">
            Contacta con el administrador para que te asigne a una organización.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
