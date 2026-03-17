export const mapJobFromApi = (item: any) => {
  // ─── Hafriyat/Döküm: dumps (döküm yeri + nakit + mazot) ──────────────────
  let dumps: { place: string; cash: string; fuel: string }[] = [];

  if (item.jobType !== 1) {
    // 1. Offer 1
    if (item.offer1Name) {
      dumps.push({
        place: item.offer1Name,
        cash: item.offer1Cash ? `${item.offer1Cash}₺` : '-',
        fuel: item.offer1Fuel ? `${item.offer1Fuel} LT` : '-',
      });
    }

    // 2. extraOffersJson
    if (item.extraOffersJson) {
      try {
        const parsed = JSON.parse(item.extraOffersJson);
        if (Array.isArray(parsed)) {
          parsed.forEach((o: any) => {
            dumps.push({
              place: o.dumpLocation || o.name || o.unloading || '-',
              cash: o.cash ? `${o.cash}₺` : '-',
              fuel: o.fuel ? `${o.fuel} LT` : '-',
            });
          });
        }
      } catch (e) {
        console.log('extraOffersJson parse error', e);
      }
    }

    // Fallback: offer2
    if (dumps.length === 0 && item.offer2Name) {
      dumps.push({
        place: item.offer2Name,
        cash: item.offer2Cash ? `${item.offer2Cash}₺` : '-',
        fuel: item.offer2Fuel ? `${item.offer2Fuel} LT` : '-',
      });
    }
  }

  // ─── Kum/Mıcır: routes (yükleme → boşaltma, ₺/ton, malzeme) ─────────────
  let routes: { loading: string; unloading: string; cash: string; material: string }[] = [];

  if (item.jobType === 1 && item.extraOffersJson) {
    try {
      const parsed = JSON.parse(item.extraOffersJson);
      if (Array.isArray(parsed)) {
        routes = parsed.map((r: any) => ({
          loading: r.loading || '-',
          unloading: r.unloading || '-',
          cash: r.cash != null ? `${r.cash}₺/ton` : '-',
          material: r.material || '-',
        }));
      }
    } catch (e) {
      console.log('extraOffersJson (kum/mıcır) parse error', e);
    }
  }

  return {
    id: item.id,
    company: item.companyName,
    site: item.name,
    jobType: item.jobType, // 0: Hafriyat, 1: Kum/Mıcır
    loadingStartTime: item.loadingStartTime,
    loadingEndTime: item.loadingEndTime,
    logo: item.companyLogoBase64
      ? { uri: item.companyLogoBase64 }
      : require('../../assets/logokarakalem.png'),

    dumps,   // Hafriyat
    routes,  // Kum/Mıcır

    status: item.isActive ? 'Yükleme Devam Ediyor' : 'Pasif',
    statusColor: item.isActive ? '#C8E6C9' : '#FFE0E0',

    phone: item.contactPhone,
    locationUrl: item.locationUrl,
    description: item.description,
    provinceCode: item.provinceCode,
    districtName: item.districtName ?? '',
  };
};
