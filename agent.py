import os
import time
import requests
import mss

# --- CONFIGURATION ---
# Replace with your actual Render deployment URL (no trailing slash)
RENDER_URL = "https://cloud-view.onrender.com/api/upload"

# Must match the API_SECRET environment variable set in your Render dashboard
API_KEY = "Emmet2239"

# Sync interval in seconds (if running continuously)
SYNC_INTERVAL = 15

TEMP_FILENAME = "monitor_1_capture.png"


def upload_primary_monitor():
    """Captures monitor 1 and posts it to the Render service."""
    with mss.mss() as sct:
        # In MSS:
        # monitors[0] = All monitors stitched together
        # monitors[1] = Primary / First physical display
        if len(sct.monitors) < 2:
            print("[!] Error: No active display detected.")
            return False

        # Capture monitor 1
        sct.shot(mon=1, output=TEMP_FILENAME)

    # Send the capture to Render
    try:
        with open(TEMP_FILENAME, "rb") as image_file:
            files = {
                "screen": (TEMP_FILENAME, image_file, "image/png")
            }
            # index "0" maps to desktop-0.png (the first screen in the web app)
            data = {"index": "0"}
            headers = {"x-api-key": API_KEY}

            response = requests.post(
                RENDER_URL,
                files=files,
                data=data,
                headers=headers,
                timeout=10
            )

        if response.status_code == 200:
            print(f"[{time.strftime('%X')}] Successfully synced Monitor 1!")
            return True
        elif response.status_code == 401:
            print("[!] Auth failed: Make sure API_KEY matches API_SECRET on Render.")
            return False
        else:
            print(f"[!] Server responded with status code {response.status_code}: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"[!] Network error connecting to Render: {e}")
        return False
    finally:
        # Clean up temporary screenshot file locally
        if os.path.exists(TEMP_FILENAME):
            os.remove(TEMP_FILENAME)


if __name__ == "__main__":
    print("=" * 45)
    print(" Desktop Cloud Viewer — Primary Monitor Agent")
    print("=" * 45)

    mode = input("Select mode: [1] Upload once and exit | [2] Keep syncing continuously: ").strip()

    if mode == "1":
        print("\nCapturing Monitor 1...")
        upload_primary_monitor()
        print("Done. You can now view your desktop on your website.")
    else:
        print(f"\nLive sync active (updating every {SYNC_INTERVAL} seconds). Press Ctrl+C to stop.")
        try:
            while True:
                upload_primary_monitor()
                time.sleep(SYNC_INTERVAL)
        except KeyboardInterrupt:
            print("\nSync stopped.")
