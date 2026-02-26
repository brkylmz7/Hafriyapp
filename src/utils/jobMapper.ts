export const mapJobFromApi = (item: any) => {
  let dumps: {
    place: string;
    cash: string;
    fuel: string;
  }[] = [];

  // 🔹 1. Offer 1 (Her zaman ekle)
  if (item.offer1Name) {
    dumps.push({
      place: item.offer1Name,
      cash: item.offer1Cash ? `${item.offer1Cash}₺` : '-',
      fuel: item.offer1Fuel ? `${item.offer1Fuel} LT` : '-',
    });
  }

  // 🔹 2. extraOffersJson varsa (ekle)
  if (item.extraOffersJson) {
    try {
      const parsed = JSON.parse(item.extraOffersJson);

      if (Array.isArray(parsed)) {
        parsed.forEach((o: any) => {
          dumps.push({
            place: o.name || o.unloading || o.dumpLocation || '-',
            cash: o.cash ? `${o.cash}₺` : '-',
            fuel: o.fuel ? `${o.fuel} LT` : '-',
          });
        });
      }
    } catch (e) {
      console.log('extraOffersJson parse error', e);
    }
  }

  // Fallback: Eğer hiç offer yoksa ve offer2 varsa (eski yapıdan kalma ihtimaline karşı)
  if (dumps.length === 0 && item.offer2Name) {
    dumps.push({
      place: item.offer2Name,
      cash: item.offer2Cash ? `${item.offer2Cash}₺` : '-',
      fuel: item.offer2Fuel ? `${item.offer2Fuel} LT` : '-',
    });
  }

  return {
    id: item.id,
    company: item.companyName,
    site: item.name,
    jobType: item.jobType, // 0: Hafriyat, 1: Kum/Mıcır
    loadingEndTime: item.loadingEndTime, // 0: Hafriyat, 1: Kum/Mıcır
    loadingStartTime: item.loadingStartTime, // 0: Hafriyat, 1: Kum/Mıcır
    logo: item.companyLogoBase64
      ? { uri: item.companyLogoBase64 }
      : require('../../assets/logokarakalem.png'),

    dumps,

    status: item.isActive ? 'Yükleme Devam Ediyor' : 'Pasif',
    statusColor: item.isActive ? '#C8E6C9' : '#FFE0E0',

    phone: item.contactPhone,
    locationUrl: item.locationUrl,
    description: item.description,
    provinceCode: item.provinceCode,
  };
};
