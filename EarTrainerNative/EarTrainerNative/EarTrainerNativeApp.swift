//
//  EarTrainerNativeApp.swift
//  EarTrainerNative
//
//  ToneDeath/EarTrainer iOS App
//

import SwiftUI
import AVFoundation

@main
struct EarTrainerNativeApp: App {
    init() {
        // Configure audio session for recording and playback
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker, .allowBluetooth])
            try audioSession.setActive(true)
            print("Audio session configured successfully")
        } catch {
            print("Failed to configure audio session: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
