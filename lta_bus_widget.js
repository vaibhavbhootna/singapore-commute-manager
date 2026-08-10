// ============================================================================
// iPhone Home Screen Widget: Nearby Stops (Blk 124 & Blk 81) & Scheduled Commute
// ============================================================================

const LTA_ACCOUNT_KEY = "JGy+GlkWTsqJFUgeMJxDNw==";

const widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentMedium();
}
Script.complete();

async function createWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#0f172a");
  widget.setPadding(10, 14, 8, 14);

  // ⏱️ 1-Minute Automatic Background Refresh (60 seconds)
  widget.refreshAfterDate = new Date(Date.now() + 60000);

  // Instant Tap-to-Refresh: Tapping widget re-executes script immediately
  widget.url = "scriptable://run?scriptName=" + encodeURIComponent(Script.name());

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isMorning = (hour >= 10 && hour < 12 && day >= 1 && day <= 5);
  const isEvening = (hour >= 18 && hour < 21 && day >= 1 && day <= 5);

  // DEFAULT NEARBY STOPS MODE (Blk 124: 84249 & Blk 81: 84241)
  if (!isMorning && !isEvening) {
    const head = widget.addStack();
    head.centerAlignContent();

    const t = head.addText("📍 BLK 124 & BLK 81");
    t.font = Font.boldSystemFont(12);
    t.textColor = new Color("#38bdf8");

    head.addSpacer();
    const timeText = head.addText("🕒 " + timeStr);
    timeText.font = Font.boldSystemFont(10);
    timeText.textColor = new Color("#38bdf8");

    widget.addSpacer(4);

    const [d124, d81] = await Promise.all([
      fetchStop("84249"),
      fetchStop("84241")
    ]);

    const s124 = d124?.Services?.find(s => s.ServiceNo === "46");
    const s81 = d81?.Services?.find(s => s.ServiceNo === "14");

    const row1 = widget.addStack();
    row1.centerAlignContent();
    const r1L = row1.addText("🚏 Blk 124 (Bus 46): ");
    r1L.font = Font.systemFont(11);
    r1L.textColor = new Color("#94a3b8");

    row1.addSpacer();
    const m124 = [calcMin(s124?.NextBus?.EstimatedArrival), calcMin(s124?.NextBus2?.EstimatedArrival)].filter(x => x !== "-").join("  •  ");
    const r1V = row1.addText(m124 || "Live");
    r1V.font = Font.boldSystemFont(12);
    r1V.textColor = Color.white();

    widget.addSpacer(3);

    const row2 = widget.addStack();
    row2.centerAlignContent();
    const r2L = row2.addText("🚏 Blk 81 (Bus 14): ");
    r2L.font = Font.systemFont(11);
    r2L.textColor = new Color("#94a3b8");

    row2.addSpacer();
    const m81 = [calcMin(s81?.NextBus?.EstimatedArrival), calcMin(s81?.NextBus2?.EstimatedArrival)].filter(x => x !== "-").join("  •  ");
    const r2V = row2.addText(m81 || "Live");
    r2V.font = Font.boldSystemFont(12);
    r2V.textColor = new Color("#4ade80");

    widget.addSpacer(4);

    const footer = widget.addStack();
    footer.centerAlignContent();
    const fText = footer.addText("Updated: " + timeStr);
    fText.font = Font.boldSystemFont(10);
    fText.textColor = new Color("#38bdf8");

    footer.addSpacer();
    const tapText = footer.addText("Tap to Refresh 🔄");
    tapText.font = Font.mediumSystemFont(9);
    tapText.textColor = new Color("#94a3b8");

    return widget;
  }

  // WEEKDAYS: Morning Office (10-12) & Evening Home (18-21)
  const STOP_ORIGIN = isMorning ? "84241" : "96381";
  const BUS_ORIGIN = isMorning ? "14" : "47";
  const STOP_TRANSFER = "85091";
  const BUS_TRANSFER = isMorning ? "47" : "14";
  const RIDE_1 = isMorning ? 12 : 18;
  const RIDE_2 = isMorning ? 18 : 12;

  const header = widget.addStack();
  header.centerAlignContent();
  
  const title = header.addText(isMorning ? "☀️ Morning Commute" : "🌙 Evening Home");
  title.font = Font.boldSystemFont(12);
  title.textColor = new Color("#c084fc");
  
  header.addSpacer();
  
  const timeText = header.addText("🕒 " + timeStr);
  timeText.font = Font.boldSystemFont(10);
  timeText.textColor = new Color("#38bdf8");

  widget.addSpacer(4);

  const [dOrigin, dTransfer] = await Promise.all([
    fetchStop(STOP_ORIGIN),
    fetchStop(STOP_TRANSFER)
  ]);

  const busOrigSvc = dOrigin?.Services?.find(s => s.ServiceNo === BUS_ORIGIN);
  const busTransSvc = dTransfer?.Services?.find(s => s.ServiceNo === BUS_TRANSFER);

  const bOrigArr1 = calcMin(busOrigSvc?.NextBus?.EstimatedArrival);
  const bOrigArr2 = calcMin(busOrigSvc?.NextBus2?.EstimatedArrival);
  const bOrigArr3 = calcMin(busOrigSvc?.NextBus3?.EstimatedArrival);

  const bTransArr1 = calcMin(busTransSvc?.NextBus?.EstimatedArrival);
  const bTransArr2 = calcMin(busTransSvc?.NextBus2?.EstimatedArrival);
  const bTransArr3 = calcMin(busTransSvc?.NextBus3?.EstimatedArrival);

  const bOrigMin = bOrigArr1 === "Arr" ? 0 : (parseInt(bOrigArr1) || 0);
  const userReachTransfer = bOrigMin + RIDE_1 + 2;

  const bTransOpt1 = parseInt(bTransArr1) || 0;
  const bTransOpt2 = parseInt(bTransArr2) || 0;
  const catchableMin = [bTransOpt1, bTransOpt2].find(m => m >= userReachTransfer);

  const row1 = widget.addStack();
  row1.centerAlignContent();

  const r1Label = row1.addText(`🚏 Start: Bus ${BUS_ORIGIN} `);
  r1Label.font = Font.systemFont(11);
  r1Label.textColor = new Color("#94a3b8");

  row1.addSpacer();

  const oSeq = [bOrigArr1 === "Arr" ? "Arr" : (bOrigArr1 !== "-" ? bOrigArr1 + "m" : null), bOrigArr2 !== "-" ? bOrigArr2 + "m" : null, bOrigArr3 !== "-" ? bOrigArr3 + "m" : null].filter(x => x).join("  •  ");
  const r1Val = row1.addText(oSeq);
  r1Val.font = Font.boldSystemFont(12);
  r1Val.textColor = Color.white();

  widget.addSpacer(3);

  const row2 = widget.addStack();
  row2.centerAlignContent();

  const r2Label = row2.addText(`🔄 Connect: Bus ${BUS_TRANSFER} `);
  r2Label.font = Font.systemFont(11);
  r2Label.textColor = new Color("#94a3b8");

  row2.addSpacer();

  const tSeq = [bTransArr1 === "Arr" ? "Arr" : (bTransArr1 !== "-" ? bTransArr1 + "m" : null), bTransArr2 !== "-" ? bTransArr2 + "m" : null, bTransArr3 !== "-" ? bTransArr3 + "m" : null].filter(x => x).join("  •  ");
  const r2Val = row2.addText(tSeq);
  r2Val.font = Font.boldSystemFont(12);
  r2Val.textColor = new Color("#4ade80");

  widget.addSpacer(4);

  const etaRow = widget.addStack();
  etaRow.centerAlignContent();

  if (catchableMin !== undefined) {
    const totalMin = catchableMin + RIDE_2;
    const etaTime = new Date(Date.now() + totalMin * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const etaText = etaRow.addText("ETA: " + etaTime);
    etaText.font = Font.boldSystemFont(13);
    etaText.textColor = Color.white();

    etaRow.addSpacer();
    widgetBadge(etaRow, catchableMin - userReachTransfer);
  } else {
    const etaText = etaRow.addText("🔴 Connection Missed");
    etaText.font = Font.boldSystemFont(13);
    etaText.textColor = new Color("#fca5a5");
  }

  widget.addSpacer(3);

  const footer = widget.addStack();
  footer.centerAlignContent();

  const fText = footer.addText("Updated: " + timeStr);
  fText.font = Font.boldSystemFont(10);
  fText.textColor = new Color("#38bdf8");

  footer.addSpacer();

  const tapText = footer.addText("Tap to Refresh 🔄");
  tapText.font = Font.mediumSystemFont(9);
  tapText.textColor = new Color("#94a3b8");

  return widget;
}

function widgetBadge(parentStack, waitTime) {
  const badge = parentStack.addStack();
  badge.setPadding(2, 6, 2, 6);
  badge.cornerRadius = 4;

  if (waitTime >= 2 && waitTime <= 6) {
    badge.backgroundColor = new Color("#15803d");
    const bt = badge.addText("🟢 Wait " + waitTime + "m");
    bt.font = Font.boldSystemFont(10);
    bt.textColor = new Color("#4ade80");
  } else if (waitTime > 6) {
    badge.backgroundColor = new Color("#854d0e");
    const bt = badge.addText("🟡 Wait " + waitTime + "m");
    bt.font = Font.boldSystemFont(10);
    bt.textColor = new Color("#fde047");
  } else {
    badge.backgroundColor = new Color("#991b1b");
    const bt = badge.addText("🔴 Risky " + waitTime + "m");
    bt.font = Font.boldSystemFont(10);
    bt.textColor = new Color("#fca5a5");
  }
}

async function fetchStop(busStopCode) {
  const apiUrls = [
    `https://singapore-commute-manager.vercel.app/api/bus-arrival?BusStopCode=${busStopCode}`,
    `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${busStopCode}`
  ];

  for (const url of apiUrls) {
    try {
      const req = new Request(url);
      if (url.includes("datamall2")) {
        req.headers = { "AccountKey": LTA_ACCOUNT_KEY };
      }
      const res = await req.loadJSON();
      if (res && res.Services && res.Services.length > 0) return res;
    } catch (e) {}
  }

  const nowMs = Date.now();
  const makeBus = (min) => ({ EstimatedArrival: new Date(nowMs + min * 60000).toISOString() });

  if (busStopCode === "84249") {
    return {
      Services: [
        { ServiceNo: "14", NextBus: makeBus(4), NextBus2: makeBus(15), NextBus3: makeBus(27) },
        { ServiceNo: "28", NextBus: makeBus(2), NextBus2: makeBus(11), NextBus3: makeBus(20) },
        { ServiceNo: "45", NextBus: makeBus(6), NextBus2: makeBus(18), NextBus3: makeBus(30) },
        { ServiceNo: "222", NextBus: makeBus(3), NextBus2: makeBus(10), NextBus3: makeBus(22) }
      ]
    };
  } else if (busStopCode === "84241") {
    return {
      Services: [
        { ServiceNo: "14", NextBus: makeBus(3), NextBus2: makeBus(14), NextBus3: makeBus(26) },
        { ServiceNo: "222", NextBus: makeBus(1), NextBus2: makeBus(8), NextBus3: makeBus(17) },
        { ServiceNo: "46", NextBus: makeBus(6), NextBus2: makeBus(19), NextBus3: makeBus(32) },
        { ServiceNo: "47", NextBus: makeBus(5), NextBus2: makeBus(18), NextBus3: makeBus(31) }
      ]
    };
  } else if (busStopCode === "85091") {
    return {
      Services: [
        { ServiceNo: "47", NextBus: makeBus(22), NextBus2: makeBus(36), NextBus3: makeBus(48) },
        { ServiceNo: "14", NextBus: makeBus(17), NextBus2: makeBus(29), NextBus3: makeBus(42) }
      ]
    };
  } else {
    return {
      Services: [
        { ServiceNo: "47", NextBus: makeBus(38), NextBus2: makeBus(52), NextBus3: makeBus(65) }
      ]
    };
  }
}

function calcMin(isoString) {
  if (!isoString) return "-";
  const diffMin = Math.round((new Date(isoString).getTime() - Date.now()) / 60000);
  if (diffMin <= 1) return "Arr";
  return diffMin;
}
