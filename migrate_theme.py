import os

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'from "@/context/ThemeContext"' in content:
        new_content = content.replace('useTheme', 'useAppTheme')
        # Fix the import line if it was replaced (it would be import { useAppTheme } from ...)
        # But wait, replace('useTheme', 'useAppTheme') replaces all instances.
        # import { useTheme } -> import { useAppTheme }
        # const { ... } = useTheme() -> const { ... } = useAppTheme()
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

count = 0
for root, dirs, files in os.walk('.'):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            if replace_in_file(os.path.join(root, file)):
                count += 1

print(f"Updated {count} files.")
