export const mapJobFromApi = (item: any) => {
    let dumps: {
      place: string;
      cash: string;
      fuel: string;
    }[] = [];
  
    // 🔹 1. extraOffersJson varsa (öncelikli)
    if (item.extraOffersJson) {
      try {
        const parsed = JSON.parse(item.extraOffersJson);
  
        if (Array.isArray(parsed)) {
          dumps = parsed.map((o: any) => ({
            place: o.name || o.unloading || '-',
            cash: o.cash ? `${o.cash}₺` : '-',
            fuel: o.fuel ? `${o.fuel} LT` : '-',
          }));
        }
      } catch (e) {
        console.log('extraOffersJson parse error', e);
      }
    }
  
    // 🔹 2. extraOffersJson yoksa offer1 / offer2 fallback
    if (dumps.length === 0) {
      if (item.offer1Name) {
        dumps.push({
          place: item.offer1Name,
          cash: item.offer1Cash ? `${item.offer1Cash}₺` : '-',
          fuel: item.offer1Fuel ? `${item.offer1Fuel} LT` : '-',
        });
      }
  
      if (item.offer2Name) {
        dumps.push({
          place: item.offer2Name,
          cash: item.offer2Cash ? `${item.offer2Cash}₺` : '-',
          fuel: item.offer2Fuel ? `${item.offer2Fuel} LT` : '-',
        });
      }
    }
  
    return {
      id: item.id,
      company: item.companyName,
      site: item.name,
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
  