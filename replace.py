import re

with open('c:/flow/app/onboarding/handshake.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const { colorScheme } = useColorScheme();\n  const isDark = colorScheme === "dark";',
    'const { colorScheme } = useColorScheme();\n  const { accentColor } = useTheme();\n  const isDark = colorScheme === "dark";'
)
content = content.replace(
    'const { colorScheme } = useColorScheme();\r\n  const isDark = colorScheme === "dark";',
    'const { colorScheme } = useColorScheme();\r\n  const { accentColor } = useTheme();\r\n  const isDark = colorScheme === "dark";'
)

content = re.sub(
    r'className=\{`w-full py-4 px-6 rounded-\[20px\] items-center justify-center mb-3 \$\{[\s\S]*?name\.trim\(\)[\s\S]*?\? "bg-amber-400"[\s\S]*?: "bg-gray-200 dark:bg-amber-400/30"[\s\S]*?\}`\}',
    r'style={{ backgroundColor: name.trim() ? accentColor : (isDark ? accentColor + "4D" : "#e5e7eb") }}\n              className="w-full py-4 px-6 rounded-[20px] items-center justify-center mb-3"',
    content
)

content = re.sub(
    r'className=\{`text-base font-black uppercase tracking-wider \$\{[\s\S]*?name\.trim\(\)[\s\S]*?\? "text-white"[\s\S]*?: "text-gray-400 dark:text-amber-400/60"[\s\S]*?\}`\}',
    r'style={{ color: name.trim() ? "white" : (isDark ? accentColor + "99" : "#9ca3af") }}\n                className="text-base font-black uppercase tracking-wider"',
    content
)

with open('c:/flow/app/onboarding/handshake.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done!")
