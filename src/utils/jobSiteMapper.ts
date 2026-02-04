// utils/jobSiteMapper.ts
export const mapJobSiteFromApi = (item: any) => {
    return {
      id: item.id,
      site: item.name, // Şantiye adı
      today: 0,        // şimdilik yok
      total: 0,        // şimdilik yok
      paid: 0,         // şimdilik yok
      unpaid: 0,       // şimdilik yok
      fuelLeft: `${item.fuelStock ?? 0} lt`,
      fuelGiven: '0 lt', // backend’de yok
      canEdit: item.canEdit,
      isActive: item.isActive,
    };
  };
  