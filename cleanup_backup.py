import os
import shutil
import stat

def remove_readonly(func, path, excinfo):
    os.chmod(path, stat.S_IWRITE)
    func(path)

path = r'C:\strive\android_backup'
if os.path.exists(path):
    print(f"Deleting {path}...")
    shutil.rmtree(path, onerror=remove_readonly)
    print("Done.")
else:
    print(f"{path} does not exist.")
