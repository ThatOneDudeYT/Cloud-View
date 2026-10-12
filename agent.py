import os
import time
import requests
import mss

# --- CONFIGURATION ---
RENDER_URL = "https://cloud-view.onrender.com/api/upload"

# Put your exact Render API_SECRET string here:
API_KEY = "Emmett2239"

SYNC_INTERVAL = 15
TEMP_FILENAME = "monitor_1_capture.png"

def upload_primary_monitor():
    """Captures monitor 1 and posts it to the Render service."""
    with mss.MSS() as sct:
        if len(sct.monitors) < 2:
            print("[!] Error: No active display detected.")
            return False

        # Capture primary monitor (mon=1)
        sct.shot(mon=1, output=TEMP_FILENAME)

    try:
        with open(TEMP_FILENAME, "rb") as image_file:
            files = {"screen": (TEMP_FILENAME, image_file, "image/png")}
            data = {"index": "0"}
            headers = {"x-api-key": API_KEY}

            response = requests.post(
                RENDER_URL,
                files=files,
                data=data,
                headers=headers,
                timeout=15
            )

        if response.status_code == 200:
            print(f"[{time.strftime('%X')}] Successfully synced Monitor 1!")
            return True
        elif response.status_code == 401:
            print(f"[{time.strftime('%X')}] Auth failed (401): API_KEY does not match API_SECRET on Render.")
            return False
        else:
            print(f"[{time.strftime('%X')}] Server returned {response.status_code}: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"[{time.strftime('%X')}] Network error connecting to Render: {e}")
        return False
    finally:
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
    else:
        print(f"\nLive sync active (updating every {SYNC_INTERVAL}s). Press Ctrl+C to stop.")
        try:
            while True:
                upload_primary_monitor()
                time.sleep(SYNC_INTERVAL)
        except KeyboardInterrupt:
            print("\nSync stopped.")
