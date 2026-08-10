//
//  LTAWidget.swift
//  Singapore LTA Bus Arrival iPhone Widget (WidgetKit)
//

import WidgetKit
import SwiftUI

// MARK: - Widget Timeline Provider
struct LTAWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> BusEntry {
        BusEntry(date: Date(), stopCode: "20251", services: [
            BusServiceItem(serviceNo: "176", next1: "Arr", next2: "12m", load: "SEA"),
            BusServiceItem(serviceNo: "30", next1: "2m", next2: "8m", load: "SDA"),
            BusServiceItem(serviceNo: "78", next1: "5m", next2: "19m", load: "SEA")
        ])
    }

    func getSnapshot(in context: Context, completion: @escaping (BusEntry) -> ()) {
        let entry = placeholder(in: context)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BusEntry>) -> ()) {
        // Fetch LTA API data asynchronously
        fetchLTABusData(busStopCode: "20251") { entry in
            // Refresh timeline every 1 minute
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 1, to: Date())!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }
    
    private func fetchLTABusData(busStopCode: String, completion: @escaping (BusEntry) -> Void) {
        let apiUrlStr = "https://singapore-commute-manager.vercel.app/api/bus-arrival?BusStopCode=\(busStopCode)"
        guard let url = URL(string: apiUrlStr) else {
            completion(placeholder(in: SimpleEntryContext()))
            return
        }
        
        var request = URLRequest(url: url)
        request.timeoutInterval = 10
        
        URLSession.shared.dataTask(with: request) { data, _, error in
            guard let data = data, error == nil else {
                completion(placeholder(in: SimpleEntryContext()))
                return
            }
            
            struct LTAResponse: Decodable {
                let Services: [LTAService]?
            }
            struct LTAService: Decodable {
                let ServiceNo: String
                let NextBus: LTABusTime?
                let NextBus2: LTABusTime?
            }
            struct LTABusTime: Decodable {
                let EstimatedArrival: String?
                let Load: String?
            }
            
            func parseMin(_ isoStr: String?) -> String {
                guard let isoStr = isoStr, !isoStr.isEmpty else { return "-" }
                let formatter = ISO8601DateFormatter()
                formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                let date = formatter.date(from: isoStr) ?? ISO8601DateFormatter().date(from: isoStr)
                guard let arrivalDate = date else { return "-" }
                let diff = Int(arrivalDate.timeIntervalSinceNow / 60)
                if diff <= 1 { return "Arr" }
                return "\(diff)m"
            }
            
            if let decoded = try? JSONDecoder().decode(LTAResponse.self, from: data),
               let svcs = decoded.Services, !svcs.isEmpty {
                let items = svcs.prefix(4).map { s in
                    BusServiceItem(
                        serviceNo: s.ServiceNo,
                        next1: parseMin(s.NextBus?.EstimatedArrival),
                        next2: parseMin(s.NextBus2?.EstimatedArrival),
                        load: s.NextBus?.Load ?? "SEA"
                    )
                }
                let entry = BusEntry(date: Date(), stopCode: busStopCode, services: items)
                completion(entry)
            } else {
                completion(placeholder(in: SimpleEntryContext()))
            }
        }.resume()
    }
}

private struct SimpleEntryContext {}

// MARK: - Data Models
struct BusServiceItem: Identifiable {
    var id: String { serviceNo }
    let serviceNo: String
    let next1: String
    let next2: String
    let load: String
}

struct BusEntry: TimelineEntry {
    let date: Date
    let stopCode: String
    let services: [BusServiceItem]
}

// MARK: - Widget View
struct LTAWidgetEntryView : View {
    var entry: LTAWidgetProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Header
            HStack {
                Text("🚏 Stop \(entry.stopCode)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(Color.blue)
                Spacer()
                Text(entry.date, style: .time)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Divider()
            
            // Services
            ForEach(entry.services.prefix(3)) { svc in
                HStack {
                    Text(svc.serviceNo)
                        .font(.headline)
                        .bold()
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Text(svc.next1)
                        .font(.subheadline)
                        .bold()
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(svc.next1 == "Arr" ? Color.green : Color.gray.opacity(0.3))
                        .cornerRadius(6)
                        .foregroundColor(svc.next1 == "Arr" ? .white : .green)
                    
                    if svc.next2 != "-" {
                        Text(svc.next2)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding()
        .containerBackground(for: .widget) {
            Color(red: 0.05, green: 0.09, blue: 0.16)
        }
    }
}

// MARK: - Widget Configuration
@main
struct LTAWidget: Widget {
    let kind: String = "LTAWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LTAWidgetProvider()) { entry in
            LTAWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("LTA Bus Arrival")
        .description("Live Singapore Bus Arrival Times on your Home Screen.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
