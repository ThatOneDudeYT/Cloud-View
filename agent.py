import mss
import requests
import time

# Replace with your deployed Render URL and API Key
RENDER_URL = "https://your-app-name.onrender.com/api/upload"
API_KEY = "my-super-secret-key"

def sync_monitors():
    with mss.mss() as sct:
        # monitors[0] is the virtual bounding box, 1..N are physical screens
        for index, monitor in enumerate(sct.monitors[1:]):
            output_file = f"temp_screen_{index}.png"
            sct.shot(mon=index + 1, output=output_file)
            
            with open(output_file, 'rb') as f:
                files = {'screen': (output_file, f, 'image/png')}
                data = {'index': str(index)}
                headers = {'x-api-key': API_KEY}
                try:
                    res = requests.post(RENDER_URL, files=files, data=data, headers=headers)
                    print(f"Uploaded Monitor {index}: {res.status_code}")
                except Exception as e:
                    print(f"Error syncing: {e}")

if __name__ == "__main__":
    print("Desktop Cloud Sync Agent running...")
    # Run once before turning off or loop periodically:
    sync_monitors()