#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract real rankings from ranking.js using browser automation.
Loads ranking.js in a headless browser, extracts globalRowsByGender data, and exports to JSON.
"""

import json
import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).parent
OUTPUT_DIR = PROJECT_DIR / 'docs' / 'api' / 'rankings'

def check_node():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

def check_puppeteer():
    """Check if puppeteer is available"""
    try:
        result = subprocess.run(['npm', 'list', 'puppeteer'], capture_output=True, text=True, cwd=PROJECT_DIR)
        return 'puppeteer' in result.stdout
    except FileNotFoundError:
        return False

def create_extraction_script():
    """Create a Node.js script to extract rankings from ranking.js"""
    script = '''
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Loading ranking.js via browser...');
    
    // Create a minimal HTML that loads ranking.js
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        <script src="ranking.js"></script>
      </body>
      </html>
    `;
    
    const htmlFile = path.join(__dirname, 'temp-ranking.html');
    fs.writeFileSync(htmlFile, html);
    
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.goto('file://' + htmlFile, { waitUntil: 'networkidle0' });
    
    // Extract globalRowsByGender from browser context
    const rankings = await page.evaluate(() => {
      return window.globalRowsByGender || {};
    });
    
    console.log(JSON.stringify(rankings, null, 2));
    
    fs.unlinkSync(htmlFile);
    await browser.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
    '''
    
    script_path = PROJECT_DIR / 'extract-rankings.js'
    with open(script_path, 'w') as f:
        f.write(script)
    
    return script_path

def install_puppeteer():
    """Install puppeteer if not already installed"""
    print("Installing puppeteer...")
    result = subprocess.run(
        ['npm', 'install', 'puppeteer'],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    return result.returncode == 0

def extract_and_save_rankings():
    """Extract rankings using Node.js and Puppeteer"""
    
    # Check Node.js
    if not check_node():
        print("ERROR: Node.js is not installed")
        print("Please install Node.js from https://nodejs.org/")
        return False
    
    # Check/install Puppeteer
    if not check_puppeteer():
        print("Puppeteer not found, installing...")
        if not install_puppeteer():
            print("ERROR: Failed to install puppeteer")
            return False
    
    # Create extraction script
    script_path = create_extraction_script()
    
    print("Extracting rankings from ranking.js...")
    result = subprocess.run(
        ['node', str(script_path)],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"ERROR: {result.stderr}")
        return False
    
    try:
        rankings_data = json.loads(result.stdout)
        
        # Save to individual JSON files
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        
        for gender, riders in rankings_data.items():
            if isinstance(riders, list) and riders:
                # Create a reasonable filename
                # Format: discipline-gender-year.json
                # Since we're getting combined rankings, we'll save as a base file
                
                # Convert to our format: list of {name, points}
                ranking_list = [
                    {'name': rider.get('rider', ''), 'points': int(rider.get('points', 0))}
                    for rider in riders
                    if rider.get('rider')
                ]
                
                # For now, save with gender key
                output_file = OUTPUT_DIR / f'rankings-{gender}.json'
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(ranking_list, f, ensure_ascii=False, indent=2)
                
                print(f"Saved: {output_file.name} ({len(ranking_list)} riders)")
        
        return True
    
    except json.JSONDecodeError as e:
        print(f"ERROR: Failed to parse rankings: {e}")
        print(f"Output was: {result.stdout}")
        return False

if __name__ == '__main__':
    success = extract_and_save_rankings()
    sys.exit(0 if success else 1)
