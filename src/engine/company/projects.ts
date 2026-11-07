import { CompanyProject } from '../core/types';
import { Rng } from '../dynamics/rng';
import { generateProject } from '../dynamics/projects';

const CLIENT_NAMES = [
  'Reliance Digital Logistics', 'Tata Steel Horizons', 'Infosys Cloud Systems', 'HDFC Horizon Capital',
  'Sun Pharma Biosolutions', 'Mahindra Tech Works', 'Adani Power Grid', 'Flipkart Supply Chain',
  'Zomato Hyperlocal Networks', 'Paytm Secure Rails', 'Wipro Enterprise Systems', 'L&T Infotech'
];

const PROJECT_TITLES = [
  'Enterprise Cloud Infrastructure', 'Real-time Payment Rails Engine', 'Automated Warehouse Dispatch ERP',
  'Predictive Healthcare Analytics', 'Omnichannel Inventory Portal', 'High-Frequency Matching Engine',
  'IoT Sensor Fleet Monitoring', 'Telecom 5G Network Orchestrator', 'AI Document Processing Pipeline'
];

export function createDefaultProjects(day = 1): CompanyProject[] {
  return [
    {
      id: 'proj_init_1',
      name: 'Real-time Payment Rails Engine',
      clientName: 'HDFC Horizon Capital',
      size: 150,
      workCompleted: 60,
      payout: 25000000, // ₹2.5 Cr
      deadlineDay: day + 25,
      status: 'active',
      clientDefaultRisk: 0.02,
    },
    {
      id: 'proj_init_2',
      name: 'Omnichannel Inventory Portal',
      clientName: 'Flipkart Supply Chain',
      size: 120,
      workCompleted: 10,
      payout: 18000000, // ₹1.8 Cr
      deadlineDay: day + 40,
      status: 'active',
      clientDefaultRisk: 0.04,
    },
    {
      id: 'proj_init_3',
      name: 'Predictive Healthcare Analytics',
      clientName: 'Sun Pharma Biosolutions',
      size: 200,
      workCompleted: 0,
      payout: 32000000, // ₹3.2 Cr
      deadlineDay: day + 55,
      status: 'available',
      clientDefaultRisk: 0.03,
    },
  ];
}

export function generateClientProject(day: number, marketingLevel: number, rng: Rng): CompanyProject {
  const pGen = generateProject(rng, { marketing: marketingLevel, heat: 0.5 });
  const clientIdx = Math.floor(rng.next() * CLIENT_NAMES.length);
  const titleIdx = Math.floor(rng.next() * PROJECT_TITLES.length);

  const size = Math.round(Math.max(60, pGen.size * 2));
  const payout = Math.round(size * pGen.payoutPerUnit * 120000);

  return {
    id: `proj_${day}_${Math.floor(rng.next() * 100000)}`,
    name: PROJECT_TITLES[titleIdx],
    clientName: CLIENT_NAMES[clientIdx],
    size,
    workCompleted: 0,
    payout: Math.max(5000000, payout),
    deadlineDay: day + Math.max(20, pGen.deadline),
    status: 'available',
    clientDefaultRisk: pGen.clientDefaultRisk,
  };
}
