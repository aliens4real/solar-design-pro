// ── Permit Forms Database — OH/PA Jurisdictions ──
// Keys: st=state code, co=county (null=state-level), pl=city/place (null=county-level),
//   cat=building|electrical|zoning|reference, nm=display name, url=direct PDF/page URL,
//   dept=department name, ph=phone number
export const PERMIT_FORMS = [
  // ═══════════════════════════════════════════
  // OHIO — STATE LEVEL
  // ═══════════════════════════════════════════
  { st: "OH", co: null, pl: null, cat: "reference", nm: "Ohio Solar PV Permitting Checklist", url: "https://cdn.toledo.oh.gov/uploads/documents/Solar-Panel-Checklist2.pdf", dept: "Ohio Board of Building Standards", ph: "(614) 644-2613" },
  { st: "OH", co: null, pl: null, cat: "reference", nm: "2024 Ohio Building Code Rules", url: "https://dam.assets.ohio.gov/image/upload/com.ohio.gov/documents/2024%20Ohio%20Building%20Code%20Rules%20Effective%20March%201,%202024.pdf", dept: "Ohio Board of Building Standards", ph: "(614) 644-2613" },

  // ═══════════════════════════════════════════
  // MAHONING COUNTY — Building + CEIB Electrical
  // ═══════════════════════════════════════════
  { st: "OH", co: "Mahoning", pl: null, cat: "building", nm: "Mahoning County Residential Permit Application", url: "https://www.mahoningcountyoh.gov/DocumentCenter/View/403/Residential-Application-PDF", dept: "Mahoning County Building Inspection", ph: "(330) 270-2894" },
  { st: "OH", co: "Mahoning", pl: null, cat: "building", nm: "Mahoning County Commercial Permit Application", url: "https://www.mahoningcountyoh.gov/DocumentCenter/View/49138/Commercial-Application-PDF", dept: "Mahoning County Building Inspection", ph: "(330) 270-2894" },
  { st: "OH", co: "Mahoning", pl: null, cat: "building", nm: "Mahoning County Minor Alterations Permit", url: "https://www.mahoningcountyoh.gov/DocumentCenter/View/49137/Minor-Alterations-Permit-Application-PDF", dept: "Mahoning County Building Inspection", ph: "(330) 270-2894" },
  { st: "OH", co: "Mahoning", pl: null, cat: "electrical", nm: "CEIB — Central Electric Inspection Bureau", url: "https://centralinspections.org/", dept: "CEIB (Mahoning/Trumbull/Columbiana)", ph: "(330) 744-5238" },
  { st: "OH", co: "Mahoning", pl: null, cat: "electrical", nm: "CEIB Residential Electrical System Review", url: "https://centralinspections.org/wp-content/uploads/2016/07/Residental-Electrical-System-Review.pdf", dept: "CEIB", ph: "(330) 744-5238" },
  { st: "OH", co: "Mahoning", pl: null, cat: "electrical", nm: "CEIB Fee Schedule", url: "https://centralinspections.org/about-ceib/service-fees/", dept: "CEIB", ph: "(330) 744-5238" },

  // ═══════════════════════════════════════════
  // TRUMBULL COUNTY — Building Department
  // ═══════════════════════════════════════════
  { st: "OH", co: "Trumbull", pl: null, cat: "building", nm: "Trumbull County Building Permit Application", url: "http://buildinginspection.co.trumbull.oh.us/pdfs/Fillable%20Application.pdf", dept: "Trumbull County Building Inspection", ph: "(330) 675-2467" },
  { st: "OH", co: "Trumbull", pl: null, cat: "building", nm: "Trumbull County Plan Approval Application", url: "http://buildinginspection.co.trumbull.oh.us/pdfs/APPLICATION%20FOR%20PLAN%20APPROVAL.pdf", dept: "Trumbull County Building Inspection", ph: "(330) 675-2467" },
  { st: "OH", co: "Trumbull", pl: null, cat: "electrical", nm: "Trumbull County Electrical Permit Application", url: "http://buildinginspection.co.trumbull.oh.us/pdfs/Electrical%20Permit%20Application.pdf", dept: "Trumbull County Building Inspection", ph: "(330) 675-2467" },
  { st: "OH", co: "Trumbull", pl: null, cat: "reference", nm: "Trumbull County Fee Schedule", url: "http://buildinginspection.co.trumbull.oh.us/pdfs/Fee%20Schedule%20(01%2005%202016).pdf", dept: "Trumbull County Building Inspection", ph: "(330) 675-2467" },
  { st: "OH", co: "Trumbull", pl: null, cat: "electrical", nm: "CEIB — Central Electric Inspection Bureau", url: "https://centralinspections.org/", dept: "CEIB (Mahoning/Trumbull/Columbiana)", ph: "(330) 744-5238" },

  // ═══════════════════════════════════════════
  // COLUMBIANA COUNTY — Building + ELEVATE
  // ═══════════════════════════════════════════
  { st: "OH", co: "Columbiana", pl: null, cat: "building", nm: "Columbiana County Building Dept (in-person forms)", url: "https://columbianacountyauditor.org/obtain-building-permits-in-columbiana/", dept: "Columbiana County Building Dept", ph: "(330) 424-6604" },
  { st: "OH", co: "Columbiana", pl: null, cat: "building", nm: "ELEVATE Building Solutions — Residential Forms", url: "https://elevatebuildings.com/residential-applications-forms/", dept: "ELEVATE (City of Columbiana & Salem)", ph: "(330) 537-1536" },
  { st: "OH", co: "Columbiana", pl: null, cat: "building", nm: "ELEVATE Building Solutions — Commercial Forms", url: "https://elevatebuildings.com/commercial-applications-forms/", dept: "ELEVATE (City of Columbiana & Salem)", ph: "(330) 537-1536" },
  { st: "OH", co: "Columbiana", pl: null, cat: "zoning", nm: "City of Columbiana Zoning Forms", url: "https://columbianaohio.gov/planning-zoning/forms/", dept: "City of Columbiana Planning & Zoning", ph: null },
  { st: "OH", co: "Columbiana", pl: null, cat: "electrical", nm: "CEIB — Central Electric Inspection Bureau", url: "https://centralinspections.org/", dept: "CEIB (Mahoning/Trumbull/Columbiana)", ph: "(330) 744-5238" },

  // ═══════════════════════════════════════════
  // YOUNGSTOWN — Zoning
  // ═══════════════════════════════════════════
  { st: "OH", co: "Mahoning", pl: "Youngstown", cat: "zoning", nm: "Youngstown Residential Alteration Permit", url: "https://youngstownohio.gov/sites/default/files/forms/Zoning%20--%20Residential%20Alteration%20Permit%20Application.pdf", dept: "City of Youngstown Zoning", ph: "(330) 742-8804" },
  { st: "OH", co: "Mahoning", pl: "Youngstown", cat: "zoning", nm: "Youngstown Zoning Permit Application", url: "https://youngstownohio.gov/sites/default/files/forms/APPLICATION%20FOR%20ZONING%20PERMIT.pdf", dept: "City of Youngstown Zoning", ph: "(330) 742-8804" },
  { st: "OH", co: "Mahoning", pl: "Youngstown", cat: "reference", nm: "Youngstown Master Fee Schedule", url: "https://youngstownohio.gov/sites/default/files/forms/Zoning%20--%20Master%20Fee%20Schedule.pdf", dept: "City of Youngstown Zoning", ph: "(330) 742-8804" },

  // ═══════════════════════════════════════════
  // BOARDMAN TOWNSHIP — Zoning
  // ═══════════════════════════════════════════
  { st: "OH", co: "Mahoning", pl: "Boardman", cat: "zoning", nm: "Boardman Twp Zoning Compliance Permit", url: "https://www.boardmantwp.com/zoning/files/2023/08/Zoning-Compliance-Permit.pdf", dept: "Boardman Twp Planning & Zoning", ph: "(330) 726-4177" },
  { st: "OH", co: "Mahoning", pl: "Boardman", cat: "zoning", nm: "Boardman Twp Zoning (w/ Site Plan Review)", url: "https://www.boardmantwp.com/zoning/files/2025/03/Zoning-Compliance-needing-site-plan-review-fillable-PDF.pdf", dept: "Boardman Twp Planning & Zoning", ph: "(330) 726-4177" },

  // ═══════════════════════════════════════════
  // CITY OF WARREN — Building
  // ═══════════════════════════════════════════
  { st: "OH", co: "Trumbull", pl: "Warren", cat: "building", nm: "City of Warren Building Permit Application", url: "https://www.cityofwarren.org/wp-content/uploads/2019/08/Building_Building_Permit-Plan_Review_Application.pdf", dept: "Warren Engineering, Planning & Building", ph: "(330) 841-2562" },

  // ═══════════════════════════════════════════
  // CITY OF NILES — Building
  // ═══════════════════════════════════════════
  { st: "OH", co: "Trumbull", pl: "Niles", cat: "building", nm: "City of Niles Building Permit Application", url: "https://thecityofniles.com/PDFs/buildingpermit.pdf", dept: "City of Niles Building Dept", ph: "(330) 544-9000 x1181" },

  // ═══════════════════════════════════════════
  // PENNSYLVANIA — STATE LEVEL
  // ═══════════════════════════════════════════
  { st: "PA", co: null, pl: null, cat: "building", nm: "PA UCC-3 Building Permit Application", url: "https://www.pa.gov/content/dam/copapwp-pagov/en/dli/documents/individuals/labor-management-relations/bois/documents/ucc/ucc-3.pdf", dept: "PA Dept of Labor & Industry", ph: null },
  { st: "PA", co: null, pl: null, cat: "building", nm: "PA Solar Application Packet (Code Alliance)", url: "https://pacodealliance.com/wp-content/uploads/2024/06/Solar-Packet_07-01-24.pdf", dept: "PA Municipal Code Alliance", ph: null },
  { st: "PA", co: null, pl: null, cat: "reference", nm: "PA PUC Solar PV Fact Sheet", url: "https://www.puc.pa.gov/media/2157/considerations-for-installing-a-photovoltaic-system-factsheet-dec2022.pdf", dept: "PA Public Utility Commission", ph: null },
  { st: "PA", co: null, pl: null, cat: "reference", nm: "PA Solar Zoning & Permitting Guidebook", url: "https://www.pennfuture.org/Files/Admin/SunSHOT_Guide.compressed.pdf", dept: "PennFuture / SunShot", ph: null },

  // ═══════════════════════════════════════════
  // SHARON PA — Building + Zoning
  // ═══════════════════════════════════════════
  { st: "PA", co: "Mercer", pl: "Sharon", cat: "building", nm: "City of Sharon Building Permit Application", url: "https://www.cityofsharon.net/media/Building%20Permit%20Application.pdf", dept: "Sharon Code & Zoning Enforcement", ph: "(724) 983-3201" },
  { st: "PA", co: "Mercer", pl: "Sharon", cat: "zoning", nm: "City of Sharon Zoning Permit Application", url: "https://www.cityofsharon.net/media/Zoning%20Permit%20Application%202023.pdf", dept: "Sharon Code & Zoning Enforcement", ph: "(724) 983-3201" },

  // ═══════════════════════════════════════════
  // BEAVER FALLS PA — Building + Zoning
  // ═══════════════════════════════════════════
  { st: "PA", co: "Beaver", pl: "Beaver Falls", cat: "building", nm: "Beaver Falls UCC Building Permit", url: "https://beaverfallspa.org/wp-content/uploads/2022/03/UCCbuildingpermit.pdf", dept: "Beaver Falls Code Enforcement", ph: "(724) 847-2808 x219" },
  { st: "PA", co: "Beaver", pl: "Beaver Falls", cat: "zoning", nm: "Beaver Falls Zoning Permit Application", url: "https://beaverfallspa.org/wp-content/uploads/2023/01/Zoning-Permit-Application.pdf", dept: "Beaver Falls Code Enforcement", ph: "(724) 847-2808 x219" },

  // ═══════════════════════════════════════════
  // NEW CASTLE PA (Lawrence County) — Building
  // ═══════════════════════════════════════════
  { st: "PA", co: "Lawrence", pl: "New Castle", cat: "building", nm: "New Castle City Permit Application", url: "https://www.newcastlepa.org/wp-content/uploads/2020/07/City-Permit-Application.pdf", dept: "New Castle Code Enforcement", ph: "(724) 656-3539" },
  { st: "PA", co: "Lawrence", pl: "New Castle", cat: "building", nm: "New Castle UCC Commercial Building Permit", url: "https://www.newcastlepa.org/wp-content/uploads/2020/07/PA-UCC-Commercial-Building-Permit-Application.pdf", dept: "New Castle Code Enforcement", ph: "(724) 656-3539" },

  // ═══════════════════════════════════════════
  // BEAVER BOROUGH PA — Building + Zoning
  // ═══════════════════════════════════════════
  { st: "PA", co: "Beaver", pl: "Beaver", cat: "building", nm: "Beaver Borough Zoning/UCC Building Permit", url: "https://beaverpa.us/wp-content/uploads/2015/09/zoning_building_permit_app.pdf", dept: "Beaver Borough Zoning", ph: "(724) 773-6700" },

  // ═══════════════════════════════════════════
  // CHIPPEWA TWP PA (Beaver County) — Solar-Specific
  // ═══════════════════════════════════════════
  { st: "PA", co: "Beaver", pl: "Chippewa", cat: "building", nm: "Chippewa Twp Solar Arrays Guide & Permit", url: "http://chippewa-twp.org/wp-content/uploads/2023/02/MDIA-Solar-Arrays-Guide-Permit_Fillable.pdf", dept: "Chippewa Twp (MDIA)", ph: null },
  { st: "PA", co: "Beaver", pl: "Chippewa", cat: "building", nm: "Chippewa Twp Zoning/UCC Permit Application", url: "http://chippewa-twp.org/wp-content/uploads/2023/02/ZONING_UCC_PERMIT_APPLICATION_Fillable.pdf", dept: "Chippewa Twp", ph: null },

  // ═══════════════════════════════════════════
  // PA COUNTIES — Contact/Referral
  // ═══════════════════════════════════════════
  { st: "PA", co: "Lawrence", pl: null, cat: "reference", nm: "Lawrence County Planning & Development", url: "https://www.lawrencecountypa.gov/departments/planning-community-development", dept: "Lawrence County Planning", ph: "(724) 656-2144" },
  { st: "PA", co: "Mercer", pl: null, cat: "reference", nm: "Mercer County Regional Planning Commission", url: "https://www.mcrpc.com/", dept: "MCRPC", ph: "(724) 981-2412" },
  { st: "PA", co: "Beaver", pl: null, cat: "reference", nm: "Beaver County Planning & Redevelopment", url: "https://www.beavercountypa.gov/departments/planning-commission", dept: "Beaver County Planning Commission", ph: "(724) 770-4421" },
];
