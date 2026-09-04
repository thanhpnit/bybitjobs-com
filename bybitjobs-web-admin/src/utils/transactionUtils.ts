export interface UnifiedTransaction {
  id: string;
  orderCode?: string;
  date: string;
  rawDate: Date;
  company: string;
  name: string;
  package: string;
  packageName: string;
  amount: string;
  rawPrice: number;
  rawAmount: number;
  method: string;
  time: string;
  status: 'Completed' | 'Pending' | 'Failed';
  statusType: 'success' | 'warning' | 'danger';
  color: string;
  bg: string;
}

export const getDeterministicMockTransactions = (): UnifiedTransaction[] => {
  const mockList: UnifiedTransaction[] = [];
  
  // Specific daily revenue targets to match Overview chart exactly (Total 12,698,000 VNĐ)
  const dailyTargets: { [dateStr: string]: { amount: number; company: string; pkg: string; isPro?: boolean; isVip?: boolean }[] } = {
    '28/08/2026': [
      { amount: 1500000, company: 'Tập đoàn Công nghệ Alpha', pkg: 'PRO (DOANH NGHIỆP ⭐️)', isPro: true },
      { amount: 1000000, company: 'Công ty TNHH Global Tech', pkg: 'STARTER' }
    ],
    '29/08/2026': [
      { amount: 600000, company: 'Công ty TNHH VNG Corp', pkg: 'STARTER' }
    ],
    '30/08/2026': [
      { amount: 2000000, company: 'Tập đoàn FPT Software', pkg: 'PREMIUM (VIP 👑)', isVip: true }
    ],
    '31/08/2026': [
      { amount: 2000000, company: 'Công ty Shopee Việt Nam', pkg: 'PREMIUM (VIP 👑)', isVip: true }
    ],
    '01/09/2026': [
      { amount: 600000, company: 'Công ty Grab Việt Nam', pkg: 'STARTER' }
    ],
    '02/09/2026': [
      { amount: 300000, company: 'Công ty TNHH Baemin', pkg: 'STARTER' }
    ],
    '03/09/2026': [
      { amount: 3150000, company: 'Tập đoàn Công nghệ Bybit Global', pkg: 'PREMIUM (VIP 👑)', isVip: true }
    ],
    '04/09/2026': [
      { amount: 1049000, company: 'Công ty TNHH Giao Hàng Nhanh', pkg: 'PRO (DOANH NGHIỆP ⭐️)', isPro: true }
    ]
  };

  Object.entries(dailyTargets).forEach(([dateStr, items]) => {
    const [dStr, mStr, yStr] = dateStr.split('/');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10) - 1;
    const day = parseInt(dStr, 10);

    items.forEach((item, idx) => {
      const dateObj = new Date(year, month, day, 10 + idx * 2, 15 + idx * 10, 0);
      const isVip = item.isVip || item.pkg.includes('PREMIUM');
      const isPro = item.isPro || item.pkg.includes('PRO');

      mockList.push({
        id: `#TXN-MOCK-${year}${mStr}${dStr}-${idx}`,
        orderCode: `MOCK-${year}${mStr}${dStr}-${idx}`,
        date: `${dStr}/${mStr}/${year} ${10 + idx * 2}:15`,
        rawDate: dateObj,
        company: item.company,
        name: item.company,
        package: item.pkg,
        packageName: item.pkg,
        amount: `${item.amount.toLocaleString('vi-VN')} đ`,
        rawPrice: item.amount,
        rawAmount: item.amount,
        method: 'PayOS',
        time: `${10 + idx * 2}:15 ${dStr}/${mStr}/${year}`,
        status: 'Completed',
        statusType: 'success',
        color: isVip ? '#D97706' : (isPro ? '#0066FF' : '#6B7280'),
        bg: isVip ? '#FEF3C7' : (isPro ? '#E6F0FF' : '#F3F4F6')
      });
    });
  });

  return mockList;
};

export const buildRevenueChartData = (
  transactions: UnifiedTransaction[],
  viewMode: '7days' | '30days' | 'month' | 'custom' | 'day',
  fromDateStr: string,
  toDateStr: string
) => {
  const now = new Date();

  if (viewMode === 'month') {
    const currentYear = now.getFullYear();
    const monthlyRows = [];

    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(currentYear, m, 1, 0, 0, 0, 0);
      const monthEnd = new Date(currentYear, m + 1, 0, 23, 59, 59, 999);
      const monthStr = `Tháng ${(m + 1).toString().padStart(2, '0')}/${currentYear}`;

      const monthTxns = transactions.filter(t => {
        if (t.status !== 'Completed' && (t as any).statusType !== 'success') return false;
        return t.rawDate >= monthStart && t.rawDate <= monthEnd;
      });

      const allMonthTxns = transactions.filter(t => t.rawDate >= monthStart && t.rawDate <= monthEnd);
      const dailyRev = monthTxns.reduce((sum, t) => sum + (t.rawPrice || 0), 0);

      monthlyRows.push({
        date: monthStr,
        totalOrders: allMonthTxns.length,
        successOrders: monthTxns.length,
        revenue: dailyRev,
      });
    }

    const activeRows = monthlyRows.filter(r => r.totalOrders > 0 || r.revenue > 0);
    const maxRev = Math.max(...monthlyRows.map(r => r.revenue), 1);
    return { allRows: monthlyRows, activeRows, maxRev };
  } else if (viewMode === '30days') {
    const weeklyRows = [];
    const twentyEightDaysAgo = new Date(now);
    twentyEightDaysAgo.setDate(now.getDate() - 28);

    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(twentyEightDaysAgo);
      weekStart.setDate(twentyEightDaysAgo.getDate() + w * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekLabel = `Tuần ${w + 1} (${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1})`;

      const weekTxns = transactions.filter(t => {
        if (t.status !== 'Completed' && (t as any).statusType !== 'success') return false;
        return t.rawDate >= weekStart && t.rawDate <= weekEnd;
      });

      const allWeekTxns = transactions.filter(t => t.rawDate >= weekStart && t.rawDate <= weekEnd);
      const weekRev = weekTxns.reduce((sum, t) => sum + (t.rawPrice || 0), 0);

      weeklyRows.push({
        date: weekLabel,
        totalOrders: allWeekTxns.length,
        successOrders: weekTxns.length,
        revenue: weekRev,
      });
    }

    const activeRows = weeklyRows.filter(r => r.totalOrders > 0 || r.revenue > 0);
    const maxRev = Math.max(...weeklyRows.map(r => r.revenue), 1);
    return { allRows: weeklyRows, activeRows, maxRev };
  } else if (viewMode === 'custom') {
    const start = new Date(fromDateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDateStr);
    end.setHours(23, 59, 59, 999);

    const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))) + 1;
    const customRows = [];

    for (let i = 0; i < daysDiff; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;

      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTxns = transactions.filter(t => {
        if (t.status !== 'Completed' && (t as any).statusType !== 'success') return false;
        return t.rawDate >= dayStart && t.rawDate <= dayEnd;
      });

      const allDayTxns = transactions.filter(t => t.rawDate >= dayStart && t.rawDate <= dayEnd);
      const dailyRev = dayTxns.reduce((sum, t) => sum + (t.rawPrice || 0), 0);

      customRows.push({
        date: dateStr,
        totalOrders: allDayTxns.length,
        successOrders: dayTxns.length,
        revenue: dailyRev,
      });
    }

    const activeRows = customRows.filter(r => r.totalOrders > 0 || r.revenue > 0);
    const maxRev = Math.max(...customRows.map(r => r.revenue), 1);
    return { allRows: customRows, activeRows, maxRev };
  } else {
    // 7days or day mode - Show 8 days back from today to include 28/08 to 04/09
    const dailyRows = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);

      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;

      const dayTxns = transactions.filter(t => {
        if (t.status !== 'Completed' && (t as any).statusType !== 'success') return false;
        return t.rawDate >= dayStart && t.rawDate <= dayEnd;
      });

      const allDayTxns = transactions.filter(t => t.rawDate >= dayStart && t.rawDate <= dayEnd);
      const dailyRev = dayTxns.reduce((sum, t) => sum + (t.rawPrice || 0), 0);

      dailyRows.push({
        date: dateStr,
        totalOrders: allDayTxns.length,
        successOrders: dayTxns.length,
        revenue: dailyRev,
      });
    }

    const activeRows = dailyRows.filter(r => r.totalOrders > 0 || r.revenue > 0);
    const maxRev = Math.max(...dailyRows.map(r => r.revenue), 1);

    return { allRows: dailyRows, activeRows, maxRev };
  }
};
