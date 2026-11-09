import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  Building2,
  Share2,
  FileSpreadsheet,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Printer,
  X,
  Layers,
  Users,
  AlertCircle,
  MessageSquare,
  Copy,
  Download
} from 'lucide-react';

export const MINIMUM_PAYABLE_RATES = {
  zone1_ne_wb: { indian: 2000, western: 4300, yoga: 2500 },
  zone4_kolkata: { indian: 2000, western: 4300, yoga: 2500 },
  zone3_central_east: { indian: 3000, western: 5500, yoga: 2500 },
  zone2_other: { indian: 4000, western: 6400, yoga: 2500 },
};

export const CHURAMONI_EXAM_RATES = {
  zone1_ne_wb: { under15: 2200, equalOrAbove15: 1600 },
  zone4_kolkata: { under15: 2200, equalOrAbove15: 1600 },
  zone3_central_east: { under15: 2200, equalOrAbove15: 1600 },
  zone2_other: { under15: 2600, equalOrAbove15: 1900 },
};

export const detectStateAndZoneFromAddress = (addressStr) => {
  if (!addressStr) return { state: 'West Bengal', zone: 'zone1_ne_wb' };
  const str = addressStr.toLowerCase();

  // 1. PIN code detection
  const pinMatch = str.match(/\b([1-9]\d{5})\b/);
  if (pinMatch) {
    const pin = pinMatch[1];
    const p3 = parseInt(pin.substring(0, 3), 10);
    const p2 = parseInt(pin.substring(0, 2), 10);

    // Rule: Strictly 700xxx is Kolkata Zone
    if (pin.startsWith('700')) {
      return { state: 'Kolkata Zone', zone: 'zone4_kolkata' };
    }

    // WB & NE (Zone 1): 71-74, 78-79, 737
    if ((p2 >= 71 && p2 <= 74) || (p2 >= 78 && p2 <= 79) || p3 === 737) {
      if (p3 === 737) return { state: 'Sikkim', zone: 'zone1_ne_wb' };
      if (p3 >= 781 && p3 <= 788) return { state: 'Assam', zone: 'zone1_ne_wb' };
      if (p3 === 793 || p3 === 794) return { state: 'Meghalaya', zone: 'zone1_ne_wb' };
      if (p3 === 795) return { state: 'Manipur', zone: 'zone1_ne_wb' };
      if (p3 === 796) return { state: 'Mizoram', zone: 'zone1_ne_wb' };
      if (p3 === 797) return { state: 'Nagaland', zone: 'zone1_ne_wb' };
      if (p3 >= 790 && p3 <= 792) return { state: 'Arunachal Pradesh', zone: 'zone1_ne_wb' };
      if (p3 === 799) return { state: 'Tripura', zone: 'zone1_ne_wb' };
      return { state: 'West Bengal', zone: 'zone1_ne_wb' };
    }

    // Central East (Zone 3): 49 (Chhattisgarh), 75-77 (Odisha), 80-85 (Bihar/Jharkhand)
    if (p2 === 49) {
      return { state: 'Chhattisgarh', zone: 'zone3_central_east' };
    }
    if (p2 >= 75 && p2 <= 77) {
      return { state: 'Odisha', zone: 'zone3_central_east' };
    }
    if ((p3 >= 814 && p3 <= 816) || (p3 >= 825 && p3 <= 835)) {
      return { state: 'Jharkhand', zone: 'zone3_central_east' };
    }
    if (p2 >= 80 && p2 <= 85) {
      return { state: 'Bihar', zone: 'zone3_central_east' };
    }

    // Other States & UTs (Zone 2)
    if (p2 === 11) return { state: 'Delhi (U.T.)', zone: 'zone2_other' };
    if (p2 === 12 || p2 === 13) return { state: 'Haryana', zone: 'zone2_other' };
    if (p2 === 14 || p2 === 15) return { state: 'Punjab', zone: 'zone2_other' };
    if (p2 === 16) return { state: 'Chandigarh (U.T.)', zone: 'zone2_other' };
    if (p2 === 17) return { state: 'Himachal Pradesh', zone: 'zone2_other' };
    if (p2 === 18 || p2 === 19) return { state: 'Jammu & Kashmir (U.T.)', zone: 'zone2_other' };
    if (p2 >= 20 && p2 <= 28) {
      if (p3 === 248 || p3 === 249 || p3 === 262 || p3 === 263) return { state: 'Uttarakhand', zone: 'zone2_other' };
      return { state: 'Uttar Pradesh', zone: 'zone2_other' };
    }
    if (p2 >= 30 && p2 <= 34) return { state: 'Rajasthan', zone: 'zone2_other' };
    if (p2 >= 36 && p2 <= 39) return { state: 'Gujarat', zone: 'zone2_other' };
    if (p2 >= 40 && p2 <= 44) {
      if (p3 === 403) return { state: 'Goa', zone: 'zone2_other' };
      return { state: 'Maharashtra', zone: 'zone2_other' };
    }
    if (p2 >= 45 && p2 <= 48) return { state: 'Madhya Pradesh', zone: 'zone2_other' };
    if (p2 >= 50 && p2 <= 53) {
      if (p3 >= 500 && p3 <= 509) return { state: 'Telangana', zone: 'zone2_other' };
      return { state: 'Andhra Pradesh', zone: 'zone2_other' };
    }
    if (p2 >= 56 && p2 <= 59) return { state: 'Karnataka', zone: 'zone2_other' };
    if (p2 >= 60 && p2 <= 64) {
      if (p3 === 605) return { state: 'Other State / U.T.', zone: 'zone2_other' };
      return { state: 'Tamil Nadu', zone: 'zone2_other' };
    }
    if (p2 >= 67 && p2 <= 69) return { state: 'Kerala', zone: 'zone2_other' };
  }

  // 2. Text name matching fallback
  if (str.includes('700') || str.includes('kolkata') || str.includes('calcutta')) {
    return { state: 'Kolkata Zone', zone: 'zone4_kolkata' };
  }
  if (str.includes('chhattisgarh') || str.includes('chattisgarh') || str.includes('chhatisgarh') || str.includes('c.g.') || /\bcg\b/.test(str) || str.includes('raipur') || str.includes('bilaspur') || str.includes('bhilai') || str.includes('durg') || str.includes('korba') || str.includes('rajnandgaon') || str.includes('jagdalpur')) {
    return { state: 'Chhattisgarh', zone: 'zone3_central_east' };
  }
  if (str.includes('bihar') || str.includes('patna') || str.includes('gaya') || str.includes('muzaffarpur') || str.includes('bhagalpur') || str.includes('darbhanga')) {
    return { state: 'Bihar', zone: 'zone3_central_east' };
  }
  if (str.includes('jharkhand') || str.includes('ranchi') || str.includes('jamshedpur') || str.includes('dhanbad') || str.includes('bokaro') || str.includes('deoghar')) {
    return { state: 'Jharkhand', zone: 'zone3_central_east' };
  }
  if (str.includes('odisha') || str.includes('orissa') || str.includes('bhubaneswar') || str.includes('cuttack') || str.includes('puri') || str.includes('rourkela') || str.includes('balasore') || str.includes('sambalpur')) {
    return { state: 'Odisha', zone: 'zone3_central_east' };
  }
  if (str.includes('west bengal') || str.includes('wb') || str.includes('hooghly') || str.includes('howrah') || str.includes('serampore') || str.includes('burdwan') || str.includes('bardhaman') || str.includes('siliguri') || str.includes('jalpaiguri') || str.includes('midnapore') || str.includes('medinipur') || str.includes('nadia') || str.includes('murshidabad') || str.includes('birbhum') || str.includes('bankura') || str.includes('purulia') || str.includes('malda')) {
    return { state: 'West Bengal', zone: 'zone1_ne_wb' };
  }
  if (str.includes('assam') || str.includes('guwahati') || str.includes('silchar') || str.includes('dibrugarh') || str.includes('jorhat') || str.includes('nagaon')) {
    return { state: 'Assam', zone: 'zone1_ne_wb' };
  }
  if (str.includes('tripura') || str.includes('agartala')) {
    return { state: 'Tripura', zone: 'zone1_ne_wb' };
  }
  if (str.includes('meghalaya') || str.includes('shillong')) {
    return { state: 'Meghalaya', zone: 'zone1_ne_wb' };
  }
  if (str.includes('sikkim') || str.includes('gangtok')) {
    return { state: 'Sikkim', zone: 'zone1_ne_wb' };
  }
  if (str.includes('delhi')) return { state: 'Delhi (U.T.)', zone: 'zone2_other' };
  if (str.includes('uttar pradesh') || str.includes('up') || str.includes('lucknow') || str.includes('kanpur') || str.includes('varanasi') || str.includes('agra') || str.includes('noida') || str.includes('ghaziabad') || str.includes('prayagraj') || str.includes('allahabad')) {
    return { state: 'Uttar Pradesh', zone: 'zone2_other' };
  }
  if (str.includes('madhya pradesh') || str.includes('mp') || str.includes('bhopal') || str.includes('indore') || str.includes('jabalpur') || str.includes('gwalior')) {
    return { state: 'Madhya Pradesh', zone: 'zone2_other' };
  }
  if (str.includes('maharashtra') || str.includes('mumbai') || str.includes('pune') || str.includes('nagpur') || str.includes('nashik') || str.includes('aurangabad')) {
    return { state: 'Maharashtra', zone: 'zone2_other' };
  }
  if (str.includes('rajasthan') || str.includes('jaipur') || str.includes('jodhpur') || str.includes('udaipur') || str.includes('kota')) {
    return { state: 'Rajasthan', zone: 'zone2_other' };
  }
  if (str.includes('gujarat') || str.includes('ahmedabad') || str.includes('surat') || str.includes('vadodara') || str.includes('rajkot')) {
    return { state: 'Gujarat', zone: 'zone2_other' };
  }
  if (str.includes('punjab')) {
    return { state: 'Punjab', zone: 'zone2_other' };
  }
  if (str.includes('haryana')) {
    return { state: 'Haryana', zone: 'zone2_other' };
  }

  return { state: 'West Bengal', zone: 'zone1_ne_wb' };
};

const STATE_ZONE_MAP = {
  'West Bengal': 'zone1_ne_wb',
  'Assam': 'zone1_ne_wb',
  'Tripura': 'zone1_ne_wb',
  'Meghalaya': 'zone1_ne_wb',
  'Manipur': 'zone1_ne_wb',
  'Mizoram': 'zone1_ne_wb',
  'Nagaland': 'zone1_ne_wb',
  'Arunachal Pradesh': 'zone1_ne_wb',
  'Sikkim': 'zone1_ne_wb',
  'Kolkata Zone': 'zone4_kolkata',
  'Bihar': 'zone3_central_east',
  'Chhattisgarh': 'zone3_central_east',
  'Jharkhand': 'zone3_central_east',
  'Odisha': 'zone3_central_east',
  'Andhra Pradesh': 'zone2_other',
  'Goa': 'zone2_other',
  'Gujarat': 'zone2_other',
  'Haryana': 'zone2_other',
  'Himachal Pradesh': 'zone2_other',
  'Karnataka': 'zone2_other',
  'Kerala': 'zone2_other',
  'Madhya Pradesh': 'zone2_other',
  'Maharashtra': 'zone2_other',
  'Punjab': 'zone2_other',
  'Rajasthan': 'zone2_other',
  'Tamil Nadu': 'zone2_other',
  'Telangana': 'zone2_other',
  'Uttarakhand': 'zone2_other',
  'Uttar Pradesh': 'zone2_other',
  'Delhi (U.T.)': 'zone2_other',
  'Chandigarh (U.T.)': 'zone2_other',
  'Jammu & Kashmir (U.T.)': 'zone2_other',
  'Other State / U.T.': 'zone2_other',
};

// Compact Detected Zone labels without Convo fees taking horizontal space
const ZONE_DISPLAY_LABELS = {
  'zone1_ne_wb': 'Zone 1: WB & NE',
  'zone4_kolkata': 'Zone 4: Kolkata',
  'zone3_central_east': 'Zone 3: Central-East',
  'zone2_other': 'Zone 2: Other States',
  'yoga': 'Universal Yoga'
};

const DISCIPLINE_LABELS = {
  indian: 'Indian Classical / Traditional',
  western: 'Western Music & Dance',
  yoga: 'Universal Yoga'
};

export default function BillingDesk({ loadedBillId, onClearLoadedBill }) {
  // Master bill mode: 'single' | 'joint'
  const [billMode, setBillMode] = useState('single');
  const [billRecordId, setBillRecordId] = useState(null);

  // Master selection
  const [shortCode, setShortCode] = useState('0001');
  const [centreSearchResults, setCentreSearchResults] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);

  // State selection & Auto Zone
  const [selectedState, setSelectedState] = useState('Bihar');
  const [zone, setZone] = useState('zone3_central_east');

  // Shared Bill Metadata
  const [billDate, setBillDate] = useState('2026-06-01');
  const [session, setSession] = useState('2026-27');

  // Centre details
  const [centreCode, setCentreCode] = useState('');
  const [centreName, setCentreName] = useState('Example Centre');
  const [principal, setPrincipal] = useState('Saswata Ghosh');
  const [address, setAddress] = useState('Hooghly, 712201');
  const [phone, setPhone] = useState('');
  const [helplinePhone, setHelplinePhone] = useState(() => localStorage.getItem('kendra_helpline_phone') || '');

  // Duplicate Check Modal State
  const [duplicateModal, setDuplicateModal] = useState({
    isOpen: false,
    existingBill: null,
    pendingAction: null // 'save' | 'export'
  });

  // WhatsApp Share Modal State & Toast
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [renderedExcelImages, setRenderedExcelImages] = useState([]);
  const [copiedSteps, setCopiedSteps] = useState({});
  const [shareToast, setShareToast] = useState('');
  const tableCaptureRefs = useRef({});

  // Discount Slabs & Settings
  const [discountSlabs, setDiscountSlabs] = useState([]);
  const [extraLess, setExtraLess] = useState('10'); // Default Extra Less from Settings
  const [seasonalDiscount, setSeasonalDiscount] = useState('0'); // Seasonal Concession

  // Single bill category: 'indian' | 'western' | 'yoga'
  const [singleCategory, setSingleCategory] = useState('indian');

  // Joint bills active status (freely add or remove ANY discipline)
  const [jointActive, setJointActive] = useState({
    indian: true,
    western: true,
    yoga: false
  });

  // Joint View Mode: 'stacked' (one below another) or 'tabs'
  const [jointViewMode, setJointViewMode] = useState('stacked');

  // Current active tab when in tabs view
  const [activeTab, setActiveTab] = useState('indian');

  // Discipline State Store
  const [disciplinesData, setDisciplinesData] = useState({
    indian: {
      items: [],
      examinerSchoolCount: '2',
      examinerFeeAmount: '0',
      saved: false
    },
    western: {
      items: [],
      examinerSchoolCount: '2',
      examinerFeeAmount: '0',
      saved: false
    },
    yoga: {
      items: [],
      examinerSchoolCount: '2',
      examinerFeeAmount: '0',
      saved: false
    }
  });

  // UI state
  const [saveStatus, setSaveStatus] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Refs for keyboard navigation
  const inputsRef = useRef({});
  const examinerSchoolsRef = useRef({});
  const examinerAmountRef = useRef({});
  const shortCodeInputRef = useRef(null);

  // 1. Initial Load settings
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.discount_slabs) setDiscountSlabs(data.discount_slabs);
        if (data.settings) {
          if (data.settings.extra_less !== undefined) setExtraLess(String(data.settings.extra_less));
          if (data.settings.seasonal_discount !== undefined) setSeasonalDiscount(String(data.settings.seasonal_discount));
          if (data.settings.session) setSession(data.settings.session);
          if (data.settings.helpline_whatsapp && !localStorage.getItem('kendra_helpline_phone')) {
            setHelplinePhone(data.settings.helpline_whatsapp);
          }
        }
      });
  }, []);

  // 2. Load Bill for editing if loadedBillId passed from Bill History
  useEffect(() => {
    if (loadedBillId) {
      fetch(`/api/bills/${loadedBillId}`)
        .then((res) => res.json())
        .then((b) => {
          setBillRecordId(b.id);
          setShortCode(b.centre_short_code || '');
          setCentreName(b.centre_name || '');
          setPrincipal(b.principal || '');
          setAddress(b.address || '');
          setPhone(b.phone || '');
          setBillDate(b.bill_date || '2026-06-01');
          setSession(b.session || '2026-27');
          setZone(b.zone || 'zone1_ne_wb');
          if (b.extra_less_percent !== undefined) setExtraLess(String(b.extra_less_percent));
          if (b.seasonal_discount_percent !== undefined) setSeasonalDiscount(String(b.seasonal_discount_percent));

          const isJ = Number(b.is_joint) === 1 || String(b.is_joint).trim() === '1.0' || b.category === 'joint' || Boolean(b.joint_data);

          if (isJ) {
            setBillMode('joint');
            if (b.joint_data) {
              try {
                const jd = typeof b.joint_data === 'string' ? JSON.parse(b.joint_data) : b.joint_data;
                if (jd && jd.disciplines) {
                  const newActive = {};
                  setDisciplinesData((prev) => {
                    const updated = { ...prev };
                    for (const k of ['indian', 'western', 'yoga']) {
                      if (jd.disciplines[k]) {
                        newActive[k] = Boolean(jd.disciplines[k].active);
                        if (jd.disciplines[k].items) {
                          updated[k] = {
                            items: jd.disciplines[k].items,
                            examinerSchoolCount: jd.disciplines[k].examinerSchoolCount || '2',
                            examinerFeeAmount: String(jd.disciplines[k].examinerFeeAmount || '0'),
                            saved: true
                          };
                        }
                      }
                    }
                    return updated;
                  });
                  setJointActive((prev) => ({ ...prev, ...newActive }));
                  // Set active tab to first active discipline
                  const firstActive = Object.keys(newActive).find((k) => newActive[k]);
                  if (firstActive) setActiveTab(firstActive);
                }
              } catch (e) {
                console.error('Error parsing joint_data:', e);
              }
            }
          } else {
            setBillMode('single');
            const cat = b.category || 'indian';
            setSingleCategory(cat);
            setActiveTab(cat);

            const parsedItems = (b.items || []).map((it, idx) => ({
              id: it.id,
              level_name: it.level_name,
              level_order: it.level_order || (idx + 1),
              exam_fee: it.exam_fee,
              convocation_fee: it.convocation_fee,
              old_count: String(it.old_count || 0),
              new_count: String(it.new_count || 0)
            }));

            const exAmount = b.examiner_fee_amount > 0 ? String(b.examiner_fee_amount) : '0';
            const match = (b.examiner_fee_note || '').match(/\d+/);
            const exSchools = match ? match[0] : '2';

            setDisciplinesData((prev) => ({
              ...prev,
              [cat]: {
                items: parsedItems,
                examinerSchoolCount: exSchools,
                examinerFeeAmount: exAmount,
                saved: true
              }
            }));
          }
        });
    }
  }, [loadedBillId]);

  // 3. Update zone when state changes manually
  const handleStateChange = (stateName) => {
    setSelectedState(stateName);
    const mappedZone = STATE_ZONE_MAP[stateName] || 'zone2_other';
    setZone(mappedZone);
  };

  // 4. Fetch rates dynamically for all disciplines whenever zone changes
  useEffect(() => {
    if (loadedBillId) return;

    // Fetch Indian rates
    fetch(`/api/rates?zone=${zone}&category=indian`)
      .then((res) => res.json())
      .then((rates) => {
        setDisciplinesData((prev) => {
          const countMap = {};
          for (const it of prev.indian.items) {
            countMap[it.level_name] = { old: it.old_count, new: it.new_count };
          }
          const items = rates.map((r, idx) => ({
            id: r.id,
            level_name: r.level_name,
            level_order: r.level_order || (idx + 1),
            exam_fee: r.exam_fee,
            convocation_fee: r.convocation_fee,
            old_count: countMap[r.level_name]?.old !== undefined ? countMap[r.level_name].old : '0',
            new_count: countMap[r.level_name]?.new !== undefined ? countMap[r.level_name].new : '0'
          }));
          return { ...prev, indian: { ...prev.indian, items } };
        });
      });

    // Fetch Western rates
    fetch(`/api/rates?zone=${zone}&category=western`)
      .then((res) => res.json())
      .then((rates) => {
        setDisciplinesData((prev) => {
          const countMap = {};
          for (const it of prev.western.items) {
            countMap[it.level_name] = { old: it.old_count, new: it.new_count };
          }
          const items = rates.map((r, idx) => ({
            id: r.id,
            level_name: r.level_name,
            level_order: r.level_order || (idx + 1),
            exam_fee: r.exam_fee,
            convocation_fee: r.convocation_fee,
            old_count: countMap[r.level_name]?.old !== undefined ? countMap[r.level_name].old : '0',
            new_count: countMap[r.level_name]?.new !== undefined ? countMap[r.level_name].new : '0'
          }));
          return { ...prev, western: { ...prev.western, items } };
        });
      });

    // Fetch Yoga rates
    fetch(`/api/rates?category=yoga`)
      .then((res) => res.json())
      .then((rates) => {
        setDisciplinesData((prev) => {
          const countMap = {};
          for (const it of prev.yoga.items) {
            countMap[it.level_name] = { old: it.old_count, new: it.new_count };
          }
          const items = rates.map((r, idx) => ({
            id: r.id,
            level_name: r.level_name,
            level_order: r.level_order || (idx + 1),
            exam_fee: r.exam_fee,
            convocation_fee: r.convocation_fee,
            old_count: countMap[r.level_name]?.old !== undefined ? countMap[r.level_name].old : '0',
            new_count: countMap[r.level_name]?.new !== undefined ? countMap[r.level_name].new : '0'
          }));
          return { ...prev, yoga: { ...prev.yoga, items } };
        });
      });
  }, [zone]);

  // 5. Short Code Search & Keyboard Selection
  const handleShortCodeSearch = (val) => {
    setShortCode(val);
    const cleanVal = val ? val.trim() : '';
    if (!cleanVal || cleanVal.length < 1) {
      setCentreSearchResults([]);
      setActiveSearchIndex(0);
      return;
    }
    fetch(`/api/centres/search?q=${encodeURIComponent(cleanVal)}`)
      .then((res) => res.json())
      .then((data) => {
        const results = data || [];
        setCentreSearchResults(results);
        const exactIdx = results.findIndex(
          (c) => String(c.short_code).trim() === cleanVal || String(c.centre_code).trim() === cleanVal
        );
        setActiveSearchIndex(exactIdx >= 0 ? exactIdx : 0);
      });
  };

  const handleShortCodeBlur = () => {
    const cleanVal = shortCode ? shortCode.trim() : '';
    if (!cleanVal) return;
    fetch(`/api/centres/${encodeURIComponent(cleanVal)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((exactCentre) => {
        if (exactCentre && !exactCentre.error && String(exactCentre.short_code).trim() === cleanVal) {
          selectCentre(exactCentre);
        }
      })
      .catch(() => {});
  };

  const selectCentre = (c) => {
    setShortCode(c.short_code);
    setCentreName(c.centre_name || '');
    setPrincipal(c.principal || '');
    const fullAddr = c.full_address || c.address || '';
    setAddress(fullAddr);
    setPhone(c.whatsapp || c.phone1 || c.phone2 || '');
    setCentreSearchResults([]);

    const detected = detectStateAndZoneFromAddress(fullAddr);
    handleStateChange(detected.state);

    setTimeout(() => {
      const activeDisc = billMode === 'joint' ? (jointViewMode === 'stacked' ? activeDisciplinesList[0] : activeTab) : singleCategory;
      if (inputsRef.current[activeDisc]?.[0]?.[0]) {
        inputsRef.current[activeDisc][0][0].focus();
        inputsRef.current[activeDisc][0][0].select();
      }
    }, 100);
  };

  const handleShortCodeKeyDown = (e) => {
    const cleanVal = shortCode ? shortCode.trim() : '';

    if (e.key === 'ArrowDown') {
      if (centreSearchResults.length === 0) return;
      e.preventDefault();
      setActiveSearchIndex((prev) => (prev + 1) % centreSearchResults.length);
    } else if (e.key === 'ArrowUp') {
      if (centreSearchResults.length === 0) return;
      e.preventDefault();
      setActiveSearchIndex((prev) => (prev - 1 + centreSearchResults.length) % centreSearchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const exactMatch = centreSearchResults.find((c) => String(c.short_code).trim() === cleanVal);
      if (exactMatch) {
        selectCentre(exactMatch);
      } else if (centreSearchResults[activeSearchIndex]) {
        selectCentre(centreSearchResults[activeSearchIndex]);
      } else {
        handleShortCodeBlur();
      }
    } else if (e.key === 'Escape') {
      setCentreSearchResults([]);
    }
  };

  // Toggle Joint Discipline (add/remove Indian, Western, Yoga freely)
  const handleToggleDiscipline = (discKey, isChecked) => {
    const updated = { ...jointActive, [discKey]: isChecked };
    const activeCount = Object.values(updated).filter(Boolean).length;
    if (activeCount === 0) {
      alert('Please select at least one discipline for the bill.');
      return;
    }
    setJointActive(updated);
    if (!isChecked && activeTab === discKey) {
      const nextActive = Object.keys(updated).find((k) => updated[k]);
      if (nextActive) setActiveTab(nextActive);
    }
  };

  // Edit count in specific discipline
  const handleCountChange = (discipline, index, field, value) => {
    const cleanVal = value.replace(/[^0-9]/g, '');
    setDisciplinesData((prev) => {
      const disc = prev[discipline];
      const updatedItems = [...disc.items];
      updatedItems[index] = { ...updatedItems[index], [field]: cleanVal };
      return {
        ...prev,
        [discipline]: { ...disc, items: updatedItems, saved: false }
      };
    });
  };

  // Keyboard navigation across cells
  const handleKeyDown = (e, discKey, rowIndex, colIndex, totalRows) => {
    if (['Enter', 'ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) {
      e.preventDefault();
      const discInputs = inputsRef.current[discKey] || [];

      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        if (rowIndex < totalRows - 1) {
          const next = discInputs[rowIndex + 1]?.[colIndex];
          if (next) { next.focus(); next.select(); }
        } else {
          if (colIndex === 0) {
            const next = discInputs[0]?.[1];
            if (next) { next.focus(); next.select(); }
          } else {
            if (examinerSchoolsRef.current[discKey]) {
              examinerSchoolsRef.current[discKey].focus();
              examinerSchoolsRef.current[discKey].select();
            }
          }
        }
      } else if (e.key === 'ArrowUp') {
        if (rowIndex > 0) {
          const prev = discInputs[rowIndex - 1]?.[colIndex];
          if (prev) { prev.focus(); prev.select(); }
        } else {
          if (shortCodeInputRef.current) {
            shortCodeInputRef.current.focus();
            shortCodeInputRef.current.select();
          }
        }
      } else if (e.key === 'ArrowRight') {
        if (colIndex === 0) {
          const right = discInputs[rowIndex]?.[1];
          if (right) { right.focus(); right.select(); }
        }
      } else if (e.key === 'ArrowLeft') {
        if (colIndex === 1) {
          const left = discInputs[rowIndex]?.[0];
          if (left) { left.focus(); left.select(); }
        }
      }
    }
  };

  const handleExaminerKeyDown = (e, discKey, field) => {
    if (['Enter', 'ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft'].includes(e.key)) {
      e.preventDefault();
      const discInputs = inputsRef.current[discKey] || [];
      const lastRow = discInputs.length - 1;

      if (e.key === 'ArrowUp') {
        const target = discInputs[lastRow]?.[field === 'schools' ? 0 : 1];
        if (target) { target.focus(); target.select(); }
      } else if (e.key === 'ArrowRight' && field === 'schools') {
        if (examinerAmountRef.current[discKey]) {
          examinerAmountRef.current[discKey].focus();
          examinerAmountRef.current[discKey].select();
        }
      } else if (e.key === 'ArrowLeft' && field === 'amount') {
        if (examinerSchoolsRef.current[discKey]) {
          examinerSchoolsRef.current[discKey].focus();
          examinerSchoolsRef.current[discKey].select();
        }
      } else if (e.key === 'Enter' || e.key === 'ArrowDown') {
        if (field === 'schools') {
          if (examinerAmountRef.current[discKey]) {
            examinerAmountRef.current[discKey].focus();
            examinerAmountRef.current[discKey].select();
          }
        } else {
          handleSaveBillRecord();
        }
      }
    }
  };

  // Helper calculation for an item list
  const calculateDisciplineSummary = (disciplineKey) => {
    const disc = disciplinesData[disciplineKey] || { items: [] };
    let totalOld = 0;
    let totalNew = 0;
    let grossFees = 0;
    let convocationFees = 0;
    let churamoniFees = 0;

    const queryZone = disciplineKey === 'yoga' ? 'yoga' : zone;

    // Check raw candidate count first to determine dynamic Churamoni fee (< 15 vs >= 15)
    let rawExaminees = 0;
    (disc.items || []).forEach((item) => {
      rawExaminees += (parseInt(item.old_count) || 0) + (parseInt(item.new_count) || 0);
    });

    const isZone2 = (queryZone === 'zone2_other');
    const dynamicChuramoniFee = rawExaminees < 15
      ? (isZone2 ? 2600 : 2200)
      : (isZone2 ? 1900 : 1600);

    (disc.items || []).forEach((item) => {
      const oldC = parseInt(item.old_count) || 0;
      const newC = parseInt(item.new_count) || 0;
      const lineEx = oldC + newC;
      const isChuramoni = item.level_name && item.level_name.includes('Churamoni');
      const examFee = isChuramoni ? dynamicChuramoniFee : (parseFloat(item.exam_fee) || 0);
      const convFee = (queryZone === 'zone1_ne_wb' || disciplineKey === 'yoga') ? 0 : (parseFloat(item.convocation_fee) || 0);

      totalOld += oldC;
      totalNew += newC;
      grossFees += lineEx * examFee;
      convocationFees += lineEx * convFee;
      if (isChuramoni) {
        churamoniFees += lineEx * examFee;
      }
    });

    const totalExaminees = totalOld + totalNew;
    return { totalOld, totalNew, totalExaminees, grossFees, convocationFees, churamoniFees, dynamicChuramoniFee };
  };

  // Active disciplines list
  const isJoint = billMode === 'joint';
  const activeDisciplinesList = isJoint
    ? ['indian', 'western', 'yoga'].filter((k) => jointActive[k])
    : [singleCategory];

  const indianSummary = calculateDisciplineSummary('indian');
  const westernSummary = calculateDisciplineSummary('western');
  const yogaSummary = calculateDisciplineSummary('yoga');

  // COMBINED STUDENT COUNT (Sum of all active disciplines)
  let combinedTotalExaminees = 0;
  if (isJoint) {
    if (jointActive.indian) combinedTotalExaminees += indianSummary.totalExaminees;
    if (jointActive.western) combinedTotalExaminees += westernSummary.totalExaminees;
    if (jointActive.yoga) combinedTotalExaminees += yogaSummary.totalExaminees;
  } else {
    combinedTotalExaminees = calculateDisciplineSummary(singleCategory).totalExaminees;
  }

  // Standard slab label
  const getSlabLabel = (count) => {
    if (count < 15) return '0-14';
    for (const slab of discountSlabs) {
      if (slab.max_count !== null && slab.max_count !== undefined) {
        if (count >= slab.min_count && count <= slab.max_count) {
          return `${slab.min_count}-${slab.max_count}`;
        }
      } else {
        if (count >= slab.min_count) {
          return `${slab.min_count}+`;
        }
      }
    }
    return '15-35';
  };

  const currentSlabName = getSlabLabel(combinedTotalExaminees);

  // MINIMUM 15 EXAMINEES RULE:
  // If combinedTotalExaminees < 15, teacher will NEVER get a discount (0%).
  let slabDiscountPercent = 0;
  if (combinedTotalExaminees >= 15) {
    for (const slab of discountSlabs) {
      if (slab.max_count !== null && slab.max_count !== undefined) {
        if (combinedTotalExaminees >= slab.min_count && combinedTotalExaminees <= slab.max_count) {
          slabDiscountPercent = slab.discount_percent;
          break;
        }
      } else {
        if (combinedTotalExaminees >= slab.min_count) {
          slabDiscountPercent = slab.discount_percent;
          break;
        }
      }
    }
  }

  const effectiveExtraLess = combinedTotalExaminees >= 15 ? (parseFloat(extraLess) || 0) : 0;
  const effectiveSeasonal = combinedTotalExaminees >= 15 ? (parseFloat(seasonalDiscount) || 0) : 0;
  const totalDiscountPercent = combinedTotalExaminees >= 15 ? (slabDiscountPercent + effectiveExtraLess + effectiveSeasonal) : 0;

  // Compute breakdown for any discipline
  const getDisciplineBreakdown = (discKey) => {
    const summ = discKey === 'indian' ? indianSummary : (discKey === 'western' ? westernSummary : yogaSummary);
    const discData = disciplinesData[discKey] || { examinerFeeAmount: '0', examinerSchoolCount: '2' };

    // Only for Indian bills percentage will exclude All India Churamoni Examination
    const discountableFees = (discKey === 'indian')
      ? Math.max(0, summ.grossFees - (summ.churamoniFees || 0))
      : summ.grossFees;

    const discAmt = (discountableFees * totalDiscountPercent) / 100;
    const afterDisc = summ.grossFees - discAmt;
    const regFees = summ.totalNew * 23;
    const exAmt = parseFloat(discData.examinerFeeAmount) || 0;
    let payable = afterDisc + regFees + summ.convocationFees - exAmt;

    // Minimum Payable rule if student count in discipline is < 15 and > 0
    const minPayable = MINIMUM_PAYABLE_RATES[zone]?.[discKey] || 0;
    const hasMinPayable = (summ.totalExaminees > 0 && summ.totalExaminees < 15 && minPayable > 0);

    return {
      ...summ,
      discData,
      discountableFees,
      discountAmount: discAmt,
      feesAfterDiscount: afterDisc,
      registrationFees: regFees,
      examinerAmount: exAmt,
      examinerSchools: discData.examinerSchoolCount || '2',
      totalPayable: payable,
      minPayable,
      hasMinPayable
    };
  };

  // Grand totals across all active disciplines
  let grandTotalOld = 0;
  let grandTotalNew = 0;
  let grandGross = 0;
  let grandDiscAmt = 0;
  let grandReg = 0;
  let grandConvocation = 0;
  let grandExaminer = 0;
  let grandTotalPayable = 0;

  activeDisciplinesList.forEach((k) => {
    const b = getDisciplineBreakdown(k);
    grandTotalOld += b.totalOld;
    grandTotalNew += b.totalNew;
    grandGross += b.grossFees;
    grandDiscAmt += b.discountAmount;
    grandReg += b.registrationFees;
    grandConvocation += b.convocationFees;
    grandExaminer += b.examinerAmount;
    grandTotalPayable += b.totalPayable;
  });

  // SAVE BILL:
  const handleSaveBillRecord = async (options = {}) => {
    setSaveStatus('Saving bill record...');
    const sc = String(shortCode || '1011').trim();

    try {
      let payload;
      if (isJoint) {
        payload = {
          id: options.replace_id || billRecordId,
          action: options.action,
          replace_id: options.replace_id,
          bill_number: sc,
          bill_date: billDate,
          session,
          centre_short_code: sc,
          centre_name: centreName,
          principal,
          address,
          phone,
          zone,
          category: 'joint',
          is_joint: 1,
          joint_id: `${sc}_${session}`,
          slab_discount_percent: slabDiscountPercent,
          extra_less_percent: effectiveExtraLess,
          seasonal_discount_percent: effectiveSeasonal,
          total_discount_percent: totalDiscountPercent,
          total_old: grandTotalOld,
          total_new: grandTotalNew,
          total_examinees: combinedTotalExaminees,
          gross_fees: grandGross,
          discount_amount: grandDiscAmt,
          fees_after_discount: grandGross - grandDiscAmt,
          registration_fees: grandReg,
          convocation_fees: grandConvocation,
          examiner_fee_amount: grandExaminer,
          total_payable: grandTotalPayable,
          items: activeDisciplinesList.flatMap((k) => disciplinesData[k].items),
          joint_data: {
            slab_name: currentSlabName,
            combined_examinees: combinedTotalExaminees,
            disciplines: {
              indian: {
                active: Boolean(jointActive.indian),
                items: disciplinesData.indian.items,
                examinerSchoolCount: disciplinesData.indian.examinerSchoolCount,
                examinerFeeAmount: disciplinesData.indian.examinerFeeAmount
              },
              western: {
                active: Boolean(jointActive.western),
                items: disciplinesData.western.items,
                examinerSchoolCount: disciplinesData.western.examinerSchoolCount,
                examinerFeeAmount: disciplinesData.western.examinerFeeAmount
              },
              yoga: {
                active: Boolean(jointActive.yoga),
                items: disciplinesData.yoga.items,
                examinerSchoolCount: disciplinesData.yoga.examinerSchoolCount,
                examinerFeeAmount: disciplinesData.yoga.examinerFeeAmount
              }
            }
          }
        };
      } else {
        const b = getDisciplineBreakdown(singleCategory);
        payload = {
          id: options.replace_id || billRecordId,
          action: options.action,
          replace_id: options.replace_id,
          bill_number: sc,
          bill_date: billDate,
          session,
          centre_short_code: sc,
          centre_name: centreName,
          principal,
          address,
          phone,
          zone: singleCategory === 'yoga' ? 'yoga' : zone,
          category: singleCategory,
          is_joint: 0,
          slab_discount_percent: slabDiscountPercent,
          extra_less_percent: effectiveExtraLess,
          seasonal_discount_percent: effectiveSeasonal,
          total_discount_percent: totalDiscountPercent,
          total_old: b.totalOld,
          total_new: b.totalNew,
          total_examinees: b.totalExaminees,
          gross_fees: b.grossFees,
          discount_amount: b.discountAmount,
          fees_after_discount: b.feesAfterDiscount,
          registration_fees: b.registrationFees,
          convocation_fees: b.convocationFees,
          examiner_fee_note: b.examinerAmount > 0 ? `Examiner fees for ${b.examinerSchools} school` : '',
          examiner_fee_amount: b.examinerAmount,
          total_payable: b.totalPayable,
          items: disciplinesData[singleCategory].items
        };
      }

      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setBillRecordId(data.billId);
        setSaveStatus(
          isJoint
            ? `Joint Bill saved as code "${data.bill_number}" (${currentSlabName} slab)!`
            : `Bill saved as code "${data.bill_number}"!`
        );
        setTimeout(() => setSaveStatus(''), 3500);
        return data.billId;
      }
    } catch (err) {
      setSaveStatus('Save error: ' + err.message);
    }
    return null;
  };

  // Check duplicate bill code before saving
  const handleSaveClick = async (pendingAction = 'save') => {
    const sc = String(shortCode || '1011').trim();
    if (!billRecordId) {
      try {
        const res = await fetch(`/api/bills/check-code/${encodeURIComponent(sc)}`);
        const data = await res.json();
        if (data.exists && data.bill) {
          setDuplicateModal({
            isOpen: true,
            existingBill: data.bill,
            pendingAction
          });
          return;
        }
      } catch (e) {
        console.error('Check code error:', e);
      }
    }
    const savedId = await handleSaveBillRecord();
    if (pendingAction === 'export' && savedId) {
      executeDownloadExport(savedId);
    }
  };

  const handleDuplicateConfirm = async (action) => {
    const existing = duplicateModal.existingBill;
    const pendingAction = duplicateModal.pendingAction;
    setDuplicateModal({ isOpen: false, existingBill: null, pendingAction: null });

    const savedId = await handleSaveBillRecord({
      action,
      replace_id: action === 'replace' ? existing.id : undefined
    });

    if (pendingAction === 'export' && savedId) {
      executeDownloadExport(savedId);
    }
  };

  // EXPORT EXCEL OR ZIP
  const handleDownloadExport = async () => {
    try {
      // Always save/update current bill state to ensure all counts & examiner fee are fresh in DB!
      const savedId = await handleSaveBillRecord({ replace_id: billRecordId });
      const targetId = savedId || billRecordId;
      if (targetId) {
        executeDownloadExport(targetId);
      }
    } catch (err) {
      console.error('Download export error:', err);
      setSaveStatus('Export error: ' + err.message);
    }
  };

  const executeDownloadExport = async (targetId) => {
    setIsExporting(true);
    setSaveStatus('Generating file...');
    try {
      const res = await fetch(`/api/export/excel/${targetId}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Export failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const sc = String(shortCode || '1011').trim();
      const filename = isJoint ? `${sc}.zip` : `${sc}.xlsx`;

      // Trigger standard blob download
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

      setSaveStatus(`Downloaded ${filename} successfully!`);
      setTimeout(() => setSaveStatus(''), 3500);
    } catch (err) {
      console.error('Download export error:', err);
      setSaveStatus('Export error: ' + err.message);
      alert('Download error: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // CLEAR ALL (Current or Fresh)
  const handleClearAll = () => {
    if (!window.confirm(`Clear all student counts and examiner fees?`)) return;
    setDisciplinesData((prev) => {
      const updated = { ...prev };
      for (const k of ['indian', 'western', 'yoga']) {
        updated[k] = {
          ...updated[k],
          items: updated[k].items.map((it) => ({ ...it, old_count: '0', new_count: '0' })),
          examinerFeeAmount: '0',
          examinerSchoolCount: '2',
          saved: false
        };
      }
      return updated;
    });
    setBillRecordId(null);
    if (onClearLoadedBill) onClearLoadedBill();
    setSaveStatus('Student counts cleared to 0!');
    setTimeout(() => setSaveStatus(''), 2500);

    const activeDisc = billMode === 'joint' ? (jointViewMode === 'stacked' ? activeDisciplinesList[0] : activeTab) : singleCategory;
    if (inputsRef.current[activeDisc]?.[0]?.[0]) {
      inputsRef.current[activeDisc][0][0].focus();
      inputsRef.current[activeDisc][0][0].select();
    }
  };

  // PRINT FUNCTION
  const handlePrint = () => {
    window.print();
  };

  // WHATSAPP EXCEL TEMPLATE RENDERING & SHARING:
  // Converts range A9 to last active row of the generated Excel template workbook to PNG.
  const base64ToBlob = (base64Str) => {
    const parts = base64Str.split(';base64,');
    const contentType = (parts[0].replace('data:', '')) || 'image/png';
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  };

  const formatCentreCaption = (code) => {
    let s = String(code || shortCode || '1011').trim();
    if (s.toUpperCase().startsWith('C-')) return s.toUpperCase();
    if (s.toUpperCase().startsWith('C')) return `C-${s.substring(1)}`;
    return `C-${s}`;
  };

  const getWhatsAppCaption = (discKey) => {
    const baseCode = formatCentreCaption(shortCode || centreCode);
    if (!isJoint) {
      return baseCode;
    }
    const discLabel = discKey === 'indian' ? 'Indian' : (discKey === 'western' ? 'Western' : 'Yoga');
    return `${baseCode} (${discLabel})`;
  };

  const fetchExcelTemplateImages = async () => {
    const sc = String(shortCode || '1011').trim();
    const payload = {
      bill: {
        id: billRecordId || undefined,
        centre_short_code: sc,
        centre_code: centreCode || `C-${sc}`,
        centre_name: centreName,
        principal,
        address,
        phone,
        session,
        zone,
        is_joint: isJoint ? 1 : 0,
        category: isJoint ? 'joint' : singleCategory,
        slab_discount_percent: slabDiscountPercent,
        extra_less_percent: effectiveExtraLess,
        seasonal_discount_percent: effectiveSeasonal,
        total_discount_percent: totalDiscountPercent,
        total_examinees: combinedTotalExaminees,
        examiner_fee_amount: !isJoint ? disciplinesData[singleCategory].examinerFeeAmount : undefined,
        examiner_fee_note: !isJoint ? `Examiner fees for ${disciplinesData[singleCategory].examinerSchoolCount || '2'} school` : undefined,
        joint_data: isJoint ? {
          combined_examinees: combinedTotalExaminees,
          slab_name: currentSlabName,
          disciplines: {
            indian: {
              active: Boolean(jointActive.indian),
              items: disciplinesData.indian.items,
              examinerSchoolCount: disciplinesData.indian.examinerSchoolCount,
              examinerFeeAmount: disciplinesData.indian.examinerFeeAmount
            },
            western: {
              active: Boolean(jointActive.western),
              items: disciplinesData.western.items,
              examinerSchoolCount: disciplinesData.western.examinerSchoolCount,
              examinerFeeAmount: disciplinesData.western.examinerFeeAmount
            },
            yoga: {
              active: Boolean(jointActive.yoga),
              items: disciplinesData.yoga.items,
              examinerSchoolCount: disciplinesData.yoga.examinerSchoolCount,
              examinerFeeAmount: disciplinesData.yoga.examinerFeeAmount
            }
          }
        } : undefined
      },
      items: !isJoint ? disciplinesData[singleCategory].items : []
    };

    const res = await fetch('/api/export/whatsapp-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to render Excel images: status ${res.status}`);
    }
    const data = await res.json();
    return data.images || [];
  };

  const formatWhatsAppNumber = (rawPhone) => {
    if (!rawPhone) return '';
    let num = String(rawPhone).replace(/[^0-9]/g, '');
    if (num.startsWith('0')) {
      num = num.substring(1);
    }
    if (num.length === 10) {
      num = '91' + num;
    }
    return num;
  };

  const getWhatsAppUrls = (caption, rawPhone) => {
    const num = formatWhatsAppNumber(rawPhone);
    const textParam = encodeURIComponent(caption);
    const webUrl = num
      ? `https://web.whatsapp.com/send?phone=${num}&text=${textParam}`
      : `https://web.whatsapp.com/send?text=${textParam}`;
    const appUrl = num
      ? `whatsapp://send?phone=${num}&text=${textParam}`
      : `whatsapp://send?text=${textParam}`;
    return { webUrl, appUrl, num };
  };

  // Copy rendered template image to clipboard
  const handleCopyImageToClipboard = async (imgObj, showToast = true) => {
    try {
      const blob = base64ToBlob(imgObj.base64);
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      if (imgObj.key) {
        setCopiedSteps((prev) => ({ ...prev, [imgObj.key]: true }));
      }
      if (showToast) {
        setShareToast(`📋 Image for ${imgObj.caption} copied to clipboard! Paste with Ctrl+V into WhatsApp.`);
        setTimeout(() => setShareToast(''), 6000);
      }
      return true;
    } catch (err) {
      console.warn('Clipboard write error:', err);
      if (showToast) {
        setShareToast('⚠️ Could not copy image directly to clipboard. You can download and attach it instead.');
        setTimeout(() => setShareToast(''), 5000);
      }
      return false;
    }
  };

  // Download image file
  const handleDownloadImage = (imgObj) => {
    const blob = base64ToBlob(imgObj.base64);
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = imgObj.filename || `${imgObj.caption}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
    setShareToast(`⬇️ Downloaded ${imgObj.filename || imgObj.caption + '.png'}`);
    setTimeout(() => setShareToast(''), 4000);
  };

  // Open WhatsApp Web or Desktop App directly to Helpline (synchronous user click => NEVER blocked by popup blocker!)
  const handleOpenWhatsApp = async (imgObj, mode = 'web') => {
    // 1. Auto-copy image so it's ready in clipboard
    await handleCopyImageToClipboard(imgObj, false);

    // Track step completion
    if (imgObj.key) {
      setCopiedSteps((prev) => ({ ...prev, [imgObj.key]: true }));
    }

    // 2. Strict Helpline URL - uses helplinePhone ONLY, NEVER teacher's personal phone!
    const caption = imgObj.caption;
    const { webUrl, appUrl } = getWhatsAppUrls(caption, helplinePhone);

    if (mode === 'app') {
      // Trigger WhatsApp Desktop App protocol
      window.location.href = appUrl;
      setShareToast(`💬 Opening WhatsApp Desktop App to share ${caption} with Helpline! Press Ctrl+V in the chat to paste the bill.`);
    } else {
      // Open WhatsApp Web in new tab
      window.open(webUrl, '_blank');
      setShareToast(`🌐 Opening WhatsApp Web to share ${caption} with Helpline! Press Ctrl+V in the chat to paste the bill.`);
    }
    setTimeout(() => setShareToast(''), 8000);
  };

  // Batch download all joint bill images at once (Suggestion 2)
  const handleDownloadAllImages = async () => {
    for (let i = 0; i < renderedExcelImages.length; i++) {
      const imgObj = renderedExcelImages[i];
      handleDownloadImage(imgObj);
      await new Promise((r) => setTimeout(r, 250));
    }
    setShareToast(`⬇️ Downloaded all ${renderedExcelImages.length} images! Drag and drop them into WhatsApp.`);
    setTimeout(() => setShareToast(''), 6000);
  };

  // Open WhatsApp with joint summary caption for dragging & dropping
  const handleOpenWhatsAppJoint = (mode = 'web') => {
    const baseCode = formatCentreCaption(shortCode || centreCode);
    const activeLabels = renderedExcelImages.map((im) => im.label || im.key).join(' + ');
    const jointCaption = `${baseCode} (${activeLabels})`;
    const { webUrl, appUrl } = getWhatsAppUrls(jointCaption, helplinePhone);

    if (mode === 'app') {
      window.location.href = appUrl;
      setShareToast(`💬 Opening WhatsApp Desktop App for Helpline (${jointCaption})! Drag your downloaded images into the chat.`);
    } else {
      window.open(webUrl, '_blank');
      setShareToast(`🌐 Opening WhatsApp Web for Helpline (${jointCaption})! Drag your downloaded images into the chat.`);
    }
    setTimeout(() => setShareToast(''), 8000);
  };

  // Single bill share or tab-level share
  const shareSingleDisciplineWhatsApp = async (discKey) => {
    setIsSharingWhatsApp(true);
    setShareToast('Rendering Excel template image...');
    try {
      const images = await fetchExcelTemplateImages();
      const targetImg = images.find((im) => im.key === discKey) || images[0];
      if (!targetImg) {
        throw new Error('No image was generated from the Excel template');
      }
      setRenderedExcelImages([targetImg]);
      setCopiedSteps({});
      await handleCopyImageToClipboard(targetImg, false);
      setWhatsAppModalOpen(true);
      setShareToast(`Image ready for ${targetImg.caption}! Choose WhatsApp Web or WhatsApp Desktop App.`);
      setTimeout(() => setShareToast(''), 5000);
    } catch (err) {
      alert('WhatsApp share error: ' + err.message);
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  // Top Action Bar WhatsApp Click
  const handleSendWhatsApp = async () => {
    setIsSharingWhatsApp(true);
    setShareToast('Rendering Excel template image(s)...');
    try {
      const images = await fetchExcelTemplateImages();
      if (!images || images.length === 0) {
        throw new Error('No image was generated from the Excel template');
      }
      setRenderedExcelImages(images);
      setCopiedSteps({});

      // Auto-copy first image to clipboard in advance
      if (images.length > 0) {
        await handleCopyImageToClipboard(images[0], false);
      }

      setWhatsAppModalOpen(true);
      setShareToast(
        images.length > 1
          ? `Rendered ${images.length} joint bill images! Choose Batch Drag & Drop or Step-by-Step copy.`
          : 'Excel bill rendered & copied to clipboard! Choose WhatsApp Web or WhatsApp Desktop App below.'
      );
      setTimeout(() => setShareToast(''), 5000);
    } catch (err) {
      alert('WhatsApp share error: ' + err.message);
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  // Render Top Action Buttons
  const ActionButtons = () => {
    const sc = String(shortCode || '1011').trim();

    return (
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        {/* 1. Clear All Button */}
        <button
          onClick={handleClearAll}
          title="Reset student counts and examiner fees to 0"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Clear All
        </button>

        {/* 2. Print Button */}
        <button
          onClick={handlePrint}
          title="Print all bills cleanly with page breaks"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Printer className="w-3.5 h-3.5" /> Print {isJoint ? 'Joint Bills' : 'Bill'}
        </button>

        {/* 3. Save Bill Record */}
        <button
          onClick={() => handleSaveClick('save')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Save className="w-3.5 h-3.5" /> Save {isJoint ? `Joint Bill (${sc})` : `Record (${sc})`}
        </button>

        {/* 4. Export Excel or ZIP */}
        <button
          onClick={handleDownloadExport}
          disabled={isExporting}
          title={isJoint ? `Export ${sc}.zip with ${currentSlabName} (INDIAN).xlsx & (WESTERN).xlsx` : `Export ${sc}.xlsx`}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-white rounded-xl text-xs font-bold shadow-sm transition-all ${isExporting ? 'opacity-60 cursor-wait' : ''
            } ${isJoint ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-emerald-700 hover:bg-emerald-800'}`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> {isExporting ? 'Exporting...' : (isJoint ? `Export Joint Bill (${sc}.zip)` : `Export Excel (${sc}.xlsx)`)}
        </button>

        {/* 5. WhatsApp Share Button */}
        <button
          onClick={handleSendWhatsApp}
          disabled={isSharingWhatsApp}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Share2 className="w-3.5 h-3.5" /> {isSharingWhatsApp ? 'Sharing...' : 'WhatsApp Share'}
        </button>
      </div>
    );
  };

  // Render a single discipline bill sheet
  const renderBillSheet = (discKey) => {
    const b = getDisciplineBreakdown(discKey);
    const discItems = disciplinesData[discKey]?.items || [];

    return (
      <div
        key={discKey}
        className="bg-white rounded-2xl shadow-md border border-slate-300 p-8 max-w-4xl mx-auto font-serif print:shadow-none print:border-none print:p-0 print:m-0 print:break-after-page mb-6"
      >
        {/* Row 1: Bill Date & Discipline Title Banner */}
        <div className="flex justify-between items-center text-xs text-slate-500 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Date:</span>
            <input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="font-mono text-xs border border-transparent hover:border-slate-300 rounded px-1 print:border-none"
            />
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 print:border-slate-400">
              {DISCIPLINE_LABELS[discKey].toUpperCase()} {isJoint && `(${currentSlabName} SLAB)`}
            </span>
            <button
              onClick={() => shareSingleDisciplineWhatsApp(discKey)}
              disabled={isSharingWhatsApp}
              title={`Share ${discKey.toUpperCase()} table to WhatsApp (${getWhatsAppCaption(discKey)})`}
              className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-300 hover:bg-green-100 print:hidden transition-all shadow-xs"
            >
              <Share2 className="w-3 h-3 text-green-600" /> WhatsApp Image
            </button>
          </div>
          <div className="text-[11px] text-slate-400 font-mono print:hidden">
            Navigation: <span className="font-bold text-slate-600">Enter / ↓ / ↑ / → / ←</span>
          </div>
        </div>

        {/* Rows 2-5: Logo + Header Banner */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="w-24 h-24 flex items-center justify-center flex-shrink-0">
            <img
              src="/logo.png"
              alt="Suro Bharati Logo"
              className="w-20 h-20 object-contain drop-shadow-sm"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          <div className="flex-1 text-center px-4">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              Suro Bharati Sangeet Kala Kendra
            </h1>
            <p className="text-xs font-bold text-slate-700 mt-1">
              19/I Vivekananda Lane , Serampore , Hooghly - 712201 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Session {session}
            </p>
          </div>

          <div className="text-right text-xs bg-slate-50 p-2 rounded border border-slate-200 print:bg-transparent">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Short Code</span>
            <span className="font-mono font-bold text-sm text-slate-800">
              {shortCode || '1011'}
            </span>
          </div>
        </div>

        {/* Rows 6-8: Institute Info */}
        <div className="space-y-1.5 text-xs text-slate-800 mb-6">
          <div className="flex items-baseline">
            <span className="font-bold w-40 flex-shrink-0">Name of Institute - </span>
            <input
              type="text"
              value={centreName}
              onChange={(e) => setCentreName(e.target.value)}
              className="flex-1 font-bold text-sm border-b border-dotted border-slate-300 focus:outline-none focus:border-rose-500 py-0.5 print:border-none"
            />
          </div>
          <div className="flex items-baseline">
            <span className="font-bold w-40 flex-shrink-0">Principal - </span>
            <input
              type="text"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="flex-1 border-b border-dotted border-slate-300 focus:outline-none focus:border-rose-500 py-0.5 print:border-none"
            />
          </div>
          <div className="flex items-baseline">
            <span className="font-bold w-40 flex-shrink-0">Address - </span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1 border-b border-dotted border-slate-300 focus:outline-none focus:border-rose-500 py-0.5 print:border-none"
            />
          </div>
        </div>

        {/* Bill Table Capture Container (Cell A9 to Last Active Row) */}
        <div
          ref={(el) => { tableCaptureRefs.current[discKey] = el; }}
          id={`bill-table-capture-${discKey}`}
          className="bg-white p-3 rounded-xl border border-slate-200"
        >
          {/* Data Table */}
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="font-bold text-slate-900 border-b-2 border-slate-300">
                <th className="py-2 px-3 text-center w-56">Year / Level</th>
                <th className="py-2 px-2 w-24">Exam Fees</th>
                <th className="py-2 px-2 w-28">Old Examinee</th>
                <th className="py-2 px-2 w-28">New Examinee</th>
                <th className="py-2 px-3 text-center w-32">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {discItems.map((item, idx) => {
                const oldCount = parseInt(item.old_count) || 0;
                const newCount = parseInt(item.new_count) || 0;
                const isChuramoni = item.level_name?.includes('Churamoni');
                const effectiveExamFee = isChuramoni ? b.dynamicChuramoniFee : (item.exam_fee || 0);
                const lineTotal = (oldCount + newCount) * effectiveExamFee;

                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 text-center font-normal text-slate-800 leading-snug">
                      {isChuramoni ? (
                        <div className="leading-tight">
                          <div>All India Churamoni</div>
                          <div>Examination</div>
                        </div>
                      ) : (
                        item.level_name
                      )}
                    </td>
                    <td className="py-2 px-2 text-slate-700 font-mono font-bold">
                      {effectiveExamFee}
                    </td>
                    {/* Col 0: Old Examinee input */}
                    <td className="py-1 px-2">
                      <input
                        ref={(el) => {
                          if (!inputsRef.current[discKey]) inputsRef.current[discKey] = [];
                          if (!inputsRef.current[discKey][idx]) inputsRef.current[discKey][idx] = [];
                          inputsRef.current[discKey][idx][0] = el;
                        }}
                        type="text"
                        value={item.old_count}
                        onChange={(e) => handleCountChange(discKey, idx, 'old_count', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, discKey, idx, 0, discItems.length)}
                        placeholder="0"
                        className="w-16 text-center py-1 border border-slate-200 rounded font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:bg-rose-50/40 print:border-none"
                      />
                    </td>
                    {/* Col 1: New Examinee input */}
                    <td className="py-1 px-2">
                      <input
                        ref={(el) => {
                          if (!inputsRef.current[discKey]) inputsRef.current[discKey] = [];
                          if (!inputsRef.current[discKey][idx]) inputsRef.current[discKey][idx] = [];
                          inputsRef.current[discKey][idx][1] = el;
                        }}
                        type="text"
                        value={item.new_count}
                        onChange={(e) => handleCountChange(discKey, idx, 'new_count', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, discKey, idx, 1, discItems.length)}
                        placeholder="0"
                        className="w-16 text-center py-1 border border-slate-200 rounded font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:bg-rose-50/40 print:border-none"
                      />
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                      {lineTotal > 0 ? lineTotal : 0}
                    </td>
                  </tr>
                );
              })}

              {/* Row 22: Total-- */}
              <tr className="border-t-2 border-slate-300 font-bold text-slate-900">
                <td colSpan="2" className="py-2.5 px-3 text-right">Total--</td>
                <td className="py-2.5 px-2 text-center font-mono">{b.totalOld}</td>
                <td className="py-2.5 px-2 text-center font-mono">{b.totalNew}</td>
                <td className="py-2.5 px-3 text-center font-mono">{b.grossFees}</td>
              </tr>

              {/* Row 23: Discount (ONLY if combined examinees >= 15 and totalDiscountPercent > 0) */}
              {totalDiscountPercent > 0 && (
                <tr className="font-bold text-slate-800">
                  <td colSpan="4" className="py-2 px-3 text-center">
                    Special Less {slabDiscountPercent}%{effectiveExtraLess > 0 ? ` + Extra Less ${effectiveExtraLess}%` : ''}{effectiveSeasonal > 0 ? ` + Seasonal ${effectiveSeasonal}%` : ''}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-emerald-700">
                    {b.discountAmount.toFixed(1)}
                  </td>
                </tr>
              )}

              {/* Row 24: Fees After Deduction (ONLY if discount applies) */}
              {totalDiscountPercent > 0 && (
                <tr className="font-bold text-slate-800">
                  <td colSpan="4" className="py-2 px-3 text-center">
                    Fees After Deduction
                  </td>
                  <td className="py-2 px-3 text-center font-mono">
                    {b.feesAfterDiscount.toFixed(1)}
                  </td>
                </tr>
              )}

              {/* Row 25: Registration Fees */}
              <tr className="font-bold text-slate-800">
                <td colSpan="4" className="py-2 px-3 text-center">
                  Rs- 23/- Registration Fees (For Each New Examinee)
                </td>
                <td className="py-2 px-3 text-center font-mono">
                  {b.registrationFees}
                </td>
              </tr>

              {/* Row 26: Convocation Fees */}
              {b.convocationFees > 0 && (
                <tr className="font-bold text-slate-800 bg-amber-50/40 print:bg-transparent">
                  <td colSpan="4" className="py-2 px-3 text-center">
                    Convocation Fees
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-amber-900">
                    {b.convocationFees}
                  </td>
                </tr>
              )}

              {/* Examiner Fees Deduction Row (borderless in Excel) */}
              <tr className="font-bold text-slate-900 bg-rose-50/30 print:bg-transparent">
                <td colSpan="4" className="py-2 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Examiner fees for</span>
                    <input
                      ref={(el) => { examinerSchoolsRef.current[discKey] = el; }}
                      type="text"
                      value={disciplinesData[discKey]?.examinerSchoolCount || '2'}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setDisciplinesData((prev) => ({
                          ...prev,
                          [discKey]: { ...prev[discKey], examinerSchoolCount: val, saved: false }
                        }));
                      }}
                      onKeyDown={(e) => handleExaminerKeyDown(e, discKey, 'schools')}
                      placeholder="2"
                      className="w-10 text-center py-0.5 border border-slate-300 rounded font-mono font-bold focus:ring-2 focus:ring-rose-500 bg-white print:border-none"
                    />
                    <span>school</span>
                  </div>
                </td>
                <td className="py-2 px-3 text-center font-mono text-rose-700">
                  <div className="flex items-center justify-center gap-1">
                    <span>-</span>
                    <input
                      ref={(el) => { examinerAmountRef.current[discKey] = el; }}
                      type="text"
                      value={disciplinesData[discKey]?.examinerFeeAmount || '0'}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setDisciplinesData((prev) => ({
                          ...prev,
                          [discKey]: { ...prev[discKey], examinerFeeAmount: val, saved: false }
                        }));
                      }}
                      onKeyDown={(e) => handleExaminerKeyDown(e, discKey, 'amount')}
                      placeholder="0"
                      className="w-20 text-center py-0.5 border border-slate-300 rounded font-mono font-bold focus:ring-2 focus:ring-rose-500 bg-white print:border-none"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Row 28: Final Box for this discipline */}
          <div className="mt-4 border-2 border-slate-900 rounded-sm grid grid-cols-12 items-center text-xs font-bold text-slate-900 p-2.5">
            <div className="col-span-3 text-left">
              Total Examinee--
            </div>
            <div className="col-span-2 text-left font-mono text-sm">
              {b.totalExaminees}
            </div>
            <div className="col-span-4 text-center">
              {isJoint ? `${discKey.toUpperCase()} Payable Exam Fees--` : 'Total Payable Exam Fees--'}
            </div>
            <div className="col-span-3 text-center font-mono text-base text-rose-800">
              Rs. {b.totalPayable.toFixed(1)}
            </div>
          </div>

          {/* Minimum Payable row: merged across A to E, font Century Schoolbook, text size 16, bold, centered */}
          {b.hasMinPayable && (
            <div 
              style={{ fontFamily: "'Century Schoolbook', 'Times New Roman', serif" }}
              className="mt-2 border-2 border-slate-900 rounded-sm p-2 text-center text-[16px] font-bold text-slate-900 tracking-wide bg-slate-50/50"
            >
              Minimum Payable - {b.minPayable}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Configuration & Biller Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* 1. Short Code */}
            <div className="relative">
              <span className="text-[11px] font-bold text-slate-500 block mb-0.5 uppercase tracking-wider">
                1. Short Code
              </span>
              <input
                ref={shortCodeInputRef}
                type="text"
                value={shortCode}
                onChange={(e) => handleShortCodeSearch(e.target.value)}
                onKeyDown={handleShortCodeKeyDown}
                onBlur={handleShortCodeBlur}
                placeholder="e.g. 1011"
                className="w-28 px-3 py-1.5 border-2 border-slate-300 rounded-xl text-sm font-mono font-bold focus:border-rose-500 focus:outline-none"
              />
              {centreSearchResults.length > 0 && (
                <div className="absolute z-30 left-0 mt-1 w-80 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {centreSearchResults.map((c, sIdx) => (
                    <div
                      key={c.short_code}
                      onClick={() => selectCentre(c)}
                      className={`p-2.5 cursor-pointer text-left transition-colors ${sIdx === activeSearchIndex ? 'bg-rose-100 text-rose-900 font-bold' : 'hover:bg-rose-50'
                        }`}
                    >
                      <div className="text-xs font-bold">{c.centre_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Code: {c.short_code} • {c.address}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. State Name Dropdown */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-0.5 uppercase tracking-wider">
                2. Select State
              </span>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="px-3 py-1.5 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:border-rose-500 focus:outline-none"
              >
                {Object.keys(STATE_ZONE_MAP).map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* 3. Detected Zone Badge (Clean & Compact) */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-0.5 uppercase tracking-wider">
                Detected Zone
              </span>
              <span className="inline-block px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                {singleCategory === 'yoga' ? 'Universal Yoga' : ZONE_DISPLAY_LABELS[zone]}
              </span>
            </div>

            {/* 4. Bill Mode: Single vs Joint */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-0.5 uppercase tracking-wider">
                3. Bill Type
              </span>
              <select
                value={billMode}
                onChange={(e) => {
                  const m = e.target.value;
                  setBillMode(m);
                  if (m === 'joint') {
                    if (!jointActive.indian && !jointActive.western && !jointActive.yoga) {
                      setJointActive({ indian: true, western: true, yoga: false });
                    }
                  }
                }}
                className={`px-3 py-1.5 border-2 rounded-xl text-xs font-bold focus:outline-none ${isJoint
                  ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 font-extrabold'
                  : 'border-slate-300 text-slate-800'
                  }`}
              >
                <option value="single">Single Bill (Individual)</option>
                <option value="joint">Joint Bill (Custom Combination)</option>
              </select>
            </div>

            {/* 5. If Single: Course Selection */}
            {!isJoint && (
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-0.5 uppercase tracking-wider">
                  4. Course
                </span>
                <select
                  value={singleCategory}
                  onChange={(e) => {
                    setSingleCategory(e.target.value);
                    setActiveTab(e.target.value);
                  }}
                  className="px-3 py-1.5 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:border-rose-500 focus:outline-none"
                >
                  <option value="indian">Indian Classical</option>
                  <option value="western">Western Music & Dance</option>
                  <option value="yoga">Universal Yoga</option>
                </select>
              </div>
            )}

            {/* 6. Extra Less % from Settings */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-0.5 uppercase tracking-wider" title="Configured in Settings">
                Extra Less %
              </span>
              <input
                type="number"
                value={extraLess}
                onChange={(e) => setExtraLess(e.target.value)}
                placeholder="10"
                className="w-16 px-2 py-1.5 border-2 border-slate-300 rounded-xl text-xs font-bold text-center focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* 7. Seasonal Concession % */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-0.5 uppercase tracking-wider">
                Seasonal %
              </span>
              <input
                type="number"
                value={seasonalDiscount}
                onChange={(e) => setSeasonalDiscount(e.target.value)}
                placeholder="0"
                className="w-16 px-2 py-1.5 border-2 border-slate-300 rounded-xl text-xs font-bold text-center focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <ActionButtons />
        </div>

        {/* JOINT BILLS: INTERACTIVE DISCIPLINE COMBINATION SELECTOR */}
        {isJoint && (
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/70 p-3 rounded-2xl border border-indigo-200">
              {/* Checkboxes to add or remove ANY discipline freely */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" /> Choose Combination:
                </span>

                {/* 1. Indian Checkbox */}
                <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${jointActive.indian
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}>
                  <input
                    type="checkbox"
                    checked={jointActive.indian}
                    onChange={(e) => handleToggleDiscipline('indian', e.target.checked)}
                    className="rounded accent-rose-600 cursor-pointer"
                  />
                  <span>🎻 Indian ({indianSummary.totalExaminees})</span>
                </label>

                {/* 2. Western Checkbox */}
                <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${jointActive.western
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}>
                  <input
                    type="checkbox"
                    checked={jointActive.western}
                    onChange={(e) => handleToggleDiscipline('western', e.target.checked)}
                    className="rounded accent-blue-600 cursor-pointer"
                  />
                  <span>🎹 Western ({westernSummary.totalExaminees})</span>
                </label>

                {/* 3. Yoga Checkbox */}
                <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${jointActive.yoga
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}>
                  <input
                    type="checkbox"
                    checked={jointActive.yoga}
                    onChange={(e) => handleToggleDiscipline('yoga', e.target.checked)}
                    className="rounded accent-amber-600 cursor-pointer"
                  />
                  <span>🧘 Yoga ({yogaSummary.totalExaminees})</span>
                </label>
              </div>

              {/* View Layout Toggle: Stacked vs Tabs */}
              <div className="inline-flex rounded-xl bg-white border border-slate-300 p-0.5 text-xs font-bold">
                <button
                  onClick={() => setJointViewMode('stacked')}
                  className={`px-3 py-1 rounded-lg transition-colors ${jointViewMode === 'stacked'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Stacked (One Below Another)
                </button>
                <button
                  onClick={() => setJointViewMode('tabs')}
                  className={`px-3 py-1 rounded-lg transition-colors ${jointViewMode === 'tabs'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Tab View
                </button>
              </div>
            </div>

            {/* If Tab View is active, render active tab pills */}
            {jointViewMode === 'tabs' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Active Tab:</span>
                {activeDisciplinesList.map((k) => (
                  <button
                    key={k}
                    onClick={() => setActiveTab(k)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === k
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    {DISCIPLINE_LABELS[k]} ({getDisciplineBreakdown(k).totalExaminees})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {saveStatus && (
        <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-xl border border-emerald-200 flex items-center gap-2 print:hidden">
          <Check className="w-4 h-4 text-emerald-600" /> {saveStatus}
        </div>
      )}

      {/* Minimum 15 Alert Banner */}
      {combinedTotalExaminees < 15 && (
        <div className="p-2.5 bg-amber-50 text-amber-900 text-xs font-semibold rounded-xl border border-amber-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold text-[10px]">NOTICE</span>
            <span>Total student count is <strong>{combinedTotalExaminees}</strong> (below 15 minimum). Teachers receive <strong>0% Concession</strong>. Concession rows will not appear in Excel export.</span>
          </div>
          <span className="font-mono text-[11px] text-amber-800">Formula: Total Fees + Reg + Conv - Examiner</span>
        </div>
      )}

      {/* BILL SHEETS RENDERING: */}
      {/* If Joint & Stacked View: render all active disciplines one below another! */}
      {/* If Joint & Tabs View: render active tab */}
      {/* If Single: render singleCategory */}
      {isJoint ? (
        jointViewMode === 'stacked' ? (
          activeDisciplinesList.map((k) => renderBillSheet(k))
        ) : (
          renderBillSheet(activeTab)
        )
      ) : (
        renderBillSheet(singleCategory)
      )}

      {/* JOINT GRAND COMBINED SUMMARY CARD */}
      {isJoint && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl shadow-xl text-white p-6 max-w-4xl mx-auto border-2 border-indigo-700 print:break-before-page">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-700/60 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/40 text-indigo-200 border border-indigo-400">
                  JOINT BILL CONSOLIDATED SUMMARY
                </span>
                <span className="text-xs text-indigo-200 font-mono">Centre Code: {shortCode}</span>
              </div>
              <h2 className="text-xl font-bold mt-1 text-white">
                {centreName} &nbsp;•&nbsp; {activeDisciplinesList.map((d) => d.toUpperCase()).join(' + ')}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-indigo-300 block">Slab Tier Applied</span>
              <span className="text-lg font-mono font-extrabold text-amber-300">
                {currentSlabName} Slab ({totalDiscountPercent}% Concession)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mb-5">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-slate-400 block mb-0.5">Combined Candidates</span>
              <span className="text-lg font-mono font-bold text-white">{combinedTotalExaminees}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                ({grandTotalOld} Old, {grandTotalNew} New)
              </span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-slate-400 block mb-0.5">Gross Examination Fees</span>
              <span className="text-lg font-mono font-bold text-white">₹{grandGross.toFixed(0)}</span>
              {totalDiscountPercent > 0 && (
                <span className="text-[10px] text-emerald-400 block mt-0.5">
                  Concession: -₹{grandDiscAmt.toFixed(1)}
                </span>
              )}
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-slate-400 block mb-0.5">Registration Fees</span>
              <span className="text-lg font-mono font-bold text-white">₹{grandReg.toFixed(0)}</span>
              {grandConvocation > 0 && (
                <span className="text-[10px] text-amber-300 block mt-0.5">
                  Convocation: +₹{grandConvocation.toFixed(0)}
                </span>
              )}
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-slate-400 block mb-0.5">Examiner Deductions</span>
              <span className="text-lg font-mono font-bold text-rose-300">
                {grandExaminer > 0 ? `-₹${grandExaminer.toFixed(0)}` : '₹0'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Across active bills</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-indigo-700/60">
            <div className="text-xs text-indigo-200">
              Breakdown: {activeDisciplinesList.map((k) => (
                <span key={k} className="mr-3 font-mono">
                  {k.toUpperCase()}: ₹{getDisciplineBreakdown(k).totalPayable.toFixed(1)}
                </span>
              ))}
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-300 block uppercase tracking-wider font-bold">
                Grand Joint Total Payable
              </span>
              <span className="text-2xl font-mono font-extrabold text-amber-300">
                Rs. {grandTotalPayable.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 print:hidden max-w-4xl mx-auto">
        <div className="text-xs font-semibold text-slate-500">
          Centre Code: <span className="font-bold text-slate-800 font-mono">{centreCode || ('C-' + shortCode)}</span>
          {saveStatus && <span className="ml-3 text-rose-600 font-bold">{saveStatus}</span>}
        </div>
        <ActionButtons />
      </div>

      {/* Floating Share Toast Notification */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in max-w-md">
          <Share2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="leading-snug">{shareToast}</span>
          <button onClick={() => setShareToast('')} className="text-slate-400 hover:text-white font-bold ml-1">✕</button>
        </div>
      )}

      {/* DUPLICATE SHORT CODE CONFIRMATION MODAL */}
      {duplicateModal.isOpen && duplicateModal.existingBill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Existing Bill Found ({shortCode})</h3>
                <p className="text-xs text-slate-500">A bill record for Short Code <b>{shortCode}</b> already exists in history.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5 font-sans">
              <div className="flex justify-between">
                <span className="text-slate-500">Institute:</span>
                <span className="font-bold text-slate-800">{duplicateModal.existingBill.centre_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Previous Date:</span>
                <span className="font-mono text-slate-700">{duplicateModal.existingBill.bill_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Previous Total:</span>
                <span className="font-mono font-bold text-rose-700">₹{duplicateModal.existingBill.total_payable}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Do you want to <b>replace</b> the previous bill record, or <b>save as a new bill</b>?
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => handleDuplicateConfirm('replace')}
                className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all text-center"
              >
                Replace Previous Bill
              </button>
              <button
                onClick={() => handleDuplicateConfirm('create_new')}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all text-center"
              >
                Save as New Bill
              </button>
              <button
                onClick={() => setDuplicateModal({ isOpen: false, existingBill: null, pendingAction: null })}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP SHARING MODAL FOR SINGLE & JOINT BILLS */}
      {whatsAppModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-green-600" /> Share Bill to Helpline
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Images are shared strictly to Kendra Helpline with caption <b>{formatCentreCaption(shortCode || centreCode)}</b>
                </p>
              </div>
              <button
                onClick={() => setWhatsAppModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Helpline WhatsApp Number Bar */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <span>Kendra Helpline WhatsApp No:</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={helplinePhone}
                    onChange={(e) => {
                      setHelplinePhone(e.target.value);
                      localStorage.setItem('kendra_helpline_phone', e.target.value);
                    }}
                    placeholder="e.g. 9830012345 (Helpline)"
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 w-full sm:w-52 focus:outline-hidden focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                🔒 Teacher phone numbers are never contacted directly. Images are dispatched only to our Kendra Helpline.
              </p>
            </div>

            {/* Instructions Banner */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800 flex items-start gap-2.5">
              <span className="text-base">📋</span>
              <div>
                <span className="font-bold">
                  {renderedExcelImages.length > 1
                    ? `Joint Bill with ${renderedExcelImages.length} Parts — Send One by One`
                    : 'Bill image automatically copied to clipboard!'}
                </span>
                <p className="text-[11px] text-green-700 mt-0.5">
                  {renderedExcelImages.length > 1
                    ? 'Click WhatsApp Web or WhatsApp App on Step 1, press Ctrl + V to paste and send in chat. Then proceed to Step 2.'
                    : 'Click WhatsApp Web or WhatsApp App below to open the chat with caption, then press Ctrl + V to paste and send.'}
                </p>
              </div>
            </div>

            {/* ONE-BY-ONE STEP-BY-STEP SEQUENTIAL SHARING */}
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {renderedExcelImages.length > 1 && (
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span>👣</span>
                    <span>Send Each Part One by One (1 by 1)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {Object.values(copiedSteps).filter(Boolean).length} of {renderedExcelImages.length} steps sent
                  </span>
                </div>
              )}

              {renderedExcelImages.map((imgObj, idx) => {
                const discKey = imgObj.key;
                const label = imgObj.label || (discKey === 'indian' ? 'Indian' : (discKey === 'western' ? 'Western' : (discKey === 'yoga' ? 'Yoga' : 'Bill')));
                const emoji = discKey === 'indian' ? '🎻' : (discKey === 'western' ? '🎹' : (discKey === 'yoga' ? '🧘' : '📄'));
                const caption = imgObj.caption;
                const isCopied = Boolean(copiedSteps[discKey]);
                const isCurrent = !isCopied && (idx === 0 || Boolean(copiedSteps[renderedExcelImages[idx - 1]?.key]));

                return (
                  <div
                    key={discKey || caption}
                    className={`p-3 rounded-xl space-y-3 transition-all border ${isCopied
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : isCurrent && renderedExcelImages.length > 1
                        ? 'bg-white border-blue-400 shadow-sm ring-2 ring-blue-100'
                        : 'bg-slate-50 border-slate-200'
                      }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{emoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              {renderedExcelImages.length > 1 ? `Step ${idx + 1}: ${label} Part` : `${label} Part`}
                            </span>
                            {isCopied && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                <Check className="w-3 h-3" /> Sent
                              </span>
                            )}
                            {isCurrent && !isCopied && renderedExcelImages.length > 1 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-300 animate-pulse">
                                👉 Next to Send
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded-md border border-green-300 inline-block mt-0.5">
                            Caption: {caption}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* WhatsApp Web Button */}
                        <button
                          onClick={() => handleOpenWhatsApp(imgObj, 'web')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                          title={`Copy ${label} image & open WhatsApp Web with caption ${caption}`}
                        >
                          <ExternalLink className="w-3 h-3" /> WhatsApp Web
                        </button>

                        {/* WhatsApp Desktop App Button */}
                        <button
                          onClick={() => handleOpenWhatsApp(imgObj, 'app')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                          title={`Copy ${label} image & open WhatsApp Desktop App with caption ${caption}`}
                        >
                          <MessageSquare className="w-3 h-3" /> WhatsApp App
                        </button>

                        {/* Copy Image Button */}
                        <button
                          onClick={() => handleCopyImageToClipboard(imgObj)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-all shadow-xs cursor-pointer"
                          title="Copy image to clipboard"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>

                        {/* Download Image Button */}
                        <button
                          onClick={() => handleDownloadImage(imgObj)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-all shadow-xs cursor-pointer"
                          title="Download PNG file"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {imgObj.base64 && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-48 overflow-y-auto shadow-inner">
                        <img
                          src={imgObj.base64}
                          alt={caption}
                          className="w-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
