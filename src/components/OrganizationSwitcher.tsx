import { useState } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';

export default function OrganizationSwitcher() {
  const {
    organizations,
    currentOrganization,
    setCurrentOrganizationId,
    loading,
    error,
  } = useOrganization();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
        <Building2 size={16} />
        <span>Cargando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-red-500">
        <Building2 size={16} />
        <span>Error</span>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
        <Building2 size={16} />
        <span>Sin organización</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
      >
        <Building2 size={16} className="text-gray-500" />
        <span className="font-medium text-gray-700 max-w-[140px] truncate">
          {currentOrganization?.name ?? 'Seleccionar organización'}
        </span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              {organizations.map(({ organization, membership }) => (
                <button
                  key={organization.id}
                  onClick={() => {
                    setCurrentOrganizationId(organization.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{organization.name}</span>
                    <span className="text-xs text-gray-400 capitalize">{membership.role}</span>
                  </div>
                  {organization.id === currentOrganization?.id && (
                    <Check size={14} className="text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
