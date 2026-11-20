#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Export real rider rankings from Results_Disciplines to JSON files.
Processes actual event results and calculates points for each rider.
"""

import os
import json
from pathlib import Path
from collections import defaultdict
import re

PROJECT_DIR = Path(__file__).parent
RESULTS_DIR = PROJECT_DIR / 'Results_Disciplines'
OUTPUT_DIR = PROJECT_DIR / 'docs' / 'api' / 'rankings'

# Scoring configuration (from ranking.js)
SCORING_CONFIG = {
    'UNICON_WEIGHT': 4,
    'STREET_UNICON_WEIGHT': 3,
    'National_WEIGHT': 2,
    'Continental_WEIGHT': 3,
    'Local_WEIGHT': 1,
    'minPlacePoints': 15,
    'scalingPower': 5,
    'yearDecay': 0.9,
    'seasonDecay': 0.9,
    'regionPenalty': 0.8,
}

CURRENT_YEAR = 26

# Event configurations
EVENTS = {
    'Flatland': {
        'Unicon': {'weight': 4, 'pattern': 'Unicon\\d+\\.txt'},
        'EUCW': {'weight': 3, 'pattern': 'EUCW\\d+\\.txt'},
        'EUCS': {'weight': 3, 'pattern': 'EUCS\\d+\\.txt'},
        'CFM': {'weight': 2, 'pattern': 'CFM\\d+\\.txt'},
        'NAUCC': {'weight': 3, 'pattern': 'NAUCC\\d+\\.txt'},
        'BUC': {'weight': 2, 'pattern': 'BUC\\d+\\.txt'},
        'JUC': {'weight': 2, 'pattern': 'JUC\\d+\\.txt'},
    },
    'Street': {
        'Unicon': {'weight': 3, 'pattern': 'Unicon\\d+\\.txt'},
        'NAUCC': {'weight': 3, 'pattern': 'NAUCC\\d+\\.txt'},
        'EUCW': {'weight': 3, 'pattern': 'EUCW\\d+\\.txt'},
        'BUC': {'weight': 2, 'pattern': 'BUC\\d+\\.txt'},
    },
    'Trial': {
        'Unicon': {'weight': 4, 'pattern': 'Unicon\\d+\\.txt'},
        'NAUCC': {'weight': 3, 'pattern': 'NAUCC\\d+\\.txt'},
        'EUCW': {'weight': 3, 'pattern': 'EUCW\\d+\\.txt'},
    },
    'Freestyle': {
        'Unicon': {'weight': 4, 'pattern': 'Unicon\\d+\\.txt'},
        'NAUCC': {'weight': 3, 'pattern': 'NAUCC\\d+\\.txt'},
        'EUCW': {'weight': 3, 'pattern': 'EUCW\\d+\\.txt'},
    }
}

def extract_year_from_filename(filename):
    """Extract year from filename like 'Unicon26.txt' -> 26"""
    match = re.search(r'(\d{2})\\.txt$', filename)
    return int(match.group(1)) if match else CURRENT_YEAR

def calculate_points(place, num_competitors, weight=1.0, year_decay=1.0):
    """Calculate points for a placement"""
    if place <= 0 or place > num_competitors:
        return 0
    
    # Power law scoring: points = weight * 100 * ((n - rank + 1) / n) ^ power
    n = max(num_competitors, 10)  # Minimum 10 competitors
    power = SCORING_CONFIG['scalingPower']
    base_points = 100 * (((n - place + 1) / n) ** power)
    total_points = base_points * weight * year_decay
    
    return max(total_points, SCORING_CONFIG['minPlacePoints'])

def parse_results_file(filepath):
    """Parse a results file and return list of (name, gender, place)"""
    results = []
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                
                # Format: "place # name # gender"
                parts = [p.strip() for p in line.split('#')]
                if len(parts) >= 3:
                    try:
                        place = int(parts[0])
                        name = parts[1]
                        gender = parts[2].lower() if parts[2] else 'combined'
                        
                        if name and place > 0:
                            results.append((name, gender, place))
                    except (ValueError, IndexError):
                        pass
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
    
    return results

def process_discipline(discipline_name):
    """Process all results for a discipline and generate rankings"""
    print(f"\nProcessing {discipline_name}...")
    
    discipline_dir = RESULTS_DIR / discipline_name
    if not discipline_dir.exists():
        print(f"  Discipline directory not found: {discipline_dir}")
        return
    
    # Collect all rider scores by gender and year
    rider_scores = defaultdict(lambda: defaultdict(lambda: defaultdict(float)))
    
    # Process each result file
    for result_file in sorted(discipline_dir.glob('*.txt')):
        filename = result_file.name
        year = extract_year_from_filename(filename)
        
        # Parse the file
        results = parse_results_file(result_file)
        if not results:
            continue
        
        num_competitors = len(results)
        
        # Determine event weight
        weight = 1.0
        for event_name, event_config in EVENTS.get(discipline_name, {}).items():
            if re.search(event_config['pattern'], filename):
                weight = event_config['weight']
                break
        
        # Calculate year decay
        year_diff = CURRENT_YEAR - year
        year_decay = SCORING_CONFIG['yearDecay'] ** max(0, year_diff)
        
        # Award points to each rider
        for name, gender, place in results:
            points = calculate_points(place, num_competitors, weight, year_decay)
            rider_scores[gender][year][name] += points
            
            # Also add to 'combined' (all riders)
            rider_scores['combined'][year][name] += points
        
        print(f"  Processed {filename}: {num_competitors} riders, weight={weight}")
    
    # Generate ranking JSON files
    for gender in rider_scores:
        for year in rider_scores[gender]:
            # Create sorted ranking list
            riders = rider_scores[gender][year]
            ranking = [
                {'name': name, 'points': int(points)}
                for name, points in sorted(riders.items(), key=lambda x: -x[1])
            ]
            
            # Save to JSON
            output_file = OUTPUT_DIR / f"{discipline_name.lower()}-{gender}-{year}.json"
            os.makedirs(OUTPUT_DIR, exist_ok=True)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(ranking, f, ensure_ascii=False, indent=2)
            
            print(f"    Saved: {output_file.name} ({len(ranking)} riders)")

def main():
    print("="*70)
    print("Exporting Real Rider Rankings")
    print("="*70)
    
    if not RESULTS_DIR.exists():
        print(f"Error: Results directory not found: {RESULTS_DIR}")
        return
    
    # Process each discipline
    for discipline in sorted(RESULTS_DIR.iterdir()):
        if discipline.is_dir() and discipline.name != '__pycache__':
            process_discipline(discipline.name)
    
    print("\n" + "="*70)
    print("Rankings exported successfully!")
    print("="*70)

if __name__ == '__main__':
    main()
