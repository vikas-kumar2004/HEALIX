import requests
import json

def fetch_raw(url, method='GET', body=None, headers=None):
    """
    Simulates a Postman request and handles different response types.
    """
    # Default headers if none provided
    if headers is None:
        headers = {'Content-Type': 'application/json'}

    try:
        # Perform the request
        response = requests.request(
            method=method.upper(),
            url=url,
            data=body if isinstance(body, str) else json.dumps(body),
            headers=headers
        )

        content_type = response.headers.get('Content-Type', '').lower()

        print(f"\n--- Status: {response.status_code} ---")
        
        # 1. Handle JSON
        if 'application/json' in content_type:
            return json.dumps(response.json(), indent=4)

        # 2. Handle Text/HTML
        elif 'text/' in content_type:
            return response.text

        # 3. Handle Binary/Images
        elif 'image/' in content_type or 'octet-stream' in content_type:
            return f"[Binary Data] {len(response.content)} bytes received."

        # Fallback
        return response.text

    except Exception as e:
        return f"Error: {str(e)}"

# --- Example Usage ---
if __name__ == "__main__":
    target_url = "https://www.wikipedia.org/"
    body = {}
    
    # Example GET request
    result = fetch_raw(target_url, method='GET')
    print(result)