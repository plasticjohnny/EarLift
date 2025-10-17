//
//  ContentView.swift
//  EarTrainerNative
//
//  ToneDeath/EarTrainer iOS App
//

import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        WebView(url: URL(string: "https://tonedeath.app")!)
            .edgesIgnoringSafeArea(.all)
            .onAppear {
                // Request microphone permission on launch
                AVAudioSession.sharedInstance().requestRecordPermission { granted in
                    print("Microphone permission: \(granted)")
                }
            }
    }
}

struct WebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        // Configure WebView for audio
        let configuration = WKWebViewConfiguration()

        // Allow inline media playback (no fullscreen required)
        configuration.allowsInlineMediaPlayback = true

        // Allow media to play without user interaction
        configuration.mediaTypesRequiringUserActionForPlayback = []

        // Create preferences
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        configuration.defaultWebpagePreferences = preferences

        // Create WebView
        let webView = WKWebView(frame: .zero, configuration: configuration)

        // Allow microphone access
        webView.configuration.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")

        // Debug console logging
        #if DEBUG
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
        #endif

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        let request = URLRequest(url: url)
        webView.load(request)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
