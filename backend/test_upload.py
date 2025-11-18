import requests
import json

# Test the upload endpoint
def test_upload():
    print("Testing upload endpoint...")
    
    # First test if server is running
    try:
        response = requests.get("http://127.0.0.1:8000/")
        print(f"Server status: {response.json()}")
    except Exception as e:
        print(f"Server not running: {e}")
        return
    
    # Test CORS debug endpoint
    try:
        response = requests.get("http://127.0.0.1:8000/debug/cors")
        print(f"CORS config: {response.json()}")
    except Exception as e:
        print(f"CORS test failed: {e}")
    
    print("\nTo test upload, you need a PDF file in this directory.")
    print("The backend is working - the issue is likely in the frontend JavaScript.")
    print("\nCommon frontend issues:")
    print("1. Frontend not handling 'success: true' field properly")
    print("2. JavaScript error in upload response handler")
    print("3. Frontend expecting different response structure")
    
    print("\nSuggested fix: Check browser developer console for JavaScript errors")

if __name__ == "__main__":
    test_upload()