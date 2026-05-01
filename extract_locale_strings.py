#!/usr/bin/env python3
"""
Extract hardcoded localized strings from React/TypeScript code.
"""
import re
import os


def extract_localized_strings(file_path):
    """Extract localized strings from a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return []

    results = []

    # Match localized JSX/TSX strings.
    pattern1 = r'\{\s*[\'"]([^\'"\{\}]*[\u4e00-\u9fff]+[^\'"\{\}]*)[\'\"]\s*\}'
    pattern2 = r'\>([^<\>]*[\u4e00-\u9fff]+[^<\>]*)\<'
    pattern3 = r'(?:placeholder|title|alt|value|defaultValue|confirmText|cancelText|message)\s*=\s*[\'"]([^\'\"]*[\u4e00-\u9fff]+[^\'\"]*)[\'"]'
    pattern4 = r'=\s*[\'"]([^\'\"]*[\u4e00-\u9fff]+[^\'\"]*)[\'"]'

    for pattern in [pattern1, pattern2, pattern3, pattern4]:
        matches = re.finditer(pattern, content)
        for match in matches:
            localized_text = match.group(1).strip()
            if localized_text:
                line_num = content[:match.start()].count('\n') + 1
                line = content.split('\n')[line_num - 1]
                if '//' in line and line.index('//') < line.find(localized_text):
                    continue
                results.append({
                    'text': localized_text,
                    'line': line_num,
                    'category': 'unknown'
                })

    seen = set()
    unique_results = []
    for result in results:
        key = f"{result['text']}_{result['line']}"
        if key not in seen:
            seen.add(key)
            unique_results.append(result)

    return unique_results


def scan_directory(base_path, exclude_patterns=['test-ui']):
    """Scan all TSX/TS files in a directory."""
    all_findings = {}

    for root, dirs, files in os.walk(base_path):
        dirs[:] = [d for d in dirs if d not in exclude_patterns and not d.startswith('.')]

        for file in files:
            if file.endswith(('.tsx', '.ts')):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, base_path)

                findings = extract_localized_strings(file_path)
                if findings:
                    all_findings[relative_path] = findings

    return all_findings


if __name__ == '__main__':
    base_dir = 'src'
    results = scan_directory(base_dir)

    total = 0
    for file_path, findings in sorted(results.items()):
        if findings:
            print(f"\n## {file_path} ({len(findings)} strings)")
            for finding in findings[:10]:
                print(f"  Line {finding['line']}: {finding['text'][:60]}")
            total += len(findings)
            if len(findings) > 10:
                print(f"  ... and {len(findings) - 10} more")

    print(f"\n\nTotal: {len(results)} files, {total} hardcoded localized strings")
