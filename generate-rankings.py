#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate sample ranking JSON files from riders_all.txt
Run: python generate-rankings.py
"""

import json
import os
import sys
from pathlib import Path

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Get project directory
PROJECT_DIR = Path(__file__).parent
RIDERS_FILE = PROJECT_DIR / 'riders_all.txt'
RANKINGS_DIR = PROJECT_DIR / 'docs' / 'api' / 'rankings'

# Create output directory
RANKINGS_DIR.mkdir(parents=True, exist_ok=True)
print("✓ Directory ready: " + str(RANKINGS_DIR) + "\n")

# Read riders from riders_all.txt
riders = []
try:
    with open(RIDERS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            # Format: "Name # #Gender #Region"
            parts = line.split('#')
            name = parts[0].strip()
            is_female = 'F' in line
            if name:
                riders.append({'name': name, 'female': is_female})
    
    print("✓ Loaded " + str(len(riders)) + " riders from riders_all.txt\n")
except Exception as e:
    print(f"✗ Error reading riders_all.txt: {e}")
    exit(1)

# Generate mock rankings
def generate_ranking(riders_list, gender, seed=2026):
    # Filter by gender
    if gender == 'female':
        filtered = [r for r in riders_list if r['female']]
    elif gender == 'male':
        filtered = [r for r in riders_list if not r['female']]
    else:  # combined
        filtered = riders_list[:]
    
    # Score based on name hash for consistency
    scored = []
    for i, rider in enumerate(filtered):
        # Simple hash of name
        name_hash = sum(ord(c) for c in rider['name'])
        # Create pseudo-random but consistent points
        base_points = 5000 - i * 15 + (name_hash % 500)
        points = max(100, base_points)
        scored.append({'name': rider['name'], 'points': points})
    
    # Sort by points descending
    scored.sort(key=lambda x: x['points'], reverse=True)
    return scored

# Generate all combinations
disciplines = ['flatland', 'street', 'trial', 'freestyle']
genders = ['male', 'female', 'combined']
years = [2026, 2025, 2024, 2023, 2022]

file_count = 0

for discipline in disciplines:
    for gender in genders:
        for year in years:
            ranking = generate_ranking(riders, gender, year)
            filename = f'{discipline}-{gender}-{year}.json'
            filepath = RANKINGS_DIR / filename
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(ranking, f, indent=2, ensure_ascii=False)
            
            print("✓ Generated " + filename + " (" + str(len(ranking)) + " riders)")
            file_count += 1

print("\n" + "="*60)
print("✓✓ SUCCESS! Generated " + str(file_count) + " ranking JSON files")
print("="*60 + "\n")
print("Files location: " + str(RANKINGS_DIR) + "\n")

# Show sample
sample_file = RANKINGS_DIR / 'flatland-male-2026.json'
if sample_file.exists():
    with open(sample_file) as f:
        data = json.load(f)
        print("Sample ranking (top 5):")
        for i, rider in enumerate(data[:5], 1):
            print("  " + str(i) + ". " + rider['name'] + " - " + str(rider['points']) + " points")

print(f"\nNext step: python api-server.py")
print(f"Or use: node api-server.js (after installing Node.js)")
