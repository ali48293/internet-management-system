from fastapi import FastAPI
import sys
import os
import traceback

app = FastAPI()

@app.get("/api/health")
def health():
    # Attempt to diagnose the import
    try:
        # 1. Path check
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        backend_dir = os.path.join(root_dir, "backend")
        sys.path.insert(0, backend_dir)
        
        # 2. Import check
        import main
        return {
            "status": "partial_ok",
            "message": "Basic API is running, but real backend had to be manually imported",
            "backend_main_imported": "success"
        }
    except Exception as e:
        return {
            "status": "error",
            "error_type": str(type(e)),
            "error_message": str(e),
            "traceback": traceback.format_exc(),
            "sys_path": sys.path,
            "cwd": os.getcwd()
        }

@app.get("/api/test-db")
def test_db():
    try:
        import backend.app.database
        return {"status": "import_success"}
    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()}

@app.get("/{full_path:path}")
def catch_all(full_path: str):
    return {"message": "Diagnostic mode active", "path": full_path}
