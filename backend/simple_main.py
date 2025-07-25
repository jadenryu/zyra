#!/usr/bin/env python3
"""
Simple Zyra Backend Server
Run with: python simple_main.py
"""
import asyncio
from typing import Dict, Any
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
from threading import Thread
import os

class ZyraHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy"}).encode())
        
        elif self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"message": "Welcome to Zyra API", "version": "1.0.0"}).encode())
        
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def log_message(self, format, *args):
        # Suppress default logging
        print(f"[{self.client_address[0]}] {format % args}")

def run_server():
    server = HTTPServer(('127.0.0.1', 8000), ZyraHandler)
    print("🚀 Zyra Backend Server running on http://127.0.0.1:8000")
    print("✅ Health check: http://127.0.0.1:8000/health")
    server.serve_forever()

if __name__ == "__main__":
    run_server()